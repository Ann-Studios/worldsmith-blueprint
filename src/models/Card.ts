import mongoose from 'mongoose';

export interface IAttachment {
  _id: string;
  filename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export type CardType = 'note' | 'character' | 'location' | 'plot' | 'item';

export interface ICard {
  _id: string;
  boardId: string;
  type: CardType;
  x: number;
  y: number;
  title?: string;
  content: string;
  tags: string[];
  attachments: IAttachment[];
  createdBy: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new mongoose.Schema<IAttachment>({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const cardSchema = new mongoose.Schema<ICard>({
  boardId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['note', 'character', 'location', 'plot', 'item'], 
    required: true 
  },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  title: String,
  content: { type: String, default: '' },
  tags: [{ type: String }],
  attachments: [attachmentSchema],
  createdBy: { type: String, required: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes for performance
cardSchema.index({ boardId: 1 });
cardSchema.index({ type: 1 });
cardSchema.index({ tags: 1 });
cardSchema.index({ createdBy: 1 });

export const Card = mongoose.model<ICard>('Card', cardSchema);