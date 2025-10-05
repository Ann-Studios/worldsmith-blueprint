const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (using your existing mongoose setup)
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Mongoose Models
const BoardSchema = new mongoose.Schema({
    _id: String,
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

// API Routes

// GET /api/boards - Get all boards for user
app.get('/boards', async (req, res) => {
    try {
        const { userId } = req.query;
        const boards = await Board.find({
            $or: [
                { 'permissions.userId': userId },
                { isPublic: true }
            ]
        });
        res.json(boards);
    } catch (error) {
        console.error('Failed to fetch boards:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

// POST /api/boards - Create a new board
app.post('/boards', async (req, res) => {
    try {
        const board = new Board(req.body);
        await board.save();
        res.status(201).json(board);
    } catch (error) {
        console.error('Failed to create board:', error);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

// PUT /api/boards/:id - Update a board
app.put('/boards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const board = await Board.findByIdAndUpdate(id, req.body, { new: true });
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }
        res.json(board);
    } catch (error) {
        console.error('Failed to update board:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

// GET /api/boards/:id/data - Get all data for a board
app.get('/boards/:id/data', async (req, res) => {
    try {
        const { id } = req.params;
        const [cards, connections, comments] = await Promise.all([
            Card.find({ boardId: id }),
            Connection.find({ boardId: id }),
            Comment.find({ boardId: id })
        ]);
        res.json({ cards, connections, comments });
    } catch (error) {
        console.error('Failed to fetch board data:', error);
        res.status(500).json({ error: 'Failed to fetch board data' });
    }
});

// POST /api/boards/:id/clear - Clear all board data
app.post('/boards/:id/clear', async (req, res) => {
    try {
        const { id } = req.params;
        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to clear board:', error);
        res.status(500).json({ error: 'Failed to clear board' });
    }
});

// POST /api/boards/:id/import - Import data to board
app.post('/boards/:id/import', async (req, res) => {
    try {
        const { id } = req.params;
        const { cards, connections, comments } = req.body;

        // Clear existing data first
        await Promise.all([
            Card.deleteMany({ boardId: id }),
            Connection.deleteMany({ boardId: id }),
            Comment.deleteMany({ boardId: id })
        ]);

        // Insert imported data
        if (cards && cards.length > 0) {
            const cardsWithBoardId = cards.map(card => ({
                ...card,
                boardId: id
            }));
            await Card.insertMany(cardsWithBoardId);
        }

        if (connections && connections.length > 0) {
            const connectionsWithBoardId = connections.map(conn => ({
                ...conn,
                boardId: id
            }));
            await Connection.insertMany(connectionsWithBoardId);
        }

        if (comments && comments.length > 0) {
            const commentsWithBoardId = comments.map(comment => ({
                ...comment,
                boardId: id
            }));
            await Comment.insertMany(commentsWithBoardId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to import board data:', error);
        res.status(500).json({ error: 'Failed to import board data' });
    }
});

// POST /api/cards - Create a new card
app.post('/cards', async (req, res) => {
    try {
        const card = new Card(req.body);
        await card.save();
        res.status(201).json(card);
    } catch (error) {
        console.error('Failed to create card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// PUT /api/cards/:id - Update a card
app.put('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findByIdAndUpdate(id, req.body, { new: true });
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.json(card);
    } catch (error) {
        console.error('Failed to update card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// DELETE /api/cards/:id - Delete a card
app.delete('/cards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findByIdAndDelete(id);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// POST /api/connections - Create a new connection
app.post('/connections', async (req, res) => {
    try {
        const connection = new Connection(req.body);
        await connection.save();
        res.status(201).json(connection);
    } catch (error) {
        console.error('Failed to create connection:', error);
        res.status(500).json({ error: 'Failed to create connection' });
    }
});

// PUT /api/connections/:id - Update a connection
app.put('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await Connection.findByIdAndUpdate(id, req.body, { new: true });
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        res.json(connection);
    } catch (error) {
        console.error('Failed to update connection:', error);
        res.status(500).json({ error: 'Failed to update connection' });
    }
});

// DELETE /api/connections/:id - Delete a connection
app.delete('/connections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await Connection.findByIdAndDelete(id);
        if (!connection) {
            return res.status(404).json({ error: 'Connection not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete connection:', error);
        res.status(500).json({ error: 'Failed to delete connection' });
    }
});

// POST /api/comments - Create a new comment
app.post('/comments', async (req, res) => {
    try {
        const comment = new Comment(req.body);
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error('Failed to create comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});