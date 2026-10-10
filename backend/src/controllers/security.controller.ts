import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { File } from '../models/File.js';

export async function getSecurityEvents(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const eventType = req.query.eventType as string;
    const fileId = req.query.fileId as string;

    const query: any = {};
    if (eventType) query.eventType = eventType;
    if (fileId) query.fileId = fileId;

    const events = await SecurityEvent.find(query)
      .populate('requesterId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SecurityEvent.countDocuments(query);

    return res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      events,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getFileShardStates(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    return res.json({
      success: true,
      fileId: file._id,
      filename: file.filename,
      fileStatus: file.fileStatus,
      shards: file.shards.map((s) => ({
        index: s.index,
        status: s.status,
        storedSize: s.storedSize,
        hashPrefix: s.integrityHash.substring(0, 12) + '...',
        objectKeyRef: `minio://${file._id}/shard_${s.index}.bin`,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function simulateUnauthorizedAccess(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Trigger simulated destruction
    file.fileStatus = 'SIMULATION_LOCKED';
    file.shards.forEach((s) => {
      s.status = 'SIMULATED_DESTROYED';
    });
    await file.save();

    await SecurityEvent.create({
      eventType: 'SIMULATED_UNAUTHORIZED_ACCESS_TRIGGERED',
      fileId: file._id,
      filename: file.filename,
      requesterId: req.user.id,
      requesterEmail: req.user.email,
      reason: `Manual simulation triggered for demonstration by ${req.user.email}`,
      simulatedResponseStatus: 'ACTIVE',
    });

    return res.json({
      success: true,
      message: 'Simulated unauthorized access attack triggered. All 3 shards set to SIMULATED_DESTROYED.',
      fileId: file._id,
      filename: file.filename,
      fileStatus: file.fileStatus,
      shards: file.shards.map((s) => ({ index: s.index, status: s.status })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
