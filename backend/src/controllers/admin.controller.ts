import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { File } from '../models/File.js';
import { SecurityEvent } from '../models/SecurityEvent.js';

export async function resetSimulation(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Reset shard statuses back to AVAILABLE
    file.fileStatus = 'ACTIVE';
    file.shards.forEach((s) => {
      s.status = 'AVAILABLE';
    });
    await file.save();

    await SecurityEvent.create({
      eventType: 'ADMIN_RESET',
      fileId: file._id,
      filename: file.filename,
      requesterId: req.user.id,
      requesterEmail: req.user.email,
      reason: `Administrative reset restored file '${file.filename}' shards to AVAILABLE status.`,
      simulatedResponseStatus: 'RESET',
      adminResetDetails: {
        resetBy: req.user.id as any,
        resetByEmail: req.user.email,
        resetAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Administrative simulation reset complete. File shards restored to AVAILABLE.',
      fileId: file._id,
      filename: file.filename,
      fileStatus: file.fileStatus,
      shards: file.shards.map((s) => ({ index: s.index, status: s.status })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
