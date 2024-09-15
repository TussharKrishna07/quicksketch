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
      transports: ['websocket'],
      upgrade: false
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/rooms/${roomCode}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.data.success) {
          setRoomData(response.data.room);
          setPlayers(response.data.room.players);
          const currentUser = JSON.parse(localStorage.getItem('user'));
          setIsAdmin(currentUser.id === response.data.room.admin);
        } else {
          setError('Failed to load room data');
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
        setError('Failed to load room data');
      }
    };

    fetchRoomData();
  }, [roomCode]);

  useEffect(() => {
    if (socket == null || roomData == null) return;

    const userId = JSON.parse(localStorage.getItem('user')).id;
    socket.emit('joinRoom', { roomCode, userId });

    socket.on('playerJoined', (updatedPlayers) => {
      console.log('Updated players:', updatedPlayers);
      setPlayers(updatedPlayers);
    });

    socket.on('gameReady', () => {
      setGameStatus('ready');
    });

    socket.on('gameStarted', () => {
      setGameStatus('playing');
      navigate(`/game/${roomCode}`);
    });

    socket.on('roomError', (errorMessage) => {
      setError(errorMessage);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('gameReady');
      socket.off('gameStarted');
      socket.off('roomError');
    };
  }, [socket, roomData, roomCode, navigate]);

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
          <li key={player.id}>{player.username}</li>
        ))}
      </ul>
      {isAdmin && players.length >= 2 && gameStatus === 'waiting' && (
        <button onClick={startGame} className="start-game-button">Start Game</button>
      )}
    </div>
  );
}

export default GameRoom;