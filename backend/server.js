require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const gameHandler = require('./socket/gameHandler');
const roomRoutes = require('./routes/rooms');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies

// Middleware to extract user from token
app.use((req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    next();
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Assuming your frontend runs on this port
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB().then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Socket.io
gameHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));