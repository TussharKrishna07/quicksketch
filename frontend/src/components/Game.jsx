import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DrawingCanvas from './DrawingCanvas';
import ChatBox from './ChatBox';

function Game() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // TODO: Implement game logic, socket connection, etc.
    console.log(`Joined room ${roomId}`);
  }, [roomId]);

  return (
    <div className="game">
      <h2>QuickSketch - Room {roomId}</h2>
      <div className="game-info">
        <p>Current Word: {currentWord}</p>
        <p>Time Left: {timeLeft} seconds</p>
      </div>
      <div className="game-main">
        <DrawingCanvas />
        <div className="game-sidebar">
          <div className="players-list">
            <h3>Players</h3>
            <ul>
              {players.map((player, index) => (
                <li key={index}>{player.name}: {player.score}</li>
              ))}
            </ul>
          </div>
          <ChatBox />
        </div>
      </div>
    </div>
  );
}

export default Game;