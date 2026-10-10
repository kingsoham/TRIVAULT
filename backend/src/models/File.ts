import mongoose, { Schema, Document } from 'mongoose';

export type ShardStatus = 'AVAILABLE' | 'SIMULATED_DESTROYED' | 'MISSING' | 'CORRUPTED';
export type FileStatus = 'ACTIVE' | 'SIMULATION_LOCKED' | 'DELETED';

export interface IShardMeta {
  index: 1 | 2 | 3;
  objectKey: string;
  storedSize: number;
  integrityHash: string;
  status: ShardStatus;
}

export interface IEncryptionMetadata {
  ivHex: string;
  authTagHex: string;
  encryptedDekHex: string;
  dekIvHex: string;
  dekAuthTagHex: string;
  algorithm: string;
}

export interface ISharingPermission {
  user: mongoose.Types.ObjectId;
  permission: 'read';
}

export interface IFile extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  filename: string;
  mimeType: string;
  originalSize: number;
  encryptedSize: number;
  encryptionMetadata: IEncryptionMetadata;
  shards: [IShardMeta, IShardMeta, IShardMeta];
  fileStatus: FileStatus;
  sharingPermissions: ISharingPermission[];
  createdAt: Date;
  updatedAt: Date;
}

const ShardMetaSchema = new Schema<IShardMeta>(
  {
    index: { type: Number, required: true, enum: [1, 2, 3] },
    objectKey: { type: String, required: true },
    storedSize: { type: Number, required: true },
    integrityHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'SIMULATED_DESTROYED', 'MISSING', 'CORRUPTED'],
      default: 'AVAILABLE',
    },
  },
  { _id: false }
);

const EncryptionMetadataSchema = new Schema<IEncryptionMetadata>(
  {
    ivHex: { type: String, required: true },
    authTagHex: { type: String, required: true },
    encryptedDekHex: { type: String, required: true },
    dekIvHex: { type: String, required: true },
    dekAuthTagHex: { type: String, required: true },
    algorithm: { type: String, default: 'aes-256-gcm' },
  },
  { _id: false }
);

const SharingPermissionSchema = new Schema<ISharingPermission>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permission: { type: String, enum: ['read'], default: 'read' },
  },
  { _id: false }
);

const FileSchema = new Schema<IFile>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    originalSize: { type: Number, required: true },
    encryptedSize: { type: Number, required: true },
    encryptionMetadata: { type: EncryptionMetadataSchema, required: true },
    shards: {
      type: [ShardMetaSchema],
      validate: [
        (val: IShardMeta[]) => val.length === 3,
        'File must have exactly three shards (Shard 1, Shard 2, Shard 3)',
      ],
      required: true,
    },
    fileStatus: {
      type: String,
      enum: ['ACTIVE', 'SIMULATION_LOCKED', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
    sharingPermissions: [SharingPermissionSchema],
  },
  { timestamps: true }
);

export const File = mongoose.model<IFile>('File', FileSchema);
