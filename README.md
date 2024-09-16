# QuickSketch

## Project Explanation
QuickSketch is an interactive online multiplayer drawing and guessing game, inspired by the popular game Pictionary. Players take turns drawing a given word while others attempt to guess it. The game combines creativity, quick thinking, and social interaction in a fun, digital environment.

## Tech Stack
- Frontend:
  - React.js
  - Socket.IO Client
  - HTML5 Canvas for drawing functionality
- Backend:
  - Node.js
  - Express.js
  - Socket.IO for real-time communication
  - MongoDB for data persistence
- Additional Tools:
  - Axios for HTTP requests
  - Mongoose for MongoDB object modeling

## Team Contributions

This project was primarily developed by two contributors:

### Main Developer (Tusshar Krishna)
- Fully responsible for the frontend development
- Implemented backend middlewares and routing
- Developed the canvas drawing functionality
- Set up the core game logic and Socket.IO integration

### Rajat
- Assisted in building the chat system and timer logic
- Contributed to some aspects of the game logic

Together, we collaborated to create a real-time multiplayer drawing and guessing experience. The project showcases our skills in full-stack development, real-time web technologies, and game logic implementation.

## Features

1. Real-time Multiplayer Gameplay
   - Multiple players can join a game room simultaneously
   - Synchronous drawing and guessing rounds

2. User Authentication
   - Player registration and login system
   - Unique usernames for each player

3. Room Management
   - Create and join game rooms with unique room codes
   - Lobby system for waiting players

4. Drawing Interface
   - HTML5 Canvas-based drawing tool
   - Real-time drawing updates for all players

5. Chat System
   - In-game chat for players to guess and communicate
   - Automatic detection of correct guesses

6. Turn-based Gameplay
   - Rotating turns for drawing among players
   - Timer for each drawing round

7. Scoring System
   - Points awarded for correct guesses and successful drawings
   - Leaderboard displaying current game scores

8. Word Selection
   - Random word generation for drawing prompts
   - Option to skip difficult words (for drawers)

9. Game Rounds
   - Multiple rounds per game session
   - Customizable number of rounds

10. Game State Management
    - Ability to rejoin ongoing games
    - Handling of player disconnections

11. End-game Summary
    - Display of final scores and winner(s)
    - Option to start a new game or return to lobby

13. Customization Options
    - Adjustable game settings (round duration, number of rounds, etc.)

