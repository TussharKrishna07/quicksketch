import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import './Game.css';

function Game() {
  const { roomCode } = useParams();
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [wordToDraw, setWordToDraw] = useState('');
  const [guessWord, setGuessWord] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const chatContainerRef = useRef(null);
  const intervalRef = useRef(null);  // Add this line

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket']
    });
    setSocket(newSocket);

    const user = JSON.parse(localStorage.getItem('user'));
    newSocket.emit('joinGame', { roomCode, userId: user.id, username: user.username });

    newSocket.on('gameState', ({ players, currentDrawer, timeLeft }) => {
      setPlayers(prevPlayers => {
        const uniquePlayers = players.reduce((acc, player) => {
          if (!acc.some(p => p.id === player.id)) {
            acc.push(player);
          }
          return acc;
        }, []);
        return uniquePlayers;
      });
      setCurrentDrawer(currentDrawer);
      setTimeLeft(timeLeft);
    });

    newSocket.on('wordToDraw', (word) => {
      setWordToDraw(word);
      setGuessWord('_ '.repeat(word.length));
    });

    newSocket.on('updateCanvas', (data) => {
      drawLine(data.prevX, data.prevY, data.x, data.y);
    });

    newSocket.on('chatMessage', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('correctGuess', ({ username, word }) => {
      setChatMessages(prev => [...prev, { username: 'System', message: `${username} guessed the word: ${word}!` }]);
    });

    newSocket.on('updateTimer', (time) => {
      setTimeLeft(time);
    });

    newSocket.on('roundStart', ({ drawer, timeLeft }) => {
      setCurrentDrawer(drawer.id);
      setTimeLeft(timeLeft);
      clearCanvas();
    });

    newSocket.on('roundEnd', ({ word, scores }) => {
      setChatMessages(prev => [...prev, { username: 'System', message: `Round ended. The word was: ${word}` }]);
      setPlayers(scores);
      setCurrentRound(prev => prev + 1);
    });

    newSocket.on('gameEnd', ({ winner, finalScores }) => {
      setWinner(winner);
      setPlayers(finalScores);
      setGameEnded(true);
    });

    // Modify this part
    intervalRef.current = setInterval(() => {
      clearCanvas();
    }, 60000);

    return () => {
      newSocket.close();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roomCode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (event) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (currentDrawer !== user.id) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setLastX(event.clientX - rect.left);
    setLastY(event.clientY - rect.top);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (event) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!isDrawing || currentDrawer !== user.id) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);

    // Emit drawing data to server
    socket.emit('draw', { roomCode, x, y, prevX: lastX, prevY: lastY });
  };

  const drawLine = (prevX, prevY, x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const user = JSON.parse(localStorage.getItem('user'));
      socket.emit('sendChatMessage', { 
        roomCode, 
        message: chatInput, 
        userId: user.id, 
        username: user.username 
      });
      setChatInput('');
    }
  };

  return (
    <div className="game">
      <div className="game-board">
        <canvas 
          ref={canvasRef} 
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          style={{ cursor: currentDrawer === JSON.parse(localStorage.getItem('user')).id ? 'crosshair' : 'default' }}
        />
        {currentDrawer === JSON.parse(localStorage.getItem('user')).id ? (
          <div className="word-to-draw">Word to draw: {wordToDraw}</div>
        ) : (
          <div className="guess-word">Word: {guessWord}</div>
        )}
        <div className="timer">Time left: {timeLeft} seconds</div>
        <div className="round-info">Round {currentRound} of {totalRounds}</div>
        <div className="current-drawer">
          Current Drawer: {players.find(p => p.id === currentDrawer)?.username || 'Unknown'}
        </div>
      </div>
      <div className="sidebar">
        <div className="leaderboard">
          <h3>Leaderboard</h3>
          <ul className="player-list">
            {Array.from(new Set(players.map(p => p.id)))
              .map(id => players.find(p => p.id === id))
              .sort((a, b) => b.score - a.score)
              .map(player => (
                <li key={player.id} className={`player-item ${player.id === currentDrawer ? 'current-drawer' : ''}`}>
                  <span className="player-name">{player.username}</span>
                  <span className="player-score">{player.score}</span>
                  {player.id === currentDrawer && <span className="drawer-indicator">(Drawing)</span>}
                </li>
              ))
            }
          </ul>
        </div>
        <div className="chat">
          <h3>Chat</h3>
          <div className="chat-messages" ref={chatContainerRef}>
            {chatMessages.map((msg,   index) => (
              <div key={index} className="chat-message">
                <span className="chat-username">{msg.username}: </span>
                <span className="chat-text">{msg.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your guess..."
              className="chat-input"
            />
            <button type="submit" className="chat-send-button">Send</button>
          </form>
        </div>
      </div>
      {gameEnded && (
        <div className="game-end-overlay">
          <h2>Game Over!</h2>
          <p>Winner: {winner.username} with {winner.score} points!</p>
          <button onClick={() => window.location.href = '/'}>Back to Lobby</button>
        </div>
      )}
    </div>
  );
}

export default Game;