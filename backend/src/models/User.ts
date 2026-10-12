import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'owner' | 'user' | 'admin';
  firebaseUid?: string;
  authProvider: 'local' | 'firebase';
  accountStatus: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['owner', 'user', 'admin'], default: 'owner' },
    firebaseUid: { type: String, sparse: true, index: true },
    authProvider: { type: String, enum: ['local', 'firebase'], default: 'local' },
    accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
