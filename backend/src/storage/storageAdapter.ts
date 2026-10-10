import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

export interface StorageProvider {
  initialize(): Promise<void>;
  uploadShard(objectKey: string, buffer: Buffer): Promise<void>;
  getShard(objectKey: string): Promise<Buffer>;
  deleteShard(objectKey: string): Promise<void>;
  getMode(): 'minio' | 'local';
}

class MinioStorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.MINIO_BUCKET_NAME;
    const protocol = env.MINIO_USE_SSL ? 'https' : 'http';
    const endpoint = `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`;

    this.client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY,
        secretAccessKey: env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }

  getMode(): 'minio' | 'local' {
    return 'minio';
  }

  async initialize(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } else {
        throw err;
      }
    }
  }

  async uploadShard(objectKey: string, buffer: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: 'application/octet-stream',
      })
    );
  }

  async getShard(objectKey: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      })
    );

    if (!response.Body) {
      throw new Error(`Object ${objectKey} returned empty body from MinIO`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  async deleteShard(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      })
    );
  }
}

class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), 'local_storage', env.MINIO_BUCKET_NAME);
  }

  getMode(): 'minio' | 'local' {
    return 'local';
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private getFilePath(objectKey: string): string {
    // Sanitize objectKey to prevent path traversal
    const safeKey = objectKey.replace(/\\/g, '/').replace(/\.\./g, '');
    return path.join(this.basePath, safeKey);
  }

  async uploadShard(objectKey: string, buffer: Buffer): Promise<void> {
    const filePath = this.getFilePath(objectKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async getShard(objectKey: string): Promise<Buffer> {
    const filePath = this.getFilePath(objectKey);
    return await fs.readFile(filePath);
  }

  async deleteShard(objectKey: string): Promise<void> {
    const filePath = this.getFilePath(objectKey);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

class StorageManager {
  private activeProvider: StorageProvider | null = null;

  async getProvider(): Promise<StorageProvider> {
    if (this.activeProvider) return this.activeProvider;

    if (env.STORAGE_MODE === 'local') {
      const local = new LocalStorageProvider();
      await local.initialize();
      this.activeProvider = local;
      console.log('[StorageManager] Using LOCAL Disk Storage Provider');
      return local;
    }

    if (env.STORAGE_MODE === 'minio') {
      const minio = new MinioStorageProvider();
      await minio.initialize();
      this.activeProvider = minio;
      console.log('[StorageManager] Using MinIO S3 Object Storage Provider');
      return minio;
    }

    // STORAGE_MODE = 'auto': Try MinIO first, fall back to Local Disk
    try {
      const minio = new MinioStorageProvider();
      await minio.initialize();
      this.activeProvider = minio;
      console.log('[StorageManager] MinIO connected successfully. Using MinIO Provider.');
      return minio;
    } catch (err: any) {
      console.warn(`[StorageManager] MinIO unavailable (${err.message}). Falling back to Local Disk Storage.`);
      const local = new LocalStorageProvider();
      await local.initialize();
      this.activeProvider = local;
      return local;
    }
  }
}

export const storageManager = new StorageManager();
