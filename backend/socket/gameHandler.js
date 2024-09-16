const Room = require('../models/Room');
const axios = require('axios');

const words = ['apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jacket'];

// Function to get a random word from the API
async function getRandomWord() {
  try {
    const response = await axios.get('https://random-word-api.herokuapp.com/word');
    return response.data[0]; // The API returns an array with a single word
  } catch (error) {
    console.error('Error fetching random word:', error);
    return fallbackRandomWord(); // Use a fallback method if the API fails
  }
}

// Fallback function in case the API fails
function fallbackRandomWord() {
  const fallbackWords = ['apple', 'banana', 'cherry', 'dog', 'elephant', 'frog', 'guitar', 'house', 'island', 'jacket'];
  return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
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
        } ``

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
      console.log('joinGame', roomCode, userId, username);
      try {
        let gameState = gameStates.get(roomCode);
        if (!gameState) {
          gameState = {
            players: [],
            currentDrawer: null,
            currentDrawerIndex: 0,
            word: '',
            timeLeft: 60,
            drawingTime: 60,
            correctGuesses: 0,
            currentRound: 1,
            totalRounds: 3,
            turnTimer: null,
            currentWord: '',
          };
          gameStates.set(roomCode, gameState);
        }

        // Check if player already exists
        const existingPlayerIndex = gameState.players.findIndex(p => p.id === userId);
        if (existingPlayerIndex === -1) {
          // New player
          gameState.players.push({ id: userId, username, score: 0, socketId: socket.id });
        } else {
          // Update existing player
          gameState.players[existingPlayerIndex].socketId = socket.id;
          gameState.players[existingPlayerIndex].username = username;
        }

        // Assign drawer if this is the first player
        if (gameState.players.length === 1) {
          gameState.currentDrawer = userId;
        }

        await socket.join(roomCode);

        // Emit updated game state to all clients in the room
        io.to(roomCode).emit('gameState', {
          players: gameState.players,
          currentDrawer: gameState.currentDrawer,
          timeLeft: gameState.timeLeft,
        });

        await startRound(roomCode);

        // Emit a personal welcome message to the joining player
        socket.emit('joinGameResponse', { 
          success: true, 
          message: 'Joined the game successfully',
          playerId: userId
        });

      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('joinGameResponse', { success: false, message: 'Error joining game' });
      }
    });

    socket.on('draw', ({ roomCode, x, y, prevX, prevY }) => {
      socket.to(roomCode).emit('updateCanvas', { x, y, prevX, prevY });
    });

    socket.on('sendChatMessage', ({ roomCode, message, userId, username }) => {
      const gameState = gameStates.get(roomCode);
      if (!gameState) return;

      // Emit the chat message to all clients in the room
      io.to(roomCode).emit('chatMessage', { username, message });

      if (gameState.word && message.toLowerCase() === gameState.word.toLowerCase() && userId !== gameState.players[gameState.currentDrawerIndex].id) {
        // Correct guess logic
        // ...
      }
    });

    // Function to update player score
    function updatePlayerScore(gameState, playerId, scoreToAdd) {
      const playerIndex = gameState.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        gameState.players[playerIndex].score += scoreToAdd;
      }
    }

    // Function to get updated game state (use this when emitting game state)
    function getUpdatedGameState(gameState) {
      return {
        players: gameState.players,
        currentDrawer: gameState.currentDrawer,
        // ... other game state properties
      };
    }

    // Example: Handling correct guess
    socket.on('correctGuess', ({ roomCode, playerId }) => {
      const gameState = gameStates.get(roomCode);
      if (gameState) {
        updatePlayerScore(gameState, playerId, 10); // Add 10 points for correct guess
        io.to(roomCode).emit('gameState', getUpdatedGameState(gameState));
      }
    });

    // Example: Ending a round
    function endRound(roomCode) {
      const gameState = gameStates.get(roomCode);
      if (gameState) {
        // Update scores, change current drawer, etc.
        // ...

        // Emit updated game state
        io.to(roomCode).emit('gameState', getUpdatedGameState(gameState));
        io.to(roomCode).emit('roundEnd', {
          word: gameState.word,
          scores: gameState.players.map(p => ({ id: p.id, score: p.score }))
        });
      }
    }

    // Example: Starting a new game
    function startNewGame(roomCode) {
      const gameState = gameStates.get(roomCode);
      if (gameState) {
        // Reset scores
        gameState.players.forEach(p => p.score = 0);
        
        // Set new current drawer, reset other game state properties
        // ...

        // Emit updated game state
        io.to(roomCode).emit('gameState', getUpdatedGameState(gameState));
      }
    }
  });

  async function startRound(roomCode) {
    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    gameState.timeLeft = gameState.drawingTime;
    gameState.word = await getRandomWord();  // Assuming getRandomWord is async
    gameState.correctGuesses = 0;

    io.to(roomCode).emit('roundStart', {
      drawer: gameState.players[gameState.currentDrawerIndex],
      timeLeft: gameState.timeLeft
    });

    const currentDrawer = gameState.players[gameState.currentDrawerIndex];
    io.to(currentDrawer.socketId).emit('wordToDraw', gameState.word);

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