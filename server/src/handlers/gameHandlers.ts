import { Server, Socket } from 'socket.io';
import { roomManager } from '../rooms/roomManager';
import { ClientToServerEvents, ServerToClientEvents, GameState } from '../types/game';
import { socketToPlayer, playerToRoom } from '../utils/helpers';

/**
 * Set up all game-related Socket.IO event handlers
 * @param io The Socket.IO server instance
 */
export function setupGameHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}, transport: ${socket.conn.transport.name}`);
    
    // Log socket handshake data
    console.log(`Client handshake query:`, socket.handshake.query);
    console.log(`Client headers:`, socket.handshake.headers['user-agent']);

    // Create a new game room
    socket.on('createRoom', (username: string, callback: (roomId: string) => void) => {
      console.log(`Creating room for user ${username} (${socket.id})`);
      const roomId = roomManager.createRoom(socket.id, username);
      
      // Store mapping
      socketToPlayer.set(socket.id, socket.id);
      playerToRoom.set(socket.id, roomId);
      
      // Join the socket to the room
      socket.join(roomId);
      
      console.log(`Room created: ${roomId} by ${username} (${socket.id})`);
      console.log(`Current socket rooms:`, Array.from(socket.rooms));
      
      // Call the callback with the room ID
      console.log(`Sending roomId ${roomId} back to client ${socket.id}`);
      callback(roomId);
    });

    // Join an existing game room
    socket.on('joinRoom', (roomId: string, username: string, callback: (success: boolean, message?: string) => void) => {
      const room = roomManager.getRoom(roomId);
      
      if (!room) {
        console.log(`Room not found: ${roomId}`);
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
      if (!playerId) {
        console.log(`Player ID not found for socket: ${socket.id}`);
        return;
      }
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) {
        console.log(`Room ID not found for player: ${playerId}`);
        return;
      }
      
      const room = roomManager.getRoom(roomId);
      if (!room) {
        console.log(`Room not found: ${roomId}`);
        return;
      }
      
      // Only host can update game state
      if (room.getHostId() !== playerId) {
        console.log(`Non-host tried to update game state: ${playerId}`);
        return;
      }
      
      // Update the game state
      room.updateGameState(state);
      
      // Broadcast to all players in the room except sender
      socket.to(roomId).emit('gameState', state);
      
      console.log(`Game state updated in room: ${roomId}`);
    });

    // Submit a vote
    socket.on('submitVote', (voterId: string, targetId: string) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitVote', voterId, targetId);
      
      console.log(`Vote submitted in room ${roomId}: ${voterId} voted for ${targetId}`);
    });

    // Submit a description
    socket.on('submitDescription', (playerId: string, description: string) => {
      const senderId = socketToPlayer.get(socket.id);
      if (!senderId) return;
      
      const roomId = playerToRoom.get(senderId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitDescription', playerId, description);
      
      console.log(`Description submitted in room ${roomId} by player ${playerId}`);
    });

    // Submit Mr. White guess
    socket.on('submitMrWhiteGuess', (guess: string) => {
      const playerId = socketToPlayer.get(socket.id);
      if (!playerId) return;
      
      const roomId = playerToRoom.get(playerId);
      if (!roomId) return;
      
      // Forward to host
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      
      const hostId = room.getHostId();
      io.to(hostId).emit('submitMrWhiteGuess', guess);
      
      console.log(`Mr. White guess submitted in room ${roomId}: ${guess}`);
    });

    // Leave room
    socket.on('leaveRoom', () => {
      handlePlayerDisconnect(socket);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      console.log(`Socket was in rooms:`, Array.from(socket.rooms));
      handlePlayerDisconnect(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  /**
   * Handle player disconnection
   * @param socket The socket that disconnected
   */
  function handlePlayerDisconnect(socket: Socket) {
    console.log(`Handling disconnect for socket ${socket.id}`);
    
    const playerId = socketToPlayer.get(socket.id);
    if (!playerId) {
      console.log(`No player ID found for socket ${socket.id}`);
      return;
    }
    
    const roomId = playerToRoom.get(playerId);
    if (!roomId) {
      console.log(`No room ID found for player ${playerId}`);
      return;
    }
    
    const room = roomManager.getRoom(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }
    
    // Remove player from room
    room.removePlayer(playerId);
    
    // Notify other players
    socket.to(roomId).emit('playerLeft', playerId);
    
    console.log(`Player ${playerId} left room ${roomId}`);
    
    // Clean up mappings
    socketToPlayer.delete(socket.id);
    playerToRoom.delete(playerId);
    
    // If room is empty, remove it
    if (room.isEmpty()) {
      console.log(`Room ${roomId} is empty, removing it`);
      roomManager.removeRoom(roomId);
    }
    
    // Leave the socket room
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  }
}