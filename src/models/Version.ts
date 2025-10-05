import mongoose from 'mongoose';

export interface IVersion {
  _id: string;
  boardId: string;
  versionNumber: number;
  description?: string;
  snapshot: any; // Complete board state
  createdBy: string;
  createdAt: Date;
}

const versionSchema = new mongoose.Schema<IVersion>({
  boardId: { type: String, required: true },
  versionNumber: { type: Number, required: true },
  description: String,
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Indexes for performance
versionSchema.index({ boardId: 1 });
versionSchema.index({ versionNumber: 1 });

export const Version = mongoose.model<IVersion>('Version', versionSchema);