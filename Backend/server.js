const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./connection/connect');
const UserRouter = require('./Routers/users.route');
const AuthRouter = require('./Routers/auth.route');
const PostRouter = require('./Routers/post.route');
const CommentRouter = require('./Routers/comment.route');
const NotificationRouter = require('./Routers/notification.route');
const ChatRouter = require('./Routers/chat.route');
const SearchRouter = require('./SearchQuery/searchRoute');
const SocketService = require('./services/socketService');
const cookieParser = require('cookie-parser');
const StoriesRouter = require('./Routers/stories.route');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

dotenv.config();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const UploadRouter = require('./Routers/upload.route');

app.use('/users', UserRouter);
app.use('/auth', AuthRouter);
app.use('/posts', PostRouter);
app.use('/comments', CommentRouter);
app.use('/notifications', NotificationRouter);
app.use('/chat', ChatRouter);
app.use('/search', SearchRouter);
app.use('/upload', UploadRouter);
app.use('/stories', StoriesRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import error handling middleware
const { errorHandler, notFound } = require('./Middlewares/errorHandler');

// 404 handler for undefined routes (must be after all other routes)
app.use(notFound);

// Global error handling middleware (must be last)
app.use(errorHandler);

const socketService = new SocketService(io);
app.set('socketService', socketService);

connectDB();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is ready for real time communication`);
});