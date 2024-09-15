const Room = require('../models/Room');
const User = require('../models/User');

// Add this array of words for the game
const words = ['apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jacket'];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

module.exports = (io) => {
  const connectedClients = new Set();
  const gameStates = new Map();

  io.on('connection', (socket) => {
    if (!connectedClients.has(socket.id)) {
      connectedClients.add(socket.id);
      console.log('New client connected:', socket.id);
    }

    socket.on('joinRoom', async ({ roomCode, userId }) => {
      try {
        const room = await Room.findOne({ code: roomCode }).populate('players', 'username');
        if (!room) {
          socket.emit('roomError', 'Room not found');
          return;
        }

        const user = await User.findById(userId);
        if (!user) {
          socket.emit('roomError', 'User not found');
          return;
        }

        if (room.players.length >= room.numberOfPlayers) {
          socket.emit('roomError', 'Room is full');
          return;
        }

        // Check if the user is already in the room
        const existingPlayerIndex = room.players.findIndex(player => player._id.toString() === userId);
        if (existingPlayerIndex === -1) {
          room.players.push(user);
          await room.save();
        }

        socket.join(roomCode);

        const updatedRoom = await Room.findOne({ code: roomCode }).populate('players', 'username');
        const playerList = updatedRoom.players.map(player => ({
          id: player._id.toString(),
          username: player.username
        }));

        // Emit the updated player list to all clients in the room
        io.to(roomCode).emit('playerJoined', playerList);

        if (updatedRoom.players.length === updatedRoom.numberOfPlayers) {
          io.to(roomCode).emit('gameReady');
        }
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('roomError', 'Error joining room');
      }
    });

    socket.on('startGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode }).populate('players', 'username');
        if (!room) {
          socket.emit('roomError', 'Room not found');
          return;
        }

        if (room.players.length < 2) {
          socket.emit('roomError', 'Not enough players to start the game');
          return;
        }

        room.status = 'playing';
        await room.save();

        const gameState = {
          currentRound: 1,
          totalRounds: room.numberOfRounds,
          players: room.players.map(player => ({
            id: player._id.toString(),
            username: player.username,
            score: 0
          })),
          currentDrawerIndex: 0,
          drawingTime: room.drawingTime, // Add this line
          timeLeft: room.drawingTime,
          word: getRandomWord()
        };

        gameStates.set(roomCode, gameState);

        startRound(roomCode);

        io.to(roomCode).emit('gameStarted', gameState);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('roomError', 'Error starting game');
      }
    });

    socket.on('draw', ({ roomCode, x, y, prevX, prevY }) => {
      socket.to(roomCode).emit('updateCanvas', { x, y, prevX, prevY });
    });

    socket.on('chat', ({ roomCode, message, userId }) => {
      const gameState = gameStates.get(roomCode);
      if (!gameState) return;

      const player = gameState.players.find(p => p.id === userId);
      if (!player) return;

      if (gameState.word.toLowerCase() === message.toLowerCase() && userId !== gameState.players[gameState.currentDrawerIndex].id) {
        // Correct guess
        player.score += 10; // Add points for correct guess
        gameState.players[gameState.currentDrawerIndex].score += 5; // Add points for drawer

        io.to(roomCode).emit('correctGuess', { userId, word: gameState.word });
        io.to(roomCode).emit('updateScores', gameState.players);

        endRound(roomCode);
      } else {
        io.to(roomCode).emit('chat', { username: player.username, text: message });
      }
    });

    socket.on('sendChatMessage', ({ roomCode, message, userId, username }) => {
      const chatMessage = {
        username,
        message,
        timestamp: new Date()
      };
      
      // Broadcast the message to all clients in the room
      io.to(roomCode).emit('chatMessage', chatMessage);

      // If the game is in progress, check if the message is the correct guess
      const gameState = gameStates.get(roomCode);
      if (gameState && gameState.word) {
        if (message.toLowerCase() === gameState.word.toLowerCase() && userId !== gameState.players[gameState.currentDrawerIndex].id) {
          // Correct guess
          const player = gameState.players.find(p => p.id === userId);
          if (player) {
            player.score += 10; // Add points for correct guess
            gameState.players[gameState.currentDrawerIndex].score += 5; // Add points for drawer

            io.to(roomCode).emit('correctGuess', { userId, word: gameState.word });
            io.to(roomCode).emit('updateScores', gameState.players);

            endRound(roomCode);
          }
        }
      }
    });

    socket.on('disconnect', () => {
      connectedClients.delete(socket.id);
      console.log('Client disconnected:', socket.id);
    });
  });

  function startRound(roomCode) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    gameState.timeLeft = gameState.drawingTime; // Use the drawing time set by the admin
    gameState.word = getRandomWord();

    io.to(roomCode).emit('roundStart', {
      drawer: gameState.players[gameState.currentDrawerIndex],
      word: gameState.word,
      timeLeft: gameState.timeLeft
    });

    const timer = setInterval(() => {
      gameState.timeLeft--;
      io.to(roomCode).emit('updateTimer', gameState.timeLeft);

      if (gameState.timeLeft <= 0) {
        clearInterval(timer);
        endRound(roomCode);
      }
    }, 1000);
  }

  function endRound(roomCode) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    gameState.currentDrawerIndex = (gameState.currentDrawerIndex + 1) % gameState.players.length;
    gameState.currentRound++;

    if (gameState.currentRound > gameState.totalRounds) {
      endGame(roomCode);
    } else {
      io.to(roomCode).emit('roundEnd', {
        word: gameState.word,
        scores: gameState.players
      });
      setTimeout(() => startRound(roomCode), 5000); // 5 seconds break between rounds
    }
  }

  function endGame(roomCode) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    io.to(roomCode).emit('gameEnd', {
      winner: sortedPlayers[0],
      finalScores: sortedPlayers
    });

    gameStates.delete(roomCode);
  }
};