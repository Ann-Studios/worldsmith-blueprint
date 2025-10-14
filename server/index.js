import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.VERCEL_FRONTEND_URL,
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.RENDER_BACKEND_URL,
].filter(Boolean);

console.log('🔐 Allowed CORS origins:', allowedOrigins);

// Middleware - Updated CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked for origin:', origin);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Explicitly handle preflight requests
app.options('*', cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable is required');
    process.exit(1);
}

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to send invitation email with fallback
const sendInvitationEmail = async (email, boardName, role, invitationLink) => {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set; skipping email send');
        return { success: false, reason: 'RESEND_API_KEY not configured' };
    }
    try {
        await resend.emails.send({
            from: 'Worldsmith <onboarding@resend.dev>',
            to: [email],
            subject: `You've been invited to collaborate on "${boardName}"`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">You've been invited to collaborate!</h2>
                    <p>You've been invited to collaborate on the board "<strong>${boardName}</strong>" as a <strong>${role}</strong>.</p>
                    <p>Click the button below to accept the invitation and start collaborating:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${invitationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
            `
        });
        return { success: true };
    } catch (err) {
        console.error('Resend send failed:', err);
        return { success: false, reason: err.message };
    }
};

// Updated MongoDB connection options for modern Mongoose
const mongooseOptions = {
    dbName: 'worldsmith-database',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, mongooseOptions)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Mongoose connection event handlers
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// ========== MONGOOSE SCHEMAS ==========

const BoardSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    parentFolderId: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    createdBy: { type: String, required: true },
    permissions: [{
        userId: { type: String, required: true },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
        grantedBy: { type: String, required: true },
        grantedAt: { type: String, required: true }
    }],
    tags: [{ type: String }],
    templateId: { type: String },
    isPublic: { type: Boolean, default: false }
});

const CardSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    type: { type: String, enum: ['note', 'character', 'location', 'plot', 'item'], required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    content: { type: String, required: true },
    title: { type: String },
    tags: [{ type: String }],
    attachments: [{
        _id: { type: String, required: true },
        cardId: { type: String, required: true },
        filename: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'file'], required: true },
        uploadedBy: { type: String, required: true },
        uploadedAt: { type: String, required: true },
        size: { type: Number, required: true }
    }],
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
    version: { type: Number, default: 1 },
    boardId: { type: String, required: true }
});

const ConnectionSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    id: { type: String, required: true },
    fromCardId: { type: String, required: true },
    toCardId: { type: String, required: true },
    label: { type: String },
    type: { type: String, enum: ['relationship', 'dependency', 'timeline', 'custom'], required: true },
    color: { type: String },
    createdBy: { type: String, required: true },
    boardId: { type: String, required: true }
});

const CommentSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    cardId: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: String, required: true },
    mentions: [{ type: String }],
    resolved: { type: Boolean, default: false },
    x: { type: Number },
    y: { type: Number },
    boardId: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

// Profile Schema
const ProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
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
        maxlength: 1000
    },
    avatar: {
        type: String,
        trim: true
    },
    socialLinks: {
        website: { type: String, trim: true },
        twitter: { type: String, trim: true },
        github: { type: String, trim: true },
        discord: { type: String, trim: true }
    },
    preferences: {
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
    },
    stats: {
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
    }
}, {
    timestamps: true
});

// Template Schema
const TemplateSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['worldbuilding', 'character', 'plot', 'location', 'system', 'custom'],
        required: true
    },
    tags: [{ type: String }],
    cards: [{
        _id: { type: String, required: true },
        type: {
            type: String,
            enum: ['note', 'character', 'location', 'plot', 'item'],
            required: true
        },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        content: { type: String, required: true },
        title: { type: String },
        tags: [{ type: String }]
    }],
    connections: [{
        _id: { type: String, required: true },
        fromCardId: { type: String, required: true },
        toCardId: { type: String, required: true },
        label: { type: String },
        type: {
            type: String,
            enum: ['relationship', 'dependency', 'timeline', 'custom'],
            required: true
        },
        color: { type: String }
    }],
    thumbnail: { type: String },
    createdBy: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

// Create Models
const Board = mongoose.model('Board', BoardSchema);
const Card = mongoose.model('Card', CardSchema);
const Connection = mongoose.model('Connection', ConnectionSchema);
const Comment = mongoose.model('Comment', CommentSchema);
const User = mongoose.model('User', UserSchema);
const Profile = mongoose.model('Profile', ProfileSchema);
const Template = mongoose.model('Template', TemplateSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ========== PUBLIC ROUTES ==========

// Health check
app.get('/health', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoStatus,
        environment: process.env.NODE_ENV || 'development',
        allowedOrigins: allowedOrigins
    });
});

// Register
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log('📝 Registration attempt:', { email, name });

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = new User({
            _id: `user-${Date.now()}`,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await user.save();

        // Create profile for the user
        const profile = new Profile({
            userId: user._id,
            displayName: name,
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
        await profile.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        console.log('✅ User registered successfully:', user._id);

        res.status(201).json({
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Login
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Login attempt:', { email });

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', email);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user without password
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        console.log('✅ User logged in successfully:', user._id);

        res.json({
            user: userResponse,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// ========== PROTECTED ROUTES ==========

// Get current user
app.get('/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };

        res.json(userResponse);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user data' });
    }
});

// Update user profile
app.put('/auth/profile', authenticateToken, async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const updates = { updatedAt: new Date().toISOString() };

        if (name) updates.name = name;
        if (avatar) updates.avatar = avatar;

        const user = await User.findOneAndUpdate(
            { _id: req.user.userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            createdAt: user.createdAt
        };

        res.json(userResponse);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ========== PROFILE ROUTES ==========

// Get profile by user ID
app.get('/api/profile/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await Profile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user's profile
app.get('/api/profile/me', authenticateToken, async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.user.userId });

        if (!profile) {
            // Create profile if it doesn't exist
            const user = await User.findOne({ _id: req.user.userId });
            profile = new Profile({
                userId: req.user.userId,
                displayName: user?.name || '',
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
            await profile.save();
        }

        res.json(profile);
    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update profile
app.put('/api/profile/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user owns this profile
        if (userId !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };

        const profile = await Profile.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update profile preferences
app.put('/api/profile/:userId/preferences', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;

        if (userId !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { preferences, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== TEMPLATE ROUTES ==========

// Get all templates
app.get('/templates', authenticateToken, async (req, res) => {
    try {
        const { category, search } = req.query;

        let query = {
            $or: [
                { isPublic: true },
                { createdBy: req.user.userId }
            ]
        };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$and = [
                query,
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { tags: { $in: [new RegExp(search, 'i')] } }
                    ]
                }
            ];
        }

        const templates = await Template.find(query)
            .sort({ usageCount: -1, rating: -1, createdAt: -1 });

        res.json(templates);
    } catch (error) {
        console.error('Failed to fetch templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get single template
app.get('/templates/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const template = await Template.findOne({
            _id: id,
            $or: [
                { isPublic: true },
                { createdBy: req.user.userId }
            ]
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Failed to fetch template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Create template
app.post('/templates', authenticateToken, async (req, res) => {
    try {
        const templateData = req.body;

        if (!templateData.name || !templateData.category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        const template = new Template({
            _id: `template-${Date.now()}`,
            ...templateData,
            createdBy: req.user.userId,
            usageCount: 0,
            rating: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await template.save();

        console.log(`✅ Template created: ${template._id} by user: ${req.user.userId}`);
        res.status(201).json(template);
    } catch (error) {
        console.error('Failed to create template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
app.put('/templates/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user owns this template
        const existingTemplate = await Template.findOne({ _id: id });
        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (existingTemplate.createdBy !== req.user.userId) {
            return res.status(403).json({ error: 'No permission to edit this template' });
        }

        const template = await Template.findOneAndUpdate(
            { _id: id },
            { ...req.body, updatedAt: new Date().toISOString() },
            { new: true, runValidators: true }
        );

        console.log(`✅ Template updated: ${id} by user: ${req.user.userId}`);
        res.json(template);
    } catch (error) {
        console.error('Failed to update template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
app.delete('/templates/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user owns this template
        const existingTemplate = await Template.findOne({ _id: id });
        if (!existingTemplate) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (existingTemplate.createdBy !== req.user.userId) {
            return res.status(403).json({ error: 'No permission to delete this template' });
        }

        await Template.deleteOne({ _id: id });

        console.log(`✅ Template deleted: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Failed to delete template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Apply template to board
app.post('/templates/:id/apply', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { boardId } = req.body;

        if (!boardId) {
            return res.status(400).json({ error: 'Board ID is required' });
        }

        // Get template
        const template = await Template.findOne({
            _id: id,
            $or: [
                { isPublic: true },
                { createdBy: req.user.userId }
            ]
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check if user has permission to edit the board
        const board = await Board.findOne({
            _id: boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to edit this board' });
        }

        // Create cards from template
        const cardPromises = template.cards.map(cardTemplate => {
            const card = new Card({
                ...cardTemplate,
                boardId: boardId,
                createdBy: req.user.userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return card.save();
        });

        // Create connections from template
        const connectionPromises = template.connections.map(connTemplate => {
            const connection = new Connection({
                ...connTemplate,
                boardId: boardId,
                createdBy: req.user.userId
            });
            return connection.save();
        });

        await Promise.all([...cardPromises, ...connectionPromises]);

        // Increment template usage count
        await Template.findOneAndUpdate(
            { _id: id },
            { $inc: { usageCount: 1 } }
        );

        console.log(`✅ Template applied: ${id} to board: ${boardId} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Template applied successfully' });
    } catch (error) {
        console.error('Failed to apply template:', error);
        res.status(500).json({ error: 'Failed to apply template' });
    }
});

// Rate template
app.post('/templates/:id/rate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Get template
        const template = await Template.findOne({
            _id: id,
            $or: [
                { isPublic: true },
                { createdBy: req.user.userId }
            ]
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Calculate new rating
        const newRating = ((template.rating * template.usageCount) + rating) / (template.usageCount + 1);

        const updatedTemplate = await Template.findOneAndUpdate(
            { _id: id },
            { rating: newRating },
            { new: true }
        );

        res.json({ success: true, newRating: updatedTemplate.rating });
    } catch (error) {
        console.error('Failed to rate template:', error);
        res.status(500).json({ error: 'Failed to rate template' });
    }
});

// ========== BOARD ROUTES ==========

app.get('/boards', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const boards = await Board.find({
            $or: [
                { 'permissions.userId': userId },
                { isPublic: true }
            ]
        }).sort({ updatedAt: -1 });

        res.json(boards);
    } catch (error) {
        console.error('Failed to fetch boards:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

app.post('/boards', authenticateToken, async (req, res) => {
    try {
        const boardData = req.body;
        if (!boardData._id || !boardData.name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        boardData.createdBy = req.user.userId;
        boardData.createdAt = new Date().toISOString();
        boardData.updatedAt = new Date().toISOString();

        boardData.permissions = [{
            userId: req.user.userId,
            role: 'owner',
            grantedBy: req.user.userId,
            grantedAt: new Date().toISOString()
        }];

        const board = new Board(boardData);
        await board.save();

        console.log(`✅ Board created: ${board._id} by user: ${req.user.userId}`);
        res.status(201).json(board);
    } catch (error) {
        console.error('Failed to create board:', error);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

app.put('/boards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user has permission to edit this board
        const existingBoard = await Board.findOne({ _id: id });
        if (!existingBoard) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const hasPermission = existingBoard.permissions.some(
            perm => perm.userId === req.user.userId && ['owner', 'editor'].includes(perm.role)
        ) || existingBoard.createdBy === req.user.userId;

        if (!hasPermission) {
            return res.status(403).json({ error: 'No permission to edit this board' });
        }

        const board = await Board.findOneAndUpdate(
            { _id: id },
            { ...req.body, updatedAt: new Date().toISOString() },
            { new: true, runValidators: true }
        );

        console.log(`✅ Board updated: ${id} by user: ${req.user.userId}`);
        res.json(board);
    } catch (error) {
        console.error('Failed to update board:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

app.get('/boards/:id/data', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user has permission to access this board
        const board = await Board.findOne({
            _id: id,
            $or: [
                { 'permissions.userId': req.user.userId },
                { createdBy: req.user.userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            return res.status(404).json({ error: 'Board not found or no access' });
        }

        const [cards, connections, comments] = await Promise.all([
            Card.find({ boardId: id }),
            Connection.find({ boardId: id }),
            Comment.find({ boardId: id })
        ]);

        res.json({
            cards: cards || [],
            connections: connections || [],
            comments: comments || []
        });
    } catch (error) {
        console.error('Failed to fetch board data:', error);
        res.status(500).json({ error: 'Failed to fetch board data' });
    }
});

app.post('/boards/:id/clear', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user has permission to clear this board
        const board = await Board.findOne({
            _id: id,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to clear this board' });
        }

        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);

        console.log(`✅ Board cleared: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Board cleared successfully' });
    } catch (error) {
        console.error('Failed to clear board:', error);
        res.status(500).json({ error: 'Failed to clear board' });
    }
});

app.post('/boards/:id/import', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { cards, connections, comments } = req.body;

        // Check if user has permission to import to this board
        const board = await Board.findOne({
            _id: id,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to import to this board' });
        }

        // Clear existing data
        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);

        const insertPromises = [];

        if (cards && cards.length > 0) {
            const cardsWithBoardId = cards.map(card => ({
                ...card,
                boardId: id,
                createdBy: req.user.userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));
            insertPromises.push(Card.insertMany(cardsWithBoardId));
        }

        if (connections && connections.length > 0) {
            const connectionsWithBoardId = connections.map(conn => ({
                ...conn,
                boardId: id,
                createdBy: req.user.userId
            }));
            insertPromises.push(Connection.insertMany(connectionsWithBoardId));
        }

        if (comments && comments.length > 0) {
            const commentsWithBoardId = comments.map(comment => ({
                ...comment,
                boardId: id,
                createdBy: req.user.userId
            }));
            insertPromises.push(Comment.insertMany(commentsWithBoardId));
        }

        await Promise.all(insertPromises);

        console.log(`✅ Data imported to board: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        console.error('Failed to import board data:', error);
        res.status(500).json({ error: 'Failed to import board data' });
    }
});

// Board invitation endpoint
app.post('/boards/:id/invite', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        // Check if user has permission to invite to this board
        const board = await Board.findOne({
            _id: id,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to invite to this board' });
        }

        // Check if user already exists
        let invitedUser = await User.findOne({ email });
        if (!invitedUser) {
            // Create a new user account for the invitation
            invitedUser = new User({
                _id: `user-${Date.now()}`,
                email,
                name: email.split('@')[0], // Use email prefix as default name
                password: '', // Will be set when they register
                role: 'user'
            });
            await invitedUser.save();
        }

        // Check if user is already a collaborator
        const existingPermission = board.permissions.find(p => p.userId === invitedUser._id);
        if (existingPermission) {
            return res.status(400).json({ error: 'User is already a collaborator on this board' });
        }

        // Add permission to board
        board.permissions.push({
            userId: invitedUser._id,
            role,
            grantedBy: req.user.userId,
            grantedAt: new Date().toISOString()
        });

        await board.save();

        // Send invitation email
        const invitationToken = jwt.sign(
            {
                email,
                boardId: id,
                role,
                invitedBy: req.user.userId
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const invitationLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${invitationToken}`;

        const emailResult = await sendInvitationEmail(email, board.name, role, invitationLink);

        if (emailResult.success) {
            console.log(`✅ Invitation sent to ${email} for board: ${id}`);
            res.json({ success: true, message: 'Invitation sent successfully' });
        } else {
            console.error('Failed to send invitation email:', emailResult.reason);
            // Still add the permission even if email fails
            res.json({
                success: true,
                message: 'User added to board, but email could not be sent',
                emailError: emailResult.reason
            });
        }

    } catch (error) {
        console.error('Failed to send board invitation:', error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

// ========== CARD ROUTES ==========

app.post('/cards', authenticateToken, async (req, res) => {
    try {
        const cardData = req.body;
        if (!cardData._id || !cardData.type || !cardData.boardId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Set createdBy to authenticated user and timestamps
        cardData.createdBy = req.user.userId;
        cardData.createdAt = new Date().toISOString();
        cardData.updatedAt = new Date().toISOString();

        const card = new Card(cardData);
        await card.save();

        console.log(`✅ Card created: ${card._id} by user: ${req.user.userId}`);
        res.status(201).json(card);
    } catch (error) {
        console.error('Failed to create card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

app.put('/cards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the card exists and user has permission
        const existingCard = await Card.findOne({ _id: id });
        if (!existingCard) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check if user has permission to edit this card (via board permissions)
        const board = await Board.findOne({
            _id: existingCard.boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to edit this card' });
        }

        // Update card with new data and timestamp
        const updateData = {
            ...req.body,
            updatedAt: new Date().toISOString(),
            version: existingCard.version + 1
        };

        const card = await Card.findOneAndUpdate(
            { _id: id },
            updateData,
            { new: true, runValidators: true }
        );

        console.log(`✅ Card updated: ${id} by user: ${req.user.userId}`);
        res.json(card);
    } catch (error) {
        console.error('Failed to update card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

app.delete('/cards/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the card exists and user has permission
        const existingCard = await Card.findOne({ _id: id });
        if (!existingCard) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check if user has permission to delete this card
        const board = await Board.findOne({
            _id: existingCard.boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to delete this card' });
        }

        const result = await Card.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Clean up related connections and comments
        await Promise.all([
            Connection.deleteMany({
                $or: [{ fromCardId: id }, { toCardId: id }]
            }),
            Comment.deleteMany({ cardId: id })
        ]);

        console.log(`✅ Card deleted: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Failed to delete card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// ========== CONNECTION ROUTES ==========

app.post('/connections', authenticateToken, async (req, res) => {
    try {
        const connectionData = req.body;
        if (!connectionData._id || !connectionData.fromCardId || !connectionData.toCardId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify both cards exist and user has permission
        const [fromCard, toCard] = await Promise.all([
            Card.findOne({ _id: connectionData.fromCardId }),
            Card.findOne({ _id: connectionData.toCardId })
        ]);

        if (!fromCard || !toCard) {
            return res.status(404).json({ error: 'One or both cards not found' });
        }

        // Check if user has permission to create connections in this board
        const board = await Board.findOne({
            _id: fromCard.boardId, // Both cards should be in the same board
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to create connections in this board' });
        }

        // Set createdBy to authenticated user
        connectionData.createdBy = req.user.userId;

        const connection = new Connection(connectionData);
        await connection.save();

        console.log(`✅ Connection created: ${connection._id} by user: ${req.user.userId}`);
        res.status(201).json(connection);
    } catch (error) {
        console.error('Failed to create connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});

app.put('/connections/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the connection exists
        const existingConnection = await Connection.findOne({ _id: id });
        if (!existingConnection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        // Check if user has permission to edit this connection
        const fromCard = await Card.findOne({ _id: existingConnection.fromCardId });
        if (!fromCard) {
            return res.status(404).json({ error: 'Source card not found' });
        }

        const board = await Board.findOne({
            _id: fromCard.boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to edit this connection' });
        }

        const connection = await Connection.findOneAndUpdate(
            { _id: id },
            req.body,
            { new: true, runValidators: true }
        );

        console.log(`✅ Connection updated: ${id} by user: ${req.user.userId}`);
        res.json(connection);
    } catch (error) {
        console.error('Failed to update connection:', error);
        res.status(500).json({ error: 'Failed to update connection' });
    }
});

app.delete('/connections/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the connection exists
        const existingConnection = await Connection.findOne({ _id: id });
        if (!existingConnection) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        // Check if user has permission to delete this connection
        const fromCard = await Card.findOne({ _id: existingConnection.fromCardId });
        if (!fromCard) {
            return res.status(404).json({ error: 'Source card not found' });
        }

        const board = await Board.findOne({
            _id: fromCard.boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to delete this connection' });
        }

        const result = await Connection.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        console.log(`✅ Connection deleted: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Connection deleted successfully' });
    } catch (error) {
        console.error('Failed to delete connection:', error);
        res.status(500).json({ error: 'Failed to delete connection' });
    }
});

// ========== COMMENT ROUTES ==========

app.post('/comments', authenticateToken, async (req, res) => {
    try {
        const commentData = req.body;
        if (!commentData._id || !commentData.cardId || !commentData.content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify the card exists
        const card = await Card.findOne({ _id: commentData.cardId });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Check if user has permission to comment on this card
        const board = await Board.findOne({
            _id: card.boardId,
            $or: [
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor', 'viewer'] } },
                { createdBy: req.user.userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to comment on this card' });
        }

        // Set createdBy to authenticated user and timestamps
        commentData.createdBy = req.user.userId;
        commentData.createdAt = new Date().toISOString();

        const comment = new Comment(commentData);
        await comment.save();

        console.log(`✅ Comment created: ${comment._id} by user: ${req.user.userId}`);
        res.status(201).json(comment);
    } catch (error) {
        console.error('Failed to create comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

app.put('/comments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the comment exists
        const existingComment = await Comment.findOne({ _id: id });
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns this comment or has board editing permissions
        const card = await Card.findOne({ _id: existingComment.cardId });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        const board = await Board.findOne({
            _id: card.boardId,
            $or: [
                // User owns the comment
                { $and: [{ _id: card.boardId }, { 'comments._id': id, 'comments.createdBy': req.user.userId }] },
                // User has editor/owner permissions
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to edit this comment' });
        }

        const comment = await Comment.findOneAndUpdate(
            { _id: id },
            req.body,
            { new: true, runValidators: true }
        );

        console.log(`✅ Comment updated: ${id} by user: ${req.user.userId}`);
        res.json(comment);
    } catch (error) {
        console.error('Failed to update comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});

app.delete('/comments/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // First, check if the comment exists
        const existingComment = await Comment.findOne({ _id: id });
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns this comment or has board editing permissions
        const card = await Card.findOne({ _id: existingComment.cardId });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        const board = await Board.findOne({
            _id: card.boardId,
            $or: [
                // User owns the comment
                { $and: [{ _id: card.boardId }, { 'comments._id': id, 'comments.createdBy': req.user.userId }] },
                // User has editor/owner permissions
                { 'permissions.userId': req.user.userId, 'permissions.role': { $in: ['owner', 'editor'] } },
                { createdBy: req.user.userId }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to delete this comment' });
        }

        const result = await Comment.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        console.log(`✅ Comment deleted: ${id} by user: ${req.user.userId}`);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Failed to delete comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// Get comments for a specific card
app.get('/cards/:cardId/comments', authenticateToken, async (req, res) => {
    try {
        const { cardId } = req.params;

        // Verify the card exists and user has permission
        const card = await Card.findOne({ _id: cardId });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        const board = await Board.findOne({
            _id: card.boardId,
            $or: [
                { 'permissions.userId': req.user.userId },
                { createdBy: req.user.userId },
                { isPublic: true }
            ]
        });

        if (!board) {
            return res.status(403).json({ error: 'No permission to view comments for this card' });
        }

        const comments = await Comment.find({ cardId }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        console.error('Failed to fetch comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler for API routes
app.use('/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// WebSocket server setup
const wss = new WebSocketServer({ server });
const connections = new Map();

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const boardId = url.searchParams.get('boardId');

    if (userId && boardId) {
        const connectionKey = `${userId}-${boardId}`;
        connections.set(connectionKey, ws);
        console.log(`🔌 WebSocket connected: ${userId} on board ${boardId}`);

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                // Broadcast to other users on the same board
                connections.forEach((otherWs, key) => {
                    if (key.includes(boardId) && key !== connectionKey) {
                        otherWs.send(JSON.stringify(message));
                    }
                });
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });

        ws.on('close', () => {
            connections.delete(connectionKey);
            console.log(`🔌 WebSocket disconnected: ${userId} from board ${boardId}`);
        });
    }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const wsProtocol = isProduction ? 'wss' : 'ws';
    const wsHost = isProduction ? process.env.RENDER_EXTERNAL_URL?.replace('https://', '') : `localhost:${PORT}`;

    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server running on ${wsProtocol}://${wsHost}`);
    console.log(`📊 MongoDB: ${MONGODB_URI.includes('@') ? 'Connected to MongoDB Atlas' : MONGODB_URI}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Authentication: Enabled`);
    console.log(`👤 Profile System: Enabled`);
    console.log(`📚 Template System: Enabled`);
    console.log(`🔐 CORS: Enabled for origins:`, allowedOrigins);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close();
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close();
        console.log('Process terminated');
        process.exit(0);
    });
});