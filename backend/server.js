const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);

console.log("ENV:", process.env.MONGO_DB_URI);

// ✅ FIXED CORS (IMPORTANT)
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://yk1082420-ai-ml2025.github.io"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// ✅ Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Socket events
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('setup', (userId) => {
        socket.join(userId);
    });

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Middleware
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
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/chat', require('./routes/ChattRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/phone-verify', require('./routes/phoneVerificationRoutes'));
app.use('/api/points',       require('./routes/pointsRoutes'));
app.use('/api/returns',      require('./routes/returnRoutes'));

// ✅ ADDED — 3 missing routes that were never registered
app.use('/api/phone-verify', require('./routes/phoneVerificationRoutes'));
app.use('/api/points',       require('./routes/pointsRoutes'));
app.use('/api/returns',      require('./routes/returnRoutes'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Error handler
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

        // optional job
        require('./jobs/monthlyReset');

        const PORT = process.env.PORT || 5000;

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();