import mongoose from 'mongoose';

export interface IComment {
  _id: string;
  boardId: string;
  cardId: string;
  content: string;
  createdBy: string;
  mentions: string[];
  resolved: boolean;
  x?: number;
  y?: number;
  parentCommentId?: string;
  createdAt: Date;
}

const commentSchema = new mongoose.Schema<IComment>({
  boardId: { type: String, required: true },
  cardId: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: String, required: true },
  mentions: [{ type: String }],
  resolved: { type: Boolean, default: false },
  x: Number,
  y: Number,
  parentCommentId: String
}, {
  timestamps: true
});

// Indexes for performance
commentSchema.index({ boardId: 1 });
commentSchema.index({ cardId: 1 });
commentSchema.index({ createdBy: 1 });
commentSchema.index({ resolved: 1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);