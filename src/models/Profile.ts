// models/Profile.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for Social Links
interface ISocialLinks {
  website?: string;
  twitter?: string;
  github?: string;
  discord?: string;
}

// Interface for Preferences
interface IPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
}

// Interface for Stats
interface IStats {
  worldsCreated: number;
  charactersCreated: number;
  totalCards: number;
  joinedDate: Date;
}

// Main Profile Interface
export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: ISocialLinks;
  preferences?: IPreferences;
  stats?: IStats;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  formattedJoinDate: string;
}

// Social Links Schema
const socialLinksSchema = new Schema<ISocialLinks>({
  website: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  discord: {
    type: String,
    trim: true
  }
});

// Preferences Schema
const preferencesSchema = new Schema<IPreferences>({
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    default: 'en'
  }
});

// Stats Schema
const statsSchema = new Schema<IStats>({
  worldsCreated: {
    type: Number,
    default: 0
  },
  charactersCreated: {
    type: Number,
    default: 0
  },
  totalCards: {
    type: Number,
    default: 0
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
});

// Main Profile Schema
const profileSchema = new Schema<IProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    trim: true
  },
  socialLinks: socialLinksSchema,
  preferences: preferencesSchema,
  stats: statsSchema
}, {
  timestamps: true
});

// Index for faster queries
profileSchema.index({ userId: 1 });

// Static method to get or create profile
profileSchema.statics.getOrCreate = async function(userId: mongoose.Types.ObjectId): Promise<IProfile> {
  let profile = await this.findOne({ userId });
  
  if (!profile) {
    profile = await this.create({
      userId,
      displayName: '',
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'en'
      },
      stats: {
        worldsCreated: 0,
        charactersCreated: 0,
        totalCards: 0,
        joinedDate: new Date()
      }
    });
  }
  
  return profile;
};

// Instance method to update stats
profileSchema.methods.incrementStat = async function(statField: keyof IStats, increment: number = 1): Promise<void> {
  const statPath = `stats.${statField}`;
  
  if (this.schema.path(statPath)) {
    (this.stats as Record<string, number>)[statField] += increment;
    await this.save();
  }
};

// Virtual for formatted join date
profileSchema.virtual('formattedJoinDate').get(function(this: IProfile) {
  return this.stats?.joinedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) || new Date().toLocaleDateString();
});

// Ensure virtual fields are serialized
profileSchema.set('toJSON', { virtuals: true });

// Define the static methods interface
interface ProfileModel extends Model<IProfile> {
  getOrCreate(userId: mongoose.Types.ObjectId): Promise<IProfile>;
}

export default mongoose.model<IProfile, ProfileModel>('Profile', profileSchema);