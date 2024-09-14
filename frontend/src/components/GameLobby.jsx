import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GameLobby() {
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Room 1', players: 2 },
    { id: 2, name: 'Room 2', players: 1 },
    { id: 3, name: 'Room 3', players: 3 },
  ]);
  const navigate = useNavigate();

  const joinRoom = (roomId) => {
    // TODO: Implement room joining logic
    navigate(`/game/${roomId}`);
  };

  const createRoom = () => {
    // TODO: Implement room creation logic
    const newRoomId = rooms.length + 1;
    setRooms([...rooms, { id: newRoomId, name: `Room ${newRoomId}`, players: 1 }]);
    navigate(`/game/${newRoomId}`);
  };

  return (
    <div className="game-lobby">
      <h2>Game Lobby</h2>
      <button onClick={createRoom}>Create New Room</button>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            {room.name} - Players: {room.players}/4
            <button onClick={() => joinRoom(room.id)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GameLobby;