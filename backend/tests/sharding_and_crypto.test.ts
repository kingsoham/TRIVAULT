import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { encryptFileBuffer, decryptFileBuffer, computeSHA256 } from '../src/crypto/aes.js';
import { splitIntoThreeShards, reconstructFromThreeShards } from '../src/sharding/shardSplitter.js';

describe('TriVault Encryption & AES-256-GCM', () => {
  it('should encrypt and decrypt plaintext accurately', () => {
    const originalText = 'TriVault Top Secret Document Content 2026';
    const plainBuffer = Buffer.from(originalText, 'utf-8');

    const encryption = encryptFileBuffer(plainBuffer);

    expect(encryption.encryptedBuffer).toBeDefined();
    expect(encryption.encryptedBuffer.toString()).not.toEqual(originalText);
    expect(encryption.ivHex).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encryption.authTagHex).toHaveLength(32); // 16 bytes = 32 hex chars

    const decryptedBuffer = decryptFileBuffer({
      encryptedBuffer: encryption.encryptedBuffer,
      ivHex: encryption.ivHex,
      authTagHex: encryption.authTagHex,
      encryptedDekHex: encryption.encryptedDekHex,
      dekIvHex: encryption.dekIvHex,
      dekAuthTagHex: encryption.dekAuthTagHex,
    });

    expect(decryptedBuffer.toString('utf-8')).toEqual(originalText);
  });

  it('should reject decryption when authentication tag is tampered', () => {
    const plainBuffer = Buffer.from('Sensitive payload', 'utf-8');
    const encryption = encryptFileBuffer(plainBuffer);

    // Tamper auth tag
    const tamperedTag = '00'.repeat(16);

    expect(() => {
      decryptFileBuffer({
        encryptedBuffer: encryption.encryptedBuffer,
        ivHex: encryption.ivHex,
        authTagHex: tamperedTag,
        encryptedDekHex: encryption.encryptedDekHex,
        dekIvHex: encryption.dekIvHex,
        dekAuthTagHex: encryption.dekAuthTagHex,
      });
    }).toThrow(/Authentication Tag Verification Failed/);
  });

  it('should reject decryption when ciphertext bytes are corrupted', () => {
    const plainBuffer = Buffer.from('Important payload data', 'utf-8');
    const encryption = encryptFileBuffer(plainBuffer);

    // Corrupt one byte of ciphertext
    const corruptedCiphertext = Buffer.from(encryption.encryptedBuffer);
    corruptedCiphertext[0] = corruptedCiphertext[0] ^ 0xff;

    expect(() => {
      decryptFileBuffer({
        encryptedBuffer: corruptedCiphertext,
        ivHex: encryption.ivHex,
        authTagHex: encryption.authTagHex,
        encryptedDekHex: encryption.encryptedDekHex,
        dekIvHex: encryption.dekIvHex,
        dekAuthTagHex: encryption.dekAuthTagHex,
      });
    }).toThrow();
  });
});

describe('TriVault Exact 3-Shard Byte Splitter & Reconstruction', () => {
  it('should split any buffer into EXACTLY 3 shards preserving every single byte', () => {
    const testCases = [
      Buffer.from('Hello World', 'utf-8'), // 11 bytes
      Buffer.from('A', 'utf-8'), // 1 byte
      Buffer.from('', 'utf-8'), // 0 bytes
      crypto.randomBytes(100), // 100 random binary bytes
      crypto.randomBytes(1024 * 50), // 50 KB binary file
    ];

    for (const testBuf of testCases) {
      const shards = splitIntoThreeShards(testBuf);

      expect(shards).toHaveLength(3);
      expect(shards[0].index).toBe(1);
      expect(shards[1].index).toBe(2);
      expect(shards[2].index).toBe(3);

      const totalShardBytes = shards[0].size + shards[1].size + shards[2].size;
      expect(totalShardBytes).toEqual(testBuf.length);

      const reconstructedBuf = reconstructFromThreeShards([
        { index: 1, buffer: shards[0].buffer, expectedHash: shards[0].hash },
        { index: 2, buffer: shards[1].buffer, expectedHash: shards[1].hash },
        { index: 3, buffer: shards[2].buffer, expectedHash: shards[2].hash },
      ]);

      expect(Buffer.compare(reconstructedBuf, testBuf)).toBe(0);
    }
  });

  it('should fail reconstruction if any shard integrity hash does not match', () => {
    const buf = Buffer.from('Confidential Data Stream', 'utf-8');
    const shards = splitIntoThreeShards(buf);

    // Corrupt Shard 2 buffer
    const corruptedShard2Buf = Buffer.from(shards[1].buffer);
    if (corruptedShard2Buf.length > 0) {
      corruptedShard2Buf[0] = corruptedShard2Buf[0] ^ 0xff;
    }

    expect(() => {
      reconstructFromThreeShards([
        { index: 1, buffer: shards[0].buffer, expectedHash: shards[0].hash },
        { index: 2, buffer: corruptedShard2Buf, expectedHash: shards[1].hash },
        { index: 3, buffer: shards[2].buffer, expectedHash: shards[2].hash },
      ]);
    }).toThrow(/integrity verification failed/);
  });
});
