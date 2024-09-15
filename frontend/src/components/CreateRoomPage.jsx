import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateRoomPage.css';

function CreateRoomPage() {
  const [roomSettings, setRoomSettings] = useState({
    numberOfPlayers: 2,
    language: 'English',
    numberOfRounds: 3,
    drawingTime: 60
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoomSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token); // Add this line
      console.log('Room settings:', roomSettings); // Add this line
      const response = await axios.post('http://localhost:3000/api/rooms/create', roomSettings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response:', response.data); // Add this line
      
      if (response.data.success) {
        navigate(`/game-room/${response.data.roomCode}`);
      }
    } catch (error) {
      console.error('Room creation error:', error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || 'An error occurred while creating the room');
    }
  };

  return (
    <div className="create-room-page">
      <h2>Create a Room</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="numberOfPlayers">Number of Players:</label>
          <input
            type="number"
            id="numberOfPlayers"
            name="numberOfPlayers"
            min="2"
            max="10"
            value={roomSettings.numberOfPlayers}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="language">Language:</label>
          <select
            id="language"
            name="language"
            value={roomSettings.language}
            onChange={handleInputChange}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            {/* Add more language options as needed */}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="numberOfRounds">Number of Rounds:</label>
          <input
            type="number"
            id="numberOfRounds"
            name="numberOfRounds"
            min="1"
            max="10"
            value={roomSettings.numberOfRounds}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="drawingTime">Drawing Time (seconds):</label>
          <input
            type="number"
            id="drawingTime"
            name="drawingTime"
            min="30"
            max="300"
            step="30"
            value={roomSettings.drawingTime}
            onChange={handleInputChange}
          />
        </div>
        <button type="submit">Create Room</button>
      </form>
    </div>
  );
}

export default CreateRoomPage;