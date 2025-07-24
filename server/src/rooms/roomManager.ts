import { GameRoom } from './gameRoom';
import { generateRoomId } from '../utils/helpers';

/**
 * RoomManager class manages all game rooms
 */
export class RoomManager {
  private rooms: Map<string, GameRoom>;

  constructor() {
    this.rooms = new Map();
  }

  /**
   * Create a new game room
   * @param hostId The socket ID of the host player
   * @param hostName The username of the host player
   * @returns The room ID of the newly created room
   */
  createRoom(hostId: string, hostName: string): string {
    // Generate a unique room ID (6 characters)
    let roomId = generateRoomId();
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    // Create a new game room
    const room = new GameRoom(roomId, hostId, hostName);
    this.rooms.set(roomId, room);

    console.log(`Room created: ${roomId} by ${hostName} (${hostId})`);
    return roomId;
  }

  /**
   * Get a room by ID
   * @param roomId The room ID
   * @returns The game room, or undefined if not found
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Remove a room by ID
   * @param roomId The room ID
   * @returns True if the room was removed, false if it didn't exist
   */
  removeRoom(roomId: string): boolean {
    console.log(`Room removed: ${roomId}`);
    return this.rooms.delete(roomId);
  }

  /**
   * Clean up empty rooms
   */
  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isEmpty()) {
        console.log(`Cleaning up empty room: ${roomId}`);
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Get all rooms
   * @returns Map of all rooms
   */
  getAllRooms(): Map<string, GameRoom> {
    return this.rooms;
  }

  /**
   * Get the number of active rooms
   * @returns The number of rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}

// Create a singleton instance
export const roomManager = new RoomManager();