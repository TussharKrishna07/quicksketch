import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JoinRoomPage.css';

function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/game-room/${roomCode}`);
  };

  return (
    <div className="join-room-page">
      <h2>Join a Room</h2>
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