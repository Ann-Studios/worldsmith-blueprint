import mongoose from 'mongoose';

export interface ITemplate {
  _id: string;
  name: string;
  description?: string;
  category: string;
  content: any; // Stores template structure
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new mongoose.Schema<ITemplate>({
  name: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  isPublic: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  usageCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for performance
templateSchema.index({ category: 1 });
templateSchema.index({ isPublic: 1 });
templateSchema.index({ createdBy: 1 });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);