import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits standard for GCM
const KEY_LENGTH_BYTES = 32; // 256 bits

export interface EncryptionResult {
  encryptedBuffer: Buffer;
  ivHex: string;
  authTagHex: string;
  encryptedDekHex: string;
  dekIvHex: string;
  dekAuthTagHex: string;
}

export interface DecryptionParams {
  encryptedBuffer: Buffer;
  ivHex: string;
  authTagHex: string;
  encryptedDekHex: string;
  dekIvHex: string;
  dekAuthTagHex: string;
}

// Master Key derived or hex parsed
function getMasterKey(): Buffer {
  let masterHex = env.MASTER_ENCRYPTION_KEY;
  if (masterHex.length < 64) {
    masterHex = crypto.createHash('sha256').update(masterHex).digest('hex');
  }
  return Buffer.from(masterHex.slice(0, 64), 'hex');
}

/**
 * Encrypt a data encryption key (DEK) using the Master Key (Envelope Encryption)
 */
function encryptDEK(dek: Buffer): { encryptedDekHex: string; dekIvHex: string; dekAuthTagHex: string } {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  
  const encryptedDek = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedDekHex: encryptedDek.toString('hex'),
    dekIvHex: iv.toString('hex'),
    dekAuthTagHex: authTag.toString('hex'),
  };
}

/**
 * Decrypt an encrypted DEK using the Master Key
 */
function decryptDEK(encryptedDekHex: string, dekIvHex: string, dekAuthTagHex: string): Buffer {
  const masterKey = getMasterKey();
  const iv = Buffer.from(dekIvHex, 'hex');
  const authTag = Buffer.from(dekAuthTagHex, 'hex');
  const encryptedDek = Buffer.from(encryptedDekHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
}

/**
 * Encrypt file buffer using AES-256-GCM with a fresh DEK and IV
 */
export function encryptFileBuffer(plainBuffer: Buffer): EncryptionResult {
  // 1. Generate unique 32-byte DEK & 12-byte IV
  const dek = crypto.randomBytes(KEY_LENGTH_BYTES);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  // 2. Encrypt plaintext payload
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 3. Encrypt DEK using Master Key (Envelope Encryption)
  const { encryptedDekHex, dekIvHex, dekAuthTagHex } = encryptDEK(dek);

  return {
    encryptedBuffer,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    encryptedDekHex,
    dekIvHex,
    dekAuthTagHex,
  };
}

/**
 * Decrypt file payload buffer using AES-256-GCM.
 * Validates auth tag and throws error if corrupted or tampered.
 */
export function decryptFileBuffer(params: DecryptionParams): Buffer {
  const { encryptedBuffer, ivHex, authTagHex, encryptedDekHex, dekIvHex, dekAuthTagHex } = params;

  // 1. Decrypt DEK
  const dek = decryptDEK(encryptedDekHex, dekIvHex, dekAuthTagHex);

  // 2. Decrypt Payload
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, dek, iv);
  decipher.setAuthTag(authTag);

  try {
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decryptedBuffer;
  } catch (err: any) {
    throw new Error(`AES-GCM Authentication Tag Verification Failed: Data is corrupted or tampered (${err.message})`);
  }
}

/**
 * Generate SHA-256 hash string for a buffer
 */
export function computeSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
