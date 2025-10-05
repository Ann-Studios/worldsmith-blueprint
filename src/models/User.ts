import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  avatarUrl: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);