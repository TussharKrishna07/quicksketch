const mongoose = require('mongoose');

const GameRoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  players: [{
    userId: String,
    username: String,
    score: Number
  }],
  currentWord: String,
  currentDrawer: String,
});

module.exports = mongoose.model('GameRoom', GameRoomSchema);