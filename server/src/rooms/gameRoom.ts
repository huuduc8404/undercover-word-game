import { GameState, Player } from '../types/game';

/**
 * GameRoom class manages a single game room, including players and game state
 */
export class GameRoom {
  private roomId: string;
  private hostId: string;
  private players: Map<string, Player>;
  private gameState: GameState;

  /**
   * Create a new game room
   * @param roomId The unique ID for this room
   * @param hostId The socket ID of the host player
   * @param hostName The username of the host player
   */
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

  /**
   * Get the room ID
   */
  getRoomId(): string {
    return this.roomId;
  }

  /**
   * Get the host ID
   */
  getHostId(): string {
    return this.hostId;
  }

  /**
   * Get the current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Update the game state
   * @param newState The new game state
   */
  updateGameState(newState: GameState): void {
    this.gameState = newState;
    
    // Update players map to match game state
    this.gameState.players.forEach(player => {
      this.players.set(player.id, player);
    });
  }

  /**
   * Add a new player to the room
   * @param playerId The socket ID of the player
   * @param playerName The username of the player
   * @returns The newly created player object
   */
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

  /**
   * Remove a player from the room
   * @param playerId The socket ID of the player to remove
   */
  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    
    // Update game state
    this.gameState.players = this.gameState.players.filter(p => p.id !== playerId);
  }

  /**
   * Get a player by ID
   * @param playerId The socket ID of the player
   * @returns The player object, or undefined if not found
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get all players in the room
   * @returns Array of all players
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Check if the room is empty
   * @returns True if there are no players in the room
   */
  isEmpty(): boolean {
    return this.players.size === 0;
  }
}