const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    type: String,
    required: true
  },
  numberOfPlayers: {
    type: Number,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  numberOfRounds: {
    type: Number,
    required: true
  },
  drawingTime: {
    type: Number,
    required: true
  },
  players: [{
    id: String,
    username: String,
    role: String
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  }
});

module.exports = mongoose.model('Room', RoomSchema);