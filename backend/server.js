const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const reportRoutes = require('./routes/reportRoutes');
const chatbotRoutes = require('./routes/ChattRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('setup', (userId) => {
        socket.join(userId);
        console.log('User joined room:', userId);
    });

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log('Joined chat room:', chatId);
    });

    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
        console.log('Left chat room:', chatId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/lost', require('./routes/lostItemRoutes'));
app.use('/api/found', require('./routes/foundItemRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/reports', reportRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        
        require('./jobs/monthlyReset');
        
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Socket.IO ready for connections`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();