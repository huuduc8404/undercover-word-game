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
  submitVote: (voterId: string, targetId: string) => void;
  submitDescription: (playerId: string, description: string) => void;
  submitMrWhiteGuess: (guess: string) => void;
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