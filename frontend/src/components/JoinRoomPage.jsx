import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './JoinRoomPage.css';

function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      navigate('/login', { state: { from: { pathname: '/join-room' }, role: 'participant' } });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const username = localStorage.getItem('username');
      if (!username) {
        setError('Username not found. Please log in again.');
        return;
      }
      const response = await axios.post(`http://localhost:3000/api/rooms/join`, 
        { roomCode, username },
        {
          headers: {
            'Role': 'participant'
          }
        }
      );
      
      if (response.data.success) {
        localStorage.setItem('playerId', response.data.playerId);
        navigate(`/game-room/${roomCode}`);
      }
    } catch (error) {
      console.error('Room join error:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || 'An error occurred while joining the room');
    }
  };

  return (
    <div className="join-room-page">
      <h2>Join a Room</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Enter room code"
          required
        />
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}

export default JoinRoomPage;