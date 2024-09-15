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
app.use(cors({
  origin: "http://localhost:5173", // or whatever port your frontend is running on
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json()); // Add this line to parse JSON request bodies

// Remove the JWT middleware
// app.use((req, res, next) => { ... });

// Instead, add this middleware to extract the role from headers
app.use((req, res, next) => {
  const role = req.header('Role');
  if (role) {
    req.userRole = role;
  }
  next();
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // or whatever port your frontend is running on
    methods: ["GET", "POST"],
    credentials: true
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