import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './GameRoom.css';

function GameRoom() {
  const { roomCode } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [players, setPlayers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket']
    });
    setSocket(newSocket);

    const playerId = localStorage.getItem('playerId');
    const username = localStorage.getItem('username');
    newSocket.emit('joinRoom', { roomCode, playerId, username });

    newSocket.on('playerJoined', (updatedPlayers) => {
      console.log('Updated players:', updatedPlayers);
      setPlayers(updatedPlayers);
    });

    newSocket.on('roomData', (room) => {
      setRoomData(room);
      const currentPlayerId = localStorage.getItem('playerId');
      setIsAdmin(currentPlayerId === room.admin);
    });

    newSocket.on('gameStarted', () => {
      navigate(`/game/${roomCode}`);
    });

    newSocket.on('roomError', (errorMessage) => {
      setError(errorMessage);
    });

    return () => newSocket.close();
  }, [roomCode, navigate]);

  const startGame = () => {
    if (socket && isAdmin) {
      socket.emit('startGame', { roomCode });
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!roomData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-room">
      <h2>Waiting Room: {roomCode}</h2>
      <p>Number of Players: {players.length} / {roomData.numberOfPlayers}</p>
      <p>Language: {roomData.language}</p>
      <p>Number of Rounds: {roomData.numberOfRounds}</p>
      <p>Drawing Time: {roomData.drawingTime} seconds</p>
      <h3>Players:</h3>
      <ul className="player-list">
        {players.map((player) => (
          <li key={player.id}>
            {player.username} ({player.role})
            {player.id === roomData.admin && ' (Admin)'}
          </li>
        ))}
      </ul>
      {isAdmin && players.length >= 2 && (
        <button onClick={startGame} className="start-game-button">Start Game</button>
      )}
      {isAdmin && <p>You are the admin. You can start the game when there are at least 2 players.</p>}
      {!isAdmin && <p>Waiting for the admin to start the game...</p>}
    </div>
  );
}

export default GameRoom;