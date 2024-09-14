import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000'); // Assuming your backend is running on port 5000

function App() {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const joinRoom = () => {
    if (roomId && username) {
      socket.emit('join_room', { roomId, username });
    }
  };

  useEffect(() => {
    socket.on('room_update', (room) => {
      console.log('Room updated:', room);
      // Update your UI with the room information
    });

    return () => {
      socket.off('room_update');
    };
  }, []);

  return (
    <div className="App">
      <h1>Pictionary Game</h1>
      {connected ? <p>Connected to server</p> : <p>Disconnected from server</p>}
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter Room ID"
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter Username"
      />
      <button onClick={joinRoom}>Join Room</button>
      {/* Add your game components here */}
    </div>
  );
}

export default App;