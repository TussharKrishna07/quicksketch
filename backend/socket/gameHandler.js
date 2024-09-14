const GameRoom = require('../models/GameRoom');
const getRandomWord = require('../utils/wordGenerator');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join_room', async ({ roomId, username }) => {
      socket.join(roomId);
      let room = await GameRoom.findOne({ roomId: roomId });
      if (!room) {
        room = new GameRoom({ roomId: roomId, players: [], currentWord: '', currentDrawer: '' });
      }
      room.players.push({ userId: socket.id, username: username, score: 0 });
      await room.save();
      io.to(roomId).emit('room_update', room);
    });

    socket.on('start_game', async ({ roomId }) => {
      const room = await GameRoom.findOne({ roomId: roomId });
      if (room) {
        room.currentWord = getRandomWord();
        room.currentDrawer = room.players[0].userId;
        await room.save();
        io.to(roomId).emit('game_started', { currentDrawer: room.currentDrawer });
        io.to(room.currentDrawer).emit('your_turn', { word: room.currentWord });
      }
    });

    socket.on('draw', ({ roomId, drawData }) => {
      socket.to(roomId).emit('draw_update', drawData);
    });

    socket.on('guess', async ({ roomId, username, guess }) => {
      const room = await GameRoom.findOne({ roomId: roomId });
      if (room && guess.toLowerCase() === room.currentWord.toLowerCase()) {
        const player = room.players.find(p => p.username === username);
        if (player) {
          player.score += 10; // Adjust scoring as needed
          await room.save();
          io.to(roomId).emit('correct_guess', { username: username, newScore: player.score });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};