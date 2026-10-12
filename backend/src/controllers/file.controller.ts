import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { encryptFileBuffer, decryptFileBuffer } from '../crypto/aes.js';
import { splitIntoThreeShards, reconstructFromThreeShards } from '../sharding/shardSplitter.js';
import { storageManager } from '../storage/storageAdapter.js';

export async function uploadFile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  // Role Authorization: Only Vault Owners and Admins are permitted to upload and partition files
  if (currentUser.role === 'user') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only Vault Owners or Security Administrators can upload and shard files. Standard Users have read/download access to authorized files.',
    });
  }

  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const fileId = new mongoose.Types.ObjectId();
  const rawBuffer = req.file.buffer;
  const filename = req.file.originalname;
  const mimeType = req.file.mimetype || 'application/octet-stream';
  const originalSize = rawBuffer.length;

  let uploadedKeys: string[] = [];

  try {
    // 1. Encrypt using AES-256-GCM
    const encryption = encryptFileBuffer(rawBuffer);
    const encryptedBuffer = encryption.encryptedBuffer;
    const encryptedSize = encryptedBuffer.length;

    // 2. Split into EXACTLY 3 shards
    const [shard1, shard2, shard3] = splitIntoThreeShards(encryptedBuffer);

    // 3. Store shards in Object Storage Provider
    const storage = await storageManager.getProvider();
    const key1 = `shards/${fileId.toString()}/shard_1.bin`;
    const key2 = `shards/${fileId.toString()}/shard_2.bin`;
    const key3 = `shards/${fileId.toString()}/shard_3.bin`;

    await storage.uploadShard(key1, shard1.buffer);
    uploadedKeys.push(key1);

    await storage.uploadShard(key2, shard2.buffer);
    uploadedKeys.push(key2);

    await storage.uploadShard(key3, shard3.buffer);
    uploadedKeys.push(key3);

    // 4. Save metadata in MongoDB
    const fileDoc = await File.create({
      _id: fileId,
      owner: currentUser.id,
      filename,
      mimeType,
      originalSize,
      encryptedSize,
      encryptionMetadata: {
        ivHex: encryption.ivHex,
        authTagHex: encryption.authTagHex,
        encryptedDekHex: encryption.encryptedDekHex,
        dekIvHex: encryption.dekIvHex,
        dekAuthTagHex: encryption.dekAuthTagHex,
        algorithm: 'aes-256-gcm',
      },
      shards: [
        {
          index: 1,
          objectKey: key1,
          storedSize: shard1.size,
          integrityHash: shard1.hash,
          status: 'AVAILABLE',
        },
        {
          index: 2,
          objectKey: key2,
          storedSize: shard2.size,
          integrityHash: shard2.hash,
          status: 'AVAILABLE',
        },
        {
          index: 3,
          objectKey: key3,
          storedSize: shard3.size,
          integrityHash: shard3.hash,
          status: 'AVAILABLE',
        },
      ],
      fileStatus: 'ACTIVE',
      sharingPermissions: [],
    });

    // 5. Log Security & Audit Event
    await SecurityEvent.create({
      eventType: 'FILE_UPLOAD',
      fileId: fileDoc._id,
      filename,
      requesterId: currentUser.id,
      requesterEmail: currentUser.email,
      reason: `Uploaded file '${filename}' (${originalSize} bytes) encrypted and split into 3 shards`,
      simulatedResponseStatus: 'NONE',
    });

    return res.status(201).json({
      success: true,
      message: 'File encrypted, sharded into 3 parts, and stored securely',
      file: {
        id: fileDoc._id,
        filename: fileDoc.filename,
        mimeType: fileDoc.mimeType,
        originalSize: fileDoc.originalSize,
        encryptedSize: fileDoc.encryptedSize,
        fileStatus: fileDoc.fileStatus,
        createdAt: fileDoc.createdAt,
        shards: fileDoc.shards.map((s) => ({
          index: s.index,
          storedSize: s.storedSize,
          status: s.status,
          hash: s.integrityHash,
        })),
      },
    });
  } catch (err: any) {
    if (uploadedKeys.length > 0) {
      const storage = await storageManager.getProvider();
      for (const k of uploadedKeys) {
        await storage.deleteShard(k).catch(() => {});
      }
    }
    return res.status(500).json({ success: false, message: `Upload failed: ${err.message}` });
  }
}

export async function listFiles(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    let query: any = {};
    if (currentUser.role !== 'admin') {
      query = {
        $or: [
          { owner: currentUser.id },
          { 'sharingPermissions.user': currentUser.id },
        ],
        fileStatus: { $ne: 'DELETED' },
      };
    } else {
      query = { fileStatus: { $ne: 'DELETED' } };
    }

    const files = await File.find(query).populate('owner', 'name email').sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: files.length,
      files: files.map((f) => ({
        id: f._id,
        filename: f.filename,
        mimeType: f.mimeType,
        originalSize: f.originalSize,
        encryptedSize: f.encryptedSize,
        owner: f.owner,
        fileStatus: f.fileStatus,
        shards: f.shards.map((s) => ({
          index: s.index,
          storedSize: s.storedSize,
          status: s.status,
          objectKey: s.objectKey,
          integrityHash: s.integrityHash,
        })),
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getFileDetails(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    const file = await File.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('sharingPermissions.user', 'name email role');
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner._id.toString() === currentUser.id;
    const isShared = file.sharingPermissions.some((p) => p.user && (p.user as any)._id.toString() === currentUser.id);
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isShared && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized file access denied.' });
    }

    return res.json({
      success: true,
      file: {
        id: file._id,
        filename: file.filename,
        mimeType: file.mimeType,
        originalSize: file.originalSize,
        encryptedSize: file.encryptedSize,
        owner: file.owner,
        isOwner,
        isShared,
        sharingPermissions: file.sharingPermissions,
        fileStatus: file.fileStatus,
        encryptionAlgorithm: file.encryptionMetadata.algorithm,
        shards: file.shards.map((s) => ({
          index: s.index,
          storedSize: s.storedSize,
          status: s.status,
          integrityHash: s.integrityHash,
          objectKeyRef: s.objectKey,
        })),
        createdAt: file.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function downloadFile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    const fileId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID format' });
    }

    const file = await File.findById(fileId).populate('owner', 'name email');
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner._id.toString() === currentUser.id;
    const isShared = file.sharingPermissions.some((p) => p.user.toString() === currentUser.id);

    // --------------------------------------------------------------------------
    // SPECIAL SECURITY FEATURE: UNAUTHORIZED ACCESS RESPONSE & SIMULATION
    // --------------------------------------------------------------------------
    if (!isOwner && !isShared) {
      // 1. Activate simulated shard-destruction response for affected file
      file.fileStatus = 'SIMULATION_LOCKED';
      file.shards.forEach((s) => {
        s.status = 'SIMULATED_DESTROYED';
      });
      await file.save();

      // 2. Log Security Event
      await SecurityEvent.create({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        fileId: file._id,
        filename: file.filename,
        requesterId: currentUser.id,
        requesterEmail: currentUser.email,
        reason: `Unauthorized download attempt by ${currentUser.email}. Triggered simulated shard-destruction response.`,
        simulatedResponseStatus: 'ACTIVE',
      });

      await SecurityEvent.create({
        eventType: 'SIMULATED_DESTRUCTION_TRIGGERED',
        fileId: file._id,
        filename: file.filename,
        requesterId: currentUser.id,
        requesterEmail: currentUser.email,
        reason: `All 3 shards for file '${file.filename}' marked as SIMULATED_DESTROYED. Reconstruction blocked.`,
        simulatedResponseStatus: 'ACTIVE',
      });

      return res.status(403).json({
        success: false,
        message: 'UNAUTHORIZED FILE ACCESS DENIED. Security protocol activated: Simulated shard destruction lock engaged.',
        simulationActivated: true,
        fileId: file._id,
        filename: file.filename,
        shardStates: file.shards.map((s) => ({ index: s.index, status: s.status })),
      });
    }

    // Check if file is currently locked under simulation or missing shards
    if (file.fileStatus === 'SIMULATION_LOCKED' || file.shards.some((s) => s.status !== 'AVAILABLE')) {
      await SecurityEvent.create({
        eventType: 'RECONSTRUCTION_BLOCKED',
        fileId: file._id,
        filename: file.filename,
        requesterId: currentUser.id,
        requesterEmail: currentUser.email,
        reason: `Download blocked: File '${file.filename}' shards are locked in SIMULATED_DESTROYED or unavailable state.`,
        simulatedResponseStatus: 'ACTIVE',
      });

      return res.status(423).json({
        success: false,
        message: 'FILE RECONSTRUCTION BLOCKED: File is currently locked under simulated shard-destruction response. Contact administrator to reset.',
        fileId: file._id,
        filename: file.filename,
        fileStatus: file.fileStatus,
        shards: file.shards.map((s) => ({ index: s.index, status: s.status })),
      });
    }

    // --------------------------------------------------------------------------
    // AUTHORIZED FILE RETRIEVAL & RECONSTRUCTION
    // --------------------------------------------------------------------------
    const storage = await storageManager.getProvider();

    const s1Buf = await storage.getShard(file.shards[0].objectKey);
    const s2Buf = await storage.getShard(file.shards[1].objectKey);
    const s3Buf = await storage.getShard(file.shards[2].objectKey);

    const encryptedPayload = reconstructFromThreeShards([
      { index: file.shards[0].index, buffer: s1Buf, expectedHash: file.shards[0].integrityHash },
      { index: file.shards[1].index, buffer: s2Buf, expectedHash: file.shards[1].integrityHash },
      { index: file.shards[2].index, buffer: s3Buf, expectedHash: file.shards[2].integrityHash },
    ]);

    const decryptedFileBuffer = decryptFileBuffer({
      encryptedBuffer: encryptedPayload,
      ivHex: file.encryptionMetadata.ivHex,
      authTagHex: file.encryptionMetadata.authTagHex,
      encryptedDekHex: file.encryptionMetadata.encryptedDekHex,
      dekIvHex: file.encryptionMetadata.dekIvHex,
      dekAuthTagHex: file.encryptionMetadata.dekAuthTagHex,
    });

    await SecurityEvent.create({
      eventType: 'FILE_DOWNLOAD_SUCCESS',
      fileId: file._id,
      filename: file.filename,
      requesterId: currentUser.id,
      requesterEmail: currentUser.email,
      reason: `Authorized download and successful 3-shard reconstruction of '${file.filename}'`,
      simulatedResponseStatus: 'NONE',
    });

    const safeFilename = encodeURIComponent(file.filename);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', decryptedFileBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`);

    return res.send(decryptedFileBuffer);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Retrieval failed: ${err.message}` });
  }
}

export async function deleteFile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this file' });
    }

    const storage = await storageManager.getProvider();
    for (const shard of file.shards) {
      await storage.deleteShard(shard.objectKey).catch(() => {});
    }

    file.fileStatus = 'DELETED';
    await file.save();

    await SecurityEvent.create({
      eventType: 'FILE_DELETED',
      fileId: file._id,
      filename: file.filename,
      requesterId: currentUser.id,
      requesterEmail: currentUser.email,
      reason: `File '${file.filename}' was deleted by user/admin`,
      simulatedResponseStatus: 'NONE',
    });

    return res.json({ success: true, message: 'File and all associated shards deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function shareFile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the Vault Owner or Security Administrator can grant access to this file.' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: `User with email '${email}' was not found. Please ensure they have registered an account.` });
    }

    if (targetUser._id.toString() === file.owner.toString()) {
      return res.status(400).json({ success: false, message: 'User is already the owner of this vault.' });
    }

    const alreadyShared = file.sharingPermissions.some((p) => p.user.toString() === targetUser._id.toString());
    if (alreadyShared) {
      return res.status(400).json({ success: false, message: `Access is already granted to '${targetUser.email}'.` });
    }

    file.sharingPermissions.push({ user: targetUser._id, permission: 'read' });
    await file.save();

    await SecurityEvent.create({
      eventType: 'ACCESS_GRANTED',
      fileId: file._id,
      filename: file.filename,
      requesterId: currentUser.id,
      requesterEmail: currentUser.email,
      reason: `Vault Owner granted read access to '${targetUser.email}'`,
      simulatedResponseStatus: 'NONE',
    });

    const populatedFile = await File.findById(file._id).populate('sharingPermissions.user', 'name email role');

    return res.json({
      success: true,
      message: `Access to 3-shard file '${file.filename}' granted to ${targetUser.email}.`,
      sharingPermissions: populatedFile?.sharingPermissions || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function revokeSharing(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
  const currentUser = req.user;

  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileStatus === 'DELETED') {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const isOwner = file.owner.toString() === currentUser.id;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only the Vault Owner or Security Administrator can revoke access.' });
    }

    const targetUserId = req.params.userId;
    file.sharingPermissions = file.sharingPermissions.filter(
      (p) => p.user.toString() !== targetUserId
    );
    await file.save();

    await SecurityEvent.create({
      eventType: 'ACCESS_REVOKED',
      fileId: file._id,
      filename: file.filename,
      requesterId: currentUser.id,
      requesterEmail: currentUser.email,
      reason: `Vault Owner revoked file access for user ID ${targetUserId}`,
      simulatedResponseStatus: 'NONE',
    });

    const populatedFile = await File.findById(file._id).populate('sharingPermissions.user', 'name email role');

    return res.json({
      success: true,
      message: 'Access revoked successfully.',
      sharingPermissions: populatedFile?.sharingPermissions || [],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
