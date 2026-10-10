import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { File } from '../models/File.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { encryptFileBuffer } from '../crypto/aes.js';
import { splitIntoThreeShards } from '../sharding/shardSplitter.js';
import { storageManager } from '../storage/storageAdapter.js';

export async function seedDatabase(shouldExit = false): Promise<void> {
  console.log('[Seed] Starting database seed...');
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // Clear existing demo data
  await User.deleteMany({});
  await File.deleteMany({});
  await SecurityEvent.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminSecret123!', 10);

  // 1. Create standard demo user
  const demoUser = await User.create({
    name: 'Alex Mercer (Owner)',
    email: 'user@trivault.io',
    passwordHash,
    role: 'user',
  });

  // 2. Create unauthorized demo user (attacker simulation)
  const hackerUser = await User.create({
    name: 'Unauthorized User',
    email: 'hacker@trivault.io',
    passwordHash,
    role: 'user',
  });

  // 3. Create admin user
  const adminUser = await User.create({
    name: 'Security Admin',
    email: 'admin@trivault.io',
    passwordHash: adminPasswordHash,
    role: 'admin',
  });

  console.log('[Seed] Demo accounts created successfully:');
  console.log('  - Owner User:        user@trivault.io / Password123!');
  console.log('  - Unauthorized User: hacker@trivault.io / Password123!');
  console.log('  - Security Admin:    admin@trivault.io / AdminSecret123!');

  // Create a sample seed file for user@trivault.io
  const sampleContent = Buffer.from('TOP SECRET FIELD REPORT: TriVault 3-Shard Cloud Security Infrastructure is Operational.');
  const fileId = new mongoose.Types.ObjectId();
  const encryption = encryptFileBuffer(sampleContent);
  const [s1, s2, s3] = splitIntoThreeShards(encryption.encryptedBuffer);

  const storage = await storageManager.getProvider();
  const key1 = `shards/${fileId.toString()}/shard_1.bin`;
  const key2 = `shards/${fileId.toString()}/shard_2.bin`;
  const key3 = `shards/${fileId.toString()}/shard_3.bin`;

  await storage.uploadShard(key1, s1.buffer);
  await storage.uploadShard(key2, s2.buffer);
  await storage.uploadShard(key3, s3.buffer);

  const fileDoc = await File.create({
    _id: fileId,
    owner: demoUser._id,
    filename: 'classified_field_report.txt',
    mimeType: 'text/plain',
    originalSize: sampleContent.length,
    encryptedSize: encryption.encryptedBuffer.length,
    encryptionMetadata: {
      ivHex: encryption.ivHex,
      authTagHex: encryption.authTagHex,
      encryptedDekHex: encryption.encryptedDekHex,
      dekIvHex: encryption.dekIvHex,
      dekAuthTagHex: encryption.dekAuthTagHex,
      algorithm: 'aes-256-gcm',
    },
    shards: [
      { index: 1, objectKey: key1, storedSize: s1.size, integrityHash: s1.hash, status: 'AVAILABLE' },
      { index: 2, objectKey: key2, storedSize: s2.size, integrityHash: s2.hash, status: 'AVAILABLE' },
      { index: 3, objectKey: key3, storedSize: s3.size, integrityHash: s3.hash, status: 'AVAILABLE' },
    ],
    fileStatus: 'ACTIVE',
  });

  await SecurityEvent.create({
    eventType: 'FILE_UPLOAD',
    fileId: fileDoc._id,
    filename: fileDoc.filename,
    requesterId: demoUser._id,
    requesterEmail: demoUser.email,
    reason: 'Initial system seed file uploaded',
    simulatedResponseStatus: 'NONE',
  });

  console.log('[Seed] Sample sharded file created: classified_field_report.txt');

  if (shouldExit) {
    process.exit(0);
  }
}

// Auto-run if script is invoked directly
const isDirectCli = process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));
if (isDirectCli) {
  seedDatabase(true).catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}
