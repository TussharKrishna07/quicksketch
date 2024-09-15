import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import CreateRoomPage from './components/CreateRoomPage';
import JoinRoomPage from './components/JoinRoomPage';
import GameRoom from './components/GameRoom';
import Game from './components/Game';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-room" element={<CreateRoomPage />} />
          <Route path="/join-room" element={<JoinRoomPage />} />
          <Route path="/game-room/:roomCode" element={<GameRoom />} />
          <Route path="/game/:roomCode" element={<Game />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;