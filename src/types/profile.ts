// types/profile.ts
export interface UserProfile {
  _id: string;
  userId: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    discord?: string;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
  stats?: {
    worldsCreated: number;
    charactersCreated: number;
    totalCards: number;
    joinedDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    github?: string;
    discord?: string;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    language?: string;
  };
}