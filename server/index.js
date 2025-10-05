import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        'http://localhost:8080',
        'https://worldsmith-blueprint.onrender.com' // Replace with your actual Vite app URL
    ].filter(Boolean),
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
}

// MongoDB connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0
};

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

// Mongoose Models
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

const Board = mongoose.model('Board', BoardSchema);
const Card = mongoose.model('Card', CardSchema);
const Connection = mongoose.model('Connection', ConnectionSchema);
const Comment = mongoose.model('Comment', CommentSchema);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API Routes
app.get('/boards', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

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

app.post('/boards', async (req, res) => {
    try {
        const boardData = req.body;
        if (!boardData._id || !boardData.name || !boardData.createdBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const board = new Board(boardData);
        await board.save();
        res.status(201).json(board);
    } catch (error) {
        console.error('Failed to create board:', error);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

app.put('/boards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const board = await Board.findOneAndUpdate(
            { _id: id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json(board);
    } catch (error) {
        console.error('Failed to update board:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

app.get('/boards/:id/data', async (req, res) => {
    try {
        const { id } = req.params;
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

app.post('/boards/:id/clear', async (req, res) => {
    try {
        const { id } = req.params;
        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);

        res.json({ success: true, message: 'Board cleared successfully' });
    } catch (error) {
        console.error('Failed to clear board:', error);
        res.status(500).json({ error: 'Failed to clear board' });
    }
});

app.post('/boards/:id/import', async (req, res) => {
    try {
        const { id } = req.params;
        const { cards, connections, comments } = req.body;

        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);

        const insertPromises = [];

        if (cards && cards.length > 0) {
            const cardsWithBoardId = cards.map(card => ({
                ...card,
                boardId: id
            }));
            insertPromises.push(Card.insertMany(cardsWithBoardId));
        }

        if (connections && connections.length > 0) {
            const connectionsWithBoardId = connections.map(conn => ({
                ...conn,
                boardId: id
            }));
            insertPromises.push(Connection.insertMany(connectionsWithBoardId));
        }

        if (comments && comments.length > 0) {
            const commentsWithBoardId = comments.map(comment => ({
                ...comment,
                boardId: id
            }));
            insertPromises.push(Comment.insertMany(commentsWithBoardId));
        }

        await Promise.all(insertPromises);
        res.json({ success: true, message: 'Data imported successfully' });
    } catch (error) {
        console.error('Failed to import board data:', error);
        res.status(500).json({ error: 'Failed to import board data' });
    }
});

app.post('/cards', async (req, res) => {
    try {
        const cardData = req.body;
        if (!cardData._id || !cardData.type || !cardData.boardId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const card = new Card(cardData);
        await card.save();
        res.status(201).json(card);
    } catch (error) {
        console.error('Failed to create card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

app.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findOneAndUpdate(
            { _id: id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.json(card);
    } catch (error) {
        console.error('Failed to update card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

app.delete('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Card.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Card not found' });
        }

        await Promise.all([
            Connection.deleteMany({
                $or: [{ fromCardId: id }, { toCardId: id }]
            }),
            Comment.deleteMany({ cardId: id })
        ]);

        res.json({ success: true, message: 'Card deleted successfully' });
    } catch (error) {
        console.error('Failed to delete card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

app.post('/connections', async (req, res) => {
    try {
        const connectionData = req.body;
        if (!connectionData._id || !connectionData.fromCardId || !connectionData.toCardId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const connection = new Connection(connectionData);
        await connection.save();
        res.status(201).json(connection);
    } catch (error) {
        console.error('Failed to create connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});

app.put('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await Connection.findOneAndUpdate(
            { _id: id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        res.json(connection);
    } catch (error) {
        console.error('Failed to update connection:', error);
        res.status(500).json({ error: 'Failed to update connection' });
    }
});

app.delete('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Connection.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        res.json({ success: true, message: 'Connection deleted successfully' });
    } catch (error) {
        console.error('Failed to delete connection:', error);
        res.status(500).json({ error: 'Failed to delete connection' });
    }
});

app.post('/comments', async (req, res) => {
    try {
        const commentData = req.body;
        if (!commentData._id || !commentData.cardId || !commentData.content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const comment = new Comment(commentData);
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error('Failed to create comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Health check
app.get('/health', (req, res) => {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        mongodb: mongoStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
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

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 MongoDB: ${MONGODB_URI.includes('@') ? 'Connected to MongoDB Atlas' : MONGODB_URI}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
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