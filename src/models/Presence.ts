import mongoose from 'mongoose';

export interface IPresence {
  _id: string;
  userId: string;
  boardId: string;
  cursorX?: number;
  cursorY?: number;
  currentCardId?: string;
  lastSeen: Date;
}

const presenceSchema = new mongoose.Schema<IPresence>({
  userId: { type: String, required: true },
  boardId: { type: String, required: true },
  cursorX: Number,
  cursorY: Number,
  currentCardId: String,
  lastSeen: { type: Date, default: Date.now }
});

// Compound unique index
presenceSchema.index({ userId: 1, boardId: 1 }, { unique: true });
presenceSchema.index({ boardId: 1 });
presenceSchema.index({ lastSeen: 1 });

export const Presence = mongoose.model<IPresence>('Presence', presenceSchema);