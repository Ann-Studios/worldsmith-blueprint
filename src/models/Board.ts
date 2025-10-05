import mongoose from 'mongoose';

export interface IPermission {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  grantedBy: string;
  grantedAt: Date;
}

export interface IBoard {
  _id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  createdBy: string;
  permissions: IPermission[];
  tags: string[];
  templateId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new mongoose.Schema<IPermission>({
  userId: { type: String, required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
  grantedBy: { type: String, required: true },
  grantedAt: { type: Date, default: Date.now }
});

const boardSchema = new mongoose.Schema<IBoard>({
  name: { type: String, required: true },
  description: String,
  parentFolderId: String,
  createdBy: { type: String, required: true },
  permissions: [permissionSchema],
  tags: [{ type: String }],
  templateId: String,
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes for performance
boardSchema.index({ createdBy: 1 });
boardSchema.index({ 'permissions.userId': 1 });
boardSchema.index({ tags: 1 });
boardSchema.index({ isPublic: 1 });

export const Board = mongoose.model<IBoard>('Board', boardSchema);