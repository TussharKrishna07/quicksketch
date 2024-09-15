const express = require('express');
const Room = require('../models/Room');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/create', async (req, res) => {
  try {
    const { numberOfPlayers, language, numberOfRounds, drawingTime, username } = req.body;
    const role = req.userRole;

    if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create rooms' });
    }

    const roomCode = uuidv4().substring(0, 6).toUpperCase();
    const playerId = uuidv4();
    const newRoom = new Room({
      code: roomCode,
      admin: playerId,
      numberOfPlayers,
      language,
      numberOfRounds,
      drawingTime,
      players: [{ id: playerId, username, role: 'admin' }]
    });

    await newRoom.save();

    res.json({ success: true, roomCode, playerId });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ success: false, message: 'Error creating room' });
  }
});

router.post('/join', async (req, res) => {
    try {
      const { roomCode, username } = req.body;
      const role = req.userRole;
  
      const room = await Room.findOne({ code: roomCode });
  
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }
  
      if (room.players.length >= room.numberOfPlayers) {
        return res.status(400).json({ success: false, message: 'Room is full' });
      }
  
      const playerId = uuidv4();
      room.players.push({ id: playerId, username, role });
      await room.save();
  
      res.json({ success: true, roomCode, playerId });
    } catch (error) {
      console.error('Room join error:', error);
      res.status(500).json({ success: false, message: 'Error joining room' });
    }
  });

// Add this new route
router.get('/:roomCode', async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.roomCode });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, room });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ success: false, message: 'Error fetching room', error: error.message });
  }
});

module.exports = router;