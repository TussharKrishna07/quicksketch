const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  }
});

module.exports = mongoose.model('Room', RoomSchema);