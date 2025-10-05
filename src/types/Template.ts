// types/template.ts
export interface TemplateCard {
  _id: string;
  type: 'note' | 'character' | 'location' | 'plot' | 'item';
  x: number;
  y: number;
  content: string;
  title?: string;
  tags: string[];
}

export interface TemplateConnection {
  _id: string;
  fromCardId: string;
  toCardId: string;
  label?: string;
  type: 'relationship' | 'dependency' | 'timeline' | 'custom';
  color?: string;
}

export interface Template {
  _id: string;
  name: string;
  description: string;
  category: 'worldbuilding' | 'character' | 'plot' | 'location' | 'system' | 'custom';
  tags: string[];
  cards: TemplateCard[];
  connections: TemplateConnection[];
  thumbnail?: string;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}