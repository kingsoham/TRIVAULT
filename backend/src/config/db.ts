import mongoose from 'mongoose';
import { env } from './env.js';

let mongoMemoryServerInstance: any = null;

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  // 1. Try connecting to configured MongoDB instance (with a short timeout so we don't hang if it's down)
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected successfully to ${env.MONGODB_URI}`);
    return;
  } catch (err: any) {
    console.warn(`[MongoDB] External MongoDB connection at ${env.MONGODB_URI} failed (${err.message}).`);
    console.log('[MongoDB] Launching embedded In-Memory MongoDB Server...');
  }

  // 2. Fall back automatically to MongoMemoryServer
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[MongoDB] Embedded In-Memory MongoDB running and connected at ${memoryUri}`);
  } catch (memErr: any) {
    console.error(`[MongoDB] Failed to initialize embedded In-Memory MongoDB: ${memErr.message}`);
    throw memErr;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
}
