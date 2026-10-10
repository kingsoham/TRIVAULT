import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventType: string;
  fileId?: mongoose.Types.ObjectId;
  filename?: string;
  requesterId?: mongoose.Types.ObjectId;
  requesterEmail?: string;
  timestamp: Date;
  reason: string;
  simulatedResponseStatus: 'ACTIVE' | 'RESET' | 'NONE';
  adminResetDetails?: {
    resetBy?: mongoose.Types.ObjectId;
    resetByEmail?: string;
    resetAt?: Date;
  };
  ipAddress?: string;
  userAgent?: string;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    fileId: { type: Schema.Types.ObjectId, ref: 'File', index: true },
    filename: { type: String },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User' },
    requesterEmail: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    reason: { type: String, required: true },
    simulatedResponseStatus: {
      type: String,
      enum: ['ACTIVE', 'RESET', 'NONE'],
      default: 'NONE',
    },
    adminResetDetails: {
      resetBy: { type: Schema.Types.ObjectId, ref: 'User' },
      resetByEmail: { type: String },
      resetAt: { type: Date },
    },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const SecurityEvent = mongoose.model<ISecurityEvent>('SecurityEvent', SecurityEventSchema);
