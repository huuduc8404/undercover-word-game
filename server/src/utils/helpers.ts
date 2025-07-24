/**
 * Generates a random room ID (6 characters)
 * Uses characters that are less likely to be confused with each other
 */
export function generateRoomId(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters (0/O, 1/I)
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Maps socket IDs to player IDs
 * This allows us to track which socket belongs to which player
 */
export const socketToPlayer = new Map<string, string>();

/**
 * Maps player IDs to room IDs
 * This allows us to quickly find which room a player is in
 */
export const playerToRoom = new Map<string, string>();