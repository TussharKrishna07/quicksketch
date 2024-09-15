const Room = require('../models/Room');

const words = ['apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jacket'];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

module.exports = (io) => {
  const gameStates = new Map();

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ roomCode, playerId, username }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          socket.emit('roomError', 'Room not found');
          return;
        }

        socket.join(roomCode);

        let player = room.players.find(p => p.id === playerId);
        if (!player) {
          player = {
            id: playerId,
            username: username,
            role: room.players.length === 0 ? 'admin' : 'participant'
          };
          room.players.push(player);
          await room.save();
        }

        // If this is the first player, they're the admin
        if (room.players.length === 1) {
          room.admin = playerId;
          await room.save();
        }

        // Emit updated player list to all clients in the room
        io.to(roomCode).emit('playerJoined', room.players);

        // Send room data to the joining player
        socket.emit('roomData', room);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('roomError', 'Error joining room');
      }
    });

    socket.on('startGame', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
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

        io.to(roomCode).emit('gameStarted');
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('roomError', 'Error starting game');
      }
    });

    socket.on('joinGame', async ({ roomCode, userId, username }) => {
      try {
        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          socket.emit('roomError', 'Room not found');
          return;
        }

        socket.join(roomCode);

        let gameState = gameStates.get(roomCode);
        if (!gameState) {
          gameState = {
            currentRound: 1,
            totalRounds: room.numberOfRounds,
            players: room.players.map(player => ({
              id: player.id,
              username: player.username,
              score: 0,
              role: player.role
            })),
            currentDrawerIndex: Math.floor(Math.random() * room.players.length),
            drawingTime: room.drawingTime,
            timeLeft: room.drawingTime,
            word: getRandomWord(),
            correctGuesses: 0
          };
          gameStates.set(roomCode, gameState);
        }

        const playerIndex = gameState.players.findIndex(p => p.id === userId);
        if (playerIndex === -1) {
          gameState.players.push({ id: userId, username, score: 0, role: 'participant' });
        }

        io.to(roomCode).emit('gameState', {
          players: gameState.players,
          currentDrawer: gameState.players[gameState.currentDrawerIndex].id,
          timeLeft: gameState.timeLeft
        });

        socket.emit('wordToDraw', gameState.word);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('roomError', 'Error joining game');
      }
    });

    socket.on('draw', ({ roomCode, x, y, prevX, prevY }) => {
      socket.to(roomCode).emit('updateCanvas', { x, y, prevX, prevY });
    });

    socket.on('sendChatMessage', ({ roomCode, message, userId, username }) => {
      const gameState = gameStates.get(roomCode);
      if (!gameState) return;

      io.to(roomCode).emit('chatMessage', { username, message });

      if (gameState.word && message.toLowerCase() === gameState.word.toLowerCase() && userId !== gameState.players[gameState.currentDrawerIndex].id) {
        const guesser = gameState.players.find(p => p.id === userId);
        const drawer = gameState.players[gameState.currentDrawerIndex];
        
        if (guesser && drawer) {
          guesser.score += 10;
          drawer.score += 5;
          gameState.correctGuesses++;

          io.to(roomCode).emit('correctGuess', { username: guesser.username, word: gameState.word });
          io.to(roomCode).emit('updateScores', gameState.players);

          if (gameState.correctGuesses >= gameState.players.length - 1) {
            endRound(roomCode);
          }
        }
      }
    });
  });

  function startRound(roomCode) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    gameState.timeLeft = gameState.drawingTime;
    gameState.word = getRandomWord();
    gameState.correctGuesses = 0;

    io.to(roomCode).emit('roundStart', {
      drawer: gameState.players[gameState.currentDrawerIndex],
      timeLeft: gameState.timeLeft
    });

    io.to(roomCode).sockets.sockets.get(gameState.players[gameState.currentDrawerIndex].id).emit('wordToDraw', gameState.word);

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

    io.to(roomCode).emit('roundEnd', {
      word: gameState.word,
      scores: gameState.players
    });

    gameState.currentDrawerIndex = (gameState.currentDrawerIndex + 1) % gameState.players.length;
    
    if (gameState.currentDrawerIndex === 0) {
      gameState.currentRound++;
    }

    if (gameState.currentRound > gameState.totalRounds) {
      endGame(roomCode);
    } else {
      setTimeout(() => startRound(roomCode), 5000);
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