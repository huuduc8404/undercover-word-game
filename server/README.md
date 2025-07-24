# Undercover Word Game Combined Server

This is a combined server for the Undercover Word Game, serving both the frontend and backend from the same domain. This enables players to connect from different networks without cross-origin issues.

## Features

- Game room management
- Player connection handling
- Game state synchronization
- Cross-network play support
- Reconnection handling
- Serves frontend static files from a subfolder
- Single domain for both frontend and backend

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   ```
   PORT=3001
   ```
4. Build the frontend and backend:
   ```bash
   npm run build:all
   ```
5. Start the production server:
   ```bash
   npm start
   ```

## Development

For development, you can run:
```bash
npm run dev
```

This will start the server with hot reload.

## Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the TypeScript code (backend only)
- `npm run build:frontend` - Build the frontend
- `npm run build:all` - Build both frontend and backend
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Project Structure

```
server/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── types/
│   │   └── game.ts        # Game type definitions
│   ├── rooms/
│   │   ├── gameRoom.ts    # Game room class
│   │   └── roomManager.ts # Room management
│   ├── handlers/
│   │   └── gameHandlers.ts # Socket event handlers
│   └── utils/
│       └── helpers.ts     # Utility functions
├── public/                # Frontend static files (generated)
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Environment Variables

- `PORT` - The port the server will listen on (default: 3001)

## API

### Socket.IO Events

#### Client to Server

- `createRoom` - Create a new game room
  ```typescript
  socket.emit('createRoom', username, (roomId: string) => {
    console.log(`Room created: ${roomId}`);
  });
  ```

- `joinRoom` - Join an existing game room
  ```typescript
  socket.emit('joinRoom', roomId, username, (success: boolean, message?: string) => {
    if (success) {
      console.log('Joined room successfully');
    } else {
      console.error(`Failed to join room: ${message}`);
    }
  });
  ```

- `updateGameState` - Update the game state (host only)
  ```typescript
  socket.emit('updateGameState', gameState);
  ```

- `submitVote` - Submit a vote
  ```typescript
  socket.emit('submitVote', voterId, targetId);
  ```

- `submitDescription` - Submit a word description
  ```typescript
  socket.emit('submitDescription', playerId, description);
  ```

- `submitMrWhiteGuess` - Submit a Mr. White guess
  ```typescript
  socket.emit('submitMrWhiteGuess', guess);
  ```

- `leaveRoom` - Leave the current room
  ```typescript
  socket.emit('leaveRoom');
  ```

#### Server to Client

- `gameState` - Receive updated game state
  ```typescript
  socket.on('gameState', (state: GameState) => {
    console.log('Received game state:', state);
  });
  ```

- `playerJoined` - A new player joined the room
  ```typescript
  socket.on('playerJoined', (player: Player) => {
    console.log('Player joined:', player);
  });
  ```

- `playerLeft` - A player left the room
  ```typescript
  socket.on('playerLeft', (playerId: string) => {
    console.log('Player left:', playerId);
  });
  ```

- `error` - Error message from the server
  ```typescript
  socket.on('error', (message: string) => {
    console.error('Server error:', message);
  });
  ```

## Deployment

### Local Development with Tunneling

1. Build and start the server:
   ```bash
   npm run build:all
   npm start
   ```

2. In a separate terminal, start ngrok:
   ```bash
   ngrok http 3001
   ```

3. Share the ngrok URL with your players.

### Production Deployment

1. Build both frontend and backend:
   ```bash
   npm run build:all
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. For a permanent solution, deploy to a hosting service like Heroku, Vercel, or DigitalOcean.

## Troubleshooting

See the [Troubleshooting Guide](../websocket-server-troubleshooting.md) for common issues and solutions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.