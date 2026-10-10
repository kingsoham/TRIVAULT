import { computeSHA256 } from '../crypto/aes.js';

export interface ShardPayload {
  index: 1 | 2 | 3;
  buffer: Buffer;
  size: number;
  hash: string;
}

/**
 * Splits an encrypted Buffer payload into EXACTLY three logical shards.
 * Byte distribution is guaranteed to be total-preserving for any payload length.
 */
export function splitIntoThreeShards(encryptedPayload: Buffer): [ShardPayload, ShardPayload, ShardPayload] {
  const totalLength = encryptedPayload.length;

  const size1 = Math.ceil(totalLength / 3);
  const remainingAfter1 = totalLength - size1;
  const size2 = Math.ceil(remainingAfter1 / 2);
  const size3 = totalLength - size1 - size2;

  const shard1Buf = encryptedPayload.subarray(0, size1);
  const shard2Buf = encryptedPayload.subarray(size1, size1 + size2);
  const shard3Buf = encryptedPayload.subarray(size1 + size2, totalLength);

  return [
    {
      index: 1,
      buffer: shard1Buf,
      size: shard1Buf.length,
      hash: computeSHA256(shard1Buf),
    },
    {
      index: 2,
      buffer: shard2Buf,
      size: shard2Buf.length,
      hash: computeSHA256(shard2Buf),
    },
    {
      index: 3,
      buffer: shard3Buf,
      size: shard3Buf.length,
      hash: computeSHA256(shard3Buf),
    },
  ];
}

/**
 * Reconstructs the complete encrypted payload buffer from exactly three shards in order.
 * Validates integrity of each shard against its stored hash before joining.
 */
export function reconstructFromThreeShards(
  shards: [
    { index: number; buffer: Buffer; expectedHash: string },
    { index: number; buffer: Buffer; expectedHash: string },
    { index: number; buffer: Buffer; expectedHash: string }
  ]
): Buffer {
  // Sort shards by index to enforce 1 -> 2 -> 3 ordering
  const sorted = [...shards].sort((a, b) => a.index - b.index);

  if (sorted.length !== 3 || sorted[0].index !== 1 || sorted[1].index !== 2 || sorted[2].index !== 3) {
    throw new Error('Reconstruction failed: Exactly three valid shards (1, 2, 3) are required.');
  }

  // Validate integrity hash for each shard
  for (const item of sorted) {
    const actualHash = computeSHA256(item.buffer);
    if (actualHash !== item.expectedHash) {
      throw new Error(
        `Shard ${item.index} integrity verification failed! Expected hash ${item.expectedHash}, but got ${actualHash}`
      );
    }
  }

  // Concatenate buffers in exact sequence
  return Buffer.concat([sorted[0].buffer, sorted[1].buffer, sorted[2].buffer]);
}
