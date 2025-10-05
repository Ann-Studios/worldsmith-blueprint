export type CardType = "note" | "character" | "location" | "plot" | "item";

export interface Board {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  permissions: Permission[];
  tags: string[];
  templateId?: string;
  isPublic?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CanvasCard {
  id: string;
  type: CardType;
  x: number;
  y: number;
  content: string;
  title?: string;
  tags: string[];
  attachments: Attachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  boardId?: string;
}

export interface Connection {
  id: string;
  fromCardId: string;
  toCardId: string;
  label?: string;
  type: "relationship" | "dependency" | "timeline" | "custom";
  color?: string;
  createdBy: string;
  boardId?: string;
}

export interface Comment {
  id: string;
  cardId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  mentions: string[];
  resolved: boolean;
  x?: number;
  y?: number;
  boardId?: string;
}

export interface Attachment {
  id: string;
  cardId: string;
  filename: string;
  url: string;
  type: "image" | "file";
  uploadedBy: string;
  uploadedAt: string;
  size: number;
}

export interface Permission {
  userId: string;
  role: "owner" | "editor" | "viewer";
  grantedBy: string;
  grantedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  cards: CanvasCard[];
  connections: Connection[];
  isPublic: boolean;
  createdBy: string;
}

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "editor" | "viewer";
  isOnline: boolean;
  lastSeen?: string;
  cursor?: { x: number; y: number };
  currentCard?: string;
}

// MongoDB specific interfaces (optional - if you want to differentiate)
export interface MongoDBBoard extends Omit<Board, 'id'> {
  _id: string;
}

export interface MongoDBCanvasCard extends Omit<CanvasCard, 'id'> {
  _id: string;
}

export interface MongoDBConnection extends Omit<Connection, 'id'> {
  _id: string;
}

export interface MongoDBComment extends Omit<Comment, 'id'> {
  _id: string;
}

// Search and filter types
export interface SearchFilters {
  cardTypes: string[];
  tags: string[];
  timeRange: "all" | "day" | "week" | "month";
}

export interface SearchResult {
  id: string;
  type: "card" | "connection" | "comment";
  title?: string;
  content: string;
  cardType?: string;
  relevance: number;
  tags?: string[];
  timestamp?: string;
  author?: string;
  preview?: string;
}