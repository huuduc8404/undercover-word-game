# Websocket Server Implementation Plan

This document outlines the detailed implementation steps for creating a websocket server for the Undercover Word Game that allows players to connect from different networks.

## 1. Server-Side Implementation

### 1.1 Set up the server project structure

First, create a new directory for the server:

```bash
mkdir server
cd server
```

Initialize a new Node.js project:

```bash
npm init -y
```

Set up TypeScript configuration:

```bash
npm install --save-dev typescript @types/node ts-node nodemon
```

Create a `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

Create the project directory structure:

```bash
mkdir -p src/types src/rooms src/handlers
```

### 1.2 Install required dependencies

Install the necessary packages:

```bash
npm install express socket.io cors dotenv
npm install --save-dev @types/express @types/socket.io @types/cors
```

### 1.3 Create the main server entry point

Create `src/index.ts`:

```typescript
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupGameHandlers } from './handlers/gameHandlers';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Set up game handlers
setupGameHandlers(io);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 1.4 Copy game types from the client

Create `src/types/game.ts` with the same types as in the client:

```typescript
export type PlayerRole = "civilian" | "undercover" | "mrwhite" | "spectator";

export type RoleDistribution = {
  undercovers: number;
  mrWhites: number;
};

export type Player = {
  id: string;
  name: string;
  word?: string;
  role?: PlayerRole;
  isEliminated?: boolean;
  score?: number;
  submittedDescription?: string;
};

export type GamePhase = "setup" | "wordReveal" | "discussion" | "voting" | "results" | "gameEnd";

export type GameState = {
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  majorityWord: string;
  undercoverWord: string;
  votingResults?: Record<string, string>;
  speakingOrder?: string[];
  lastEliminatedId?: string;
  winner?: string;
  mrWhiteGuess?: string;
  roleDistribution: RoleDistribution;
};

// Socket.IO event types
export type ServerToClientEvents = {
  gameState: (state: GameState) => void;
  roomCreated: (roomId: string) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  error: (message: string) => void;
};

export type ClientToServerEvents = {
  createRoom: (username: string, callback: (roomId: string) => void) => void;
  joinRoom: (roomId: string, username: string, callback: (success: boolean, message?: string) => void) => void;
  updateGameState: (state: GameState) => void;
  submitVote: (voterId: string, targetId: string) => void;
  submitDescription: (playerId: string, description: string) => void;
  submitMrWhiteGuess: (guess: string) => void;
  leaveRoom: () => void;
};
```

## 2. Implement server-side game room management

### 2.1 Create a GameRoom class

Create `src/rooms/gameRoom.ts`:

```typescript
import { GameState, Player } from '../types/game';

export class GameRoom {
  private roomId: string;
  private hostId: string;
  private players: Map<string, Player>;
  private gameState: GameState;

  constructor(roomId: string, hostId: string, hostName: string) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.players = new Map();
    
    // Add host as the first player
    const hostPlayer: Player = {
      id: hostId,
      name: hostName,
    };
    this.players.set(hostId, hostPlayer);
    
    // Initialize game state
    this.gameState = {
      players: [hostPlayer],
      phase: 'setup',
      currentRound: 1,
      majorityWord: '',
      undercoverWord: '',
      roleDistribution: {
        undercovers: 1,
        mrWhites: 0
      }
    };
  }

  getRoomId(): string {
    return this.roomId;
  }

  getHostId(): string {
    return this.hostId;
  }

  getGameState(): GameState {
    return this.gameState;
  }

  updateGameState(newState: GameState): void {
    this.gameState = newState;
    
    // Update players map to match game state
    this.gameState.players.forEach(player => {
      this.players.set(player.id, player);
    });
  }

  addPlayer(playerId: string, playerName: string): Player {
    const newPlayer: Player = {
      id: playerId,
      name: playerName
    };
    
    this.players.set(playerId, newPlayer);
    
    // Update game state
    this.gameState.players.push(newPlayer);
    
    return newPlayer;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    
    // Update game state
    this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }
}
```

### 2.2 Create a room manager

Create `src/rooms/roomManager.ts`:

```typescript
import { GameRoom } from './gameRoom';
import { generateRoomId } from '../utils/helpers';

export class RoomManager {
  private rooms: Map<string, GameRoom>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostId: string, hostName: string): string {
    // Generate a unique room ID (6 characters)
    let roomId = generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    // Create a new game room
    const room = new GameRoom(roomId, hostId, hostName);
    this.rooms.set(roomId, room);

    return roomId;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isEmpty()) {
        this.rooms.delete(roomId);
      }
    }
  }
}

// Create a singleton instance
export const roomManager = new RoomManager();
```

### 2.3 Create helper functions

Create `src/utils/helpers.ts`:

```typescript
/**
 * Generates a random room ID (6 characters)
 */
export function generateRoomId(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Maps socket IDs to player IDs
 */
export const socketToPlayer = new Map<string, string>();
export const playerToRoom = new Map<string, string>();
```

## 3. Implement game event handlers

Create `src/handlers/gameHandlers.ts`:

```typescript
import { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/roomManager';
import { ClientToServerEvents, ServerToClientEvents, GameState } from '../types/game';
import { socketToPlayer, playerToRoom } from '../utils/helpers';

export function setupGameHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a new game room
    socket.on('createRoom', (username, callback) => {
      const roomId = roomManager.createRoom(socket.id, username);
      
      // Store mapping
      socketToPlayer.set(socket.id, socket.id);
      playerToRoom.set(socket.id, roomId);
      
      // Join the socket to the room
      socket.join(roomId);
      
      console.log(`Room created: ${roomId} by ${username} (${socket.id})`);
      callback(roomId);
    });

    // Join an existing game room
    socket.on('joinRoom', (roomId, username, callback) => {
      const room = roomManager.getRoom(roomId);
      
      if (!room) {
        callback(false, 'Room not found');
        return;
      }
      
      // Add player to the room
      const player = room.addPlayer(socket.id, username);
      
      // Store mapping
      socketToPlayer.set(socket.id, socket.id);
      playerToRoom.set(socket.id, roomId);
      
      // Join the socket to the room
      socket.join(roomId);
      
      // Notify host about the new player
      socket.to(roomId).emit('playerJoined', player);
      
      // Send current game state to the new player
      socket.emit('gameState', room.getGameState());
      
      console.log(`Player ${username} (${socket.id}) joined room ${roomId}`);
      callback(true);
    });

    // Update game state (only host can do this)
    socket.on('updateGameState', (state: GameState) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) return;
      
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      // Only host can update game state
      if (room.getHostId() !== playerId) return;
      
      // Update the game state
      room.updateGameState(state);
      
      // Broadcast to all players in the room except sender
      socket.to(roomId).emit('gameState', state);
    });

    // Submit a vote
    socket.on('submitVote', (voterId, targetId) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitVote', voterId, targetId);
    });

    // Submit a description
    socket.on('submitDescription', (playerId, description) => {
      const senderId = socketToPlayer.get(socket.id);
      if (!senderId) return;
      
      const roomId = playerToRoom.get(senderId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitDescription', playerId, description);
    });

    // Submit Mr. White guess
    socket.on('submitMrWhiteGuess', (guess) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitMrWhiteGuess', guess);
    });

    // Leave room
    socket.on('leaveRoom', () => {
      handlePlayerDisconnect(socket);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      handlePlayerDisconnect(socket);
    });
  });

  // Helper function to handle player disconnection
  function handlePlayerDisconnect(socket: Socket) {
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) return;
    
    const roomId = playerToRoom.get(playerId);
    if (!roomId) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room) return;
    
    // Remove player from room
    room.removePlayer(playerId);
    
    // Notify other players
    socket.to(roomId).emit('playerLeft', playerId);
    
    // Clean up mappings
    socketToPlayer.delete(socket.id);
    playerToRoom.delete(playerId);
    
    // If room is empty or only has the host, remove it
    if (room.isEmpty()) {
      roomManager.removeRoom(roomId);
    }
    
    // Leave the socket room
    socket.leave(roomId);
  }
}
```

## 4. Client-Side Implementation

### 4.1 Install Socket.IO client

```bash
npm install socket.io-client
```

### 4.2 Create WebSocketContext

Create `src/context/WebSocketContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGame } from "./GameContext";
import { GameState, Player } from "../types/game";
import { toast } from "sonner";
import { useSound } from "./SoundContext";

// Get the WebSocket URL from environment variables
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:3001";

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  isHost: boolean;
  hostGame: (username: string) => void;
  joinGame: (roomId: string, username: string) => void;
  sendGameState: (state: GameState) => void;
  sendToHost: (eventName: string, ...args: any[]) => void;
  leaveGame: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { playSound } = useSound();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const { gameState, setGameState, addPlayer, removePlayer, submitMrWhiteGuess, submitVote, submitDescription } = useGame();

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(WEBSOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
    });

    newSocket.on("error", (message) => {
      console.error("WebSocket error:", message);
      toast.error(message);
    });

    // Game state updates
    newSocket.on("gameState", (state: GameState) => {
      console.debug("Received game state:", state);
      setGameState(state);
    });

    // Player joined event
    newSocket.on("playerJoined", (player: Player) => {
      console.log("Player joined:", player);
      playSound("/sounds/player-joined.mp3");
      addPlayer(player.name, player.id);
    });

    // Player left event
    newSocket.on("playerLeft", (playerId: string) => {
      console.log("Player left:", playerId);
      removePlayer(playerId);
      toast.error(`${gameState.players.find(p => p.id === playerId)?.name || 'A player'} disconnected`);
    });

    // Host-specific event handlers
    if (isHost) {
      // Vote submission
      newSocket.on("submitVote", (voterId: string, targetId: string) => {
        console.debug("Received vote:", { voterId, targetId });
        submitVote(voterId, targetId);
      });

      // Description submission
      newSocket.on("submitDescription", (playerId: string, description: string) => {
        console.debug("Received description:", { playerId, description });
        submitDescription(playerId, description);
      });

      // Mr. White guess
      newSocket.on("submitMrWhiteGuess", (guess: string) => {
        console.debug("Received Mr. White guess:", guess);
        submitMrWhiteGuess(guess);
      });
    }

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isHost]);

  // Host a new game
  const hostGame = (username: string) => {
    if (!socket || !connected) {
      toast.error("Not connected to server");
      return;
    }

    socket.emit("createRoom", username, (newRoomId: string) => {
      setRoomId(newRoomId);
      setIsHost(true);
      addPlayer(username, socket.id);
      toast.success(`Game hosted! Share this code with players: ${newRoomId}`);
    });
  };

  // Join an existing game
  const joinGame = (joinRoomId: string, username: string) => {
    if (!socket || !connected) {
      toast.error("Not connected to server");
      return;
    }

    socket.emit("joinRoom", joinRoomId, username, (success: boolean, message?: string) => {
      if (success) {
        setRoomId(joinRoomId);
        setIsHost(false);
        toast.success("Connected to game!");
      } else {
        toast.error(message || "Failed to join game");
      }
    });
  };

  // Send game state update (host only)
  const sendGameState = (state: GameState) => {
    if (!socket || !connected || !isHost) return;
    console.debug("Sending game state:", state);
    socket.emit("updateGameState", state);
  };

  // Send event to host
  const sendToHost = (eventName: string, ...args: any[]) => {
    if (!socket || !connected || isHost) return;
    console.debug(`Sending ${eventName} to host:`, args);
    socket.emit(eventName, ...args);
  };

  // Leave the current game
  const leaveGame = () => {
    if (!socket || !connected) return;
    socket.emit("leaveRoom");
    setRoomId(null);
    setIsHost(false);
  };

  // Update game state when it changes (host only)
  useEffect(() => {
    if (isHost && connected && roomId) {
      console.log("Host sending updated game state");
      sendGameState(gameState);
    }
  }, [gameState, isHost, connected, roomId]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        roomId,
        isHost,
        hostGame,
        joinGame,
        sendGameState,
        sendToHost,
        leaveGame,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
```

### 4.3 Update MultiplayerSetup component

Modify `src/components/MultiplayerSetup.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext"; // Updated import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, UserPlus, Copy, Link } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const MultiplayerSetup = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { hostGame, joinGame, roomId, connected } = useWebSocket(); // Updated hook
  const [showJoinForm, setShowJoinForm] = useState(searchParams.get("gameId") != undefined);
  const [showHostForm, setShowHostForm] = useState(false);
  const [joinId, setJoinId] = useState(showJoinForm ? searchParams.get("gameId") : "");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const gameId = searchParams.get("gameId");
    if (gameId) {
      setJoinId(gameId);
      setShowJoinForm(true);
    }  
  }, [searchParams]);

  const handleJoin = () => {
    if (!connected) {
      toast.error("Not connected to server");
      return;
    }
    
    if (!joinId.trim()) {
      toast.error("Please enter a game ID!");
      return;
    }
    if (!username.trim()) {
      toast.error("Please enter your username!");
      return;
    }
    joinGame(joinId.trim(), username.trim());
  };

  const handleHost = () => {
    if (!connected) {
      toast.error("Not connected to server");
      return;
    }
    
    if (!username.trim()) {
      toast.error("Please enter your username!");
      return;
    }
    hostGame(username.trim());
  };

  // Share game link
  const handleShareLink = () => {
    if (!roomId) return;
    
    const url = `${window.location.origin}${window.location.pathname}?gameId=${roomId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link"));
  };

  // Copy room code
  const handleCopyCode = () => {
    if (!roomId) return;
    
    navigator.clipboard.writeText(roomId)
      .then(() => toast.success("Game code copied to clipboard!"))
      .catch(() => toast.error("Failed to copy code"));
  };

  return (
    <Card className="max-w-md mx-auto p-6 space-y-6 animate-fade-in glass-morphism">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-gradient">{t('welcome')}</h2>

        {!connected && (
          <div className="p-3 bg-yellow-500/20 rounded-md text-yellow-200 text-sm">
            Connecting to server...
          </div>
        )}

        {roomId && (
          <div className="p-4 bg-primary/20 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Game Code:</span>
              <span className="font-mono font-bold text-lg">{roomId}</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleCopyCode}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleShareLink}
              >
                <Link className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </div>
          </div>
        )}

        {!roomId && !showHostForm && !showJoinForm && (
          <div className="space-y-4">
            <Button
              onClick={() => setShowHostForm(true)}
              className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200"
              disabled={!connected}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Host New Game
            </Button>

            <div className="relative flex items-center">
              <span className="flex-grow border-t border-white/10"></span>
              <span className="px-4 text-xs uppercase text-muted-foreground">
                Or join existing game
              </span>
              <span className="flex-grow border-t border-white/10"></span>
            </div>
            
            <Button
              onClick={() => setShowJoinForm(true)}
              className="w-full bg-secondary hover:bg-secondary/90 transition-colors duration-200"
              disabled={!connected}
            >
              <Users className="mr-2 h-4 w-4" />
              Join Game
            </Button>
          </div>
        )}

        {showHostForm && !roomId && (
          <div className="space-y-4 animate-fade-in">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={25}
              className="w-full bg-secondary/20 border-secondary/30"
            />
            <Button
              onClick={handleHost}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!connected}
            >
              Start Hosting
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowHostForm(false)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {showJoinForm && !roomId && (
          <div className="space-y-4 animate-fade-in">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={25}
              className="w-full bg-secondary/20 border-secondary/30"
            />
            <Input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="Enter game ID"
              className="w-full bg-secondary/20 border-secondary/30"
            />
            <Button
              onClick={handleJoin}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!connected}
            >
              Join Game
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowJoinForm(false)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
```

### 4.4 Update App.tsx to use WebSocketProvider

Modify `src/App.tsx` to replace PeerProvider with WebSocketProvider:

```typescript
// Import WebSocketProvider instead of PeerProvider
import { WebSocketProvider } from "./context/WebSocketContext";

// Then in your component tree, replace:
// <PeerProvider>...</PeerProvider>
// with:
// <WebSocketProvider>...</WebSocketProvider>
```

## 5. Environment Configuration

### 5.1 Server Environment Variables

Create `.env` in the server directory:

```
PORT=3001
CLIENT_URL=http://localhost:3001
```

### 5.2 Client Environment Variables

Create `.env.development` in the project root:

```
VITE_WEBSOCKET_URL=http://localhost:3001
```

Create `.env.production`:

```
VITE_WEBSOCKET_URL=https://your-tunnel-url
```

## 6. Tunneling Setup

### 6.1 Using ngrok

Install ngrok:

```bash
npm install -g ngrok
```

Run the server:

```bash
cd server
npm start
```

In a separate terminal, start ngrok:

```bash
ngrok http 3001
```

This will provide you with a public URL that you can use to access your server from anywhere.

### 6.2 Using Cloudflare Tunnel

Install Cloudflare Tunnel:

```bash
# Download and install cloudflared
# For Linux:
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# For macOS:
brew install cloudflare/cloudflare/cloudflared
```

Authenticate:

```bash
cloudflared tunnel login
```

Create a tunnel:

```bash
cloudflared tunnel create game-server
```

Configure the tunnel:

```bash
# Create a config file
mkdir -p ~/.cloudflared
touch ~/.cloudflared/config.yml
```

Edit the config file:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /path/to/credentials/file.json

ingress:
  - hostname: your-custom-domain.com
    service: http://localhost:3001
  - service: http_status:404
```

Run the tunnel:

```bash
cloudflared tunnel run game-server
```

## 7. Deployment Instructions

### 7.1 Server Deployment

1. Clone the repository
2. Navigate to the server directory
3. Install dependencies: `npm install`