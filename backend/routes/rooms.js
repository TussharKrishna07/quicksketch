const express = require('express');
const Room = require('../models/Room');
const router = express.Router();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

router.post('/create', async (req, res) => {
  try {
    const { numberOfPlayers, language, numberOfRounds, drawingTime } = req.body;
    console.log('Received room creation request:', req.body);

    if (!req.user || !req.user.id) {
      console.error('User not authenticated');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const admin = req.user.id;

    const roomCode = generateRoomCode();
    const room = new Room({
      code: roomCode,
      admin,
      numberOfPlayers,
      language,
      numberOfRounds,
      drawingTime,
      players: [] // Initialize with an empty array
    });

    console.log('Room object before saving:', room);

    await room.save();

    console.log('Room created successfully:', room);
    res.status(201).json({ success: true, roomCode });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ success: false, message: 'Error creating room', error: error.message, stack: error.stack });
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