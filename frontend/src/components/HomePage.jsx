import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const handleButtonClick = (path, role) => {
    navigate('/login', { state: { from: { pathname: path }, role } });
  };

  return (
    <center>
    <div className="home-page">
      <div className="content-wrapper">
        <h1 className="game-title">Word Guessing Game</h1>
        <p className="game-description">
          Challenge your friends in this exciting word guessing game!
        </p>
        <div className="button-container">
          <button onClick={() => handleButtonClick('/play', 'participant')} className="game-button">PLAY</button>
          <button onClick={() => handleButtonClick('/join-room', 'participant')} className="game-button">Join Room</button>
          <button onClick={() => handleButtonClick('/create-room', 'admin')} className="game-button">Create Room</button>
        </div>
      </div>
    </div>
    </center>
  );
}

export default HomePage;