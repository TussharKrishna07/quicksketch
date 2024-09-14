require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const gameHandler = require('./socket/gameHandler');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Assuming your frontend runs on this port
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/auth', authRoutes);

// Socket.io
gameHandler(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));