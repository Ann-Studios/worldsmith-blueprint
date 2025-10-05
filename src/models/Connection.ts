import mongoose from 'mongoose';

export type ConnectionType = 'relationship' | 'dependency' | 'timeline' | 'custom';

export interface IConnection {
  _id: string;
  boardId: string;
  fromCardId: string;
  toCardId: string;
  label?: string;
  type: ConnectionType;
  color?: string;
  createdBy: string;
  createdAt: Date;
}

const connectionSchema = new mongoose.Schema<IConnection>({
  boardId: { type: String, required: true },
  fromCardId: { type: String, required: true },
  toCardId: { type: String, required: true },
  label: String,
  type: { 
    type: String, 
    enum: ['relationship', 'dependency', 'timeline', 'custom'], 
    default: 'relationship' 
  },
  color: String,
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Indexes for performance
connectionSchema.index({ boardId: 1 });
connectionSchema.index({ fromCardId: 1 });
connectionSchema.index({ toCardId: 1 });

export const Connection = mongoose.model<IConnection>('Connection', connectionSchema);