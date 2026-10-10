import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/trivault'),
  JWT_SECRET: z.string().default('trivault_secure_jwt_secret_key_2026_dev_environment_32chars'),
  MASTER_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  MINIO_ENDPOINT: z.string().default('127.0.0.1'),
  MINIO_PORT: z.string().default('9000'),
  MINIO_USE_SSL: z.string().transform((val) => val === 'true').default('false'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET_NAME: z.string().default('trivault-shards'),
  STORAGE_MODE: z.enum(['auto', 'minio', 'local']).default('auto'),
});

export const env = envSchema.parse(process.env);
