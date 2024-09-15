import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import PlayPage from './components/PlayPage';
import JoinRoomPage from './components/JoinRoomPage';
import CreateRoomPage from './components/CreateRoomPage';
import LoginPage from './components/LoginPage';
import GameRoom from './components/GameRoom';
import Game from './components/Game';

function ProtectedRoute({ children, path }) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: path } }} replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/play" element={
            <ProtectedRoute path="/play">
              <PlayPage />
            </ProtectedRoute>
          } />
          <Route path="/join-room" element={
            <ProtectedRoute path="/join-room">
              <JoinRoomPage />
            </ProtectedRoute>
          } />
          <Route path="/create-room" element={
            <ProtectedRoute path="/create-room">
              <CreateRoomPage />
            </ProtectedRoute>
          } />
          <Route path="/game-room/:roomCode" element={
            <ProtectedRoute path="/game-room/:roomCode">
              <GameRoom />
            </ProtectedRoute>
          } />
          <Route path="/game/:roomCode" element={
            <ProtectedRoute path="/game/:roomCode">
              <Game />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;