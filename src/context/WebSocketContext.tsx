import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGame } from "./GameContext";
import { GameState, Player } from "../types/game";
import { toast } from "sonner";
import { useSound } from "./SoundContext";

// Use relative URL for WebSocket connection (same domain)
const WEBSOCKET_URL = window.location.origin;

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
    console.log("Initializing WebSocket connection to:", WEBSOCKET_URL);
    const newSocket = io(WEBSOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server with ID:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server. Reason:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    newSocket.on("error", (message: string) => {
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

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up host-specific event handlers
  useEffect(() => {
    if (!socket || !isHost) return;

    // Vote submission
    const handleVote = (voterId: string, targetId: string) => {
      console.debug("Received vote:", { voterId, targetId });
      submitVote(voterId, targetId);
    };

    // Description submission
    const handleDescription = (playerId: string, description: string) => {
      console.debug("Received description:", { playerId, description });
      submitDescription(playerId, description);
    };

    // Mr. White guess
    const handleMrWhiteGuess = (guess: string) => {
      console.debug("Received Mr. White guess:", guess);
      submitMrWhiteGuess(guess);
    };

    socket.on("submitVote", handleVote);
    socket.on("submitDescription", handleDescription);
    socket.on("submitMrWhiteGuess", handleMrWhiteGuess);

    return () => {
      socket.off("submitVote", handleVote);
      socket.off("submitDescription", handleDescription);
      socket.off("submitMrWhiteGuess", handleMrWhiteGuess);
    };
  }, [socket, isHost, submitVote, submitDescription, submitMrWhiteGuess]);

  // Host a new game
  const hostGame = (username: string) => {
    if (!socket || !connected) {
      toast.error("Not connected to server");
      return;
    }

    console.log("Emitting createRoom event with username:", username);
    socket.emit("createRoom", username, (newRoomId: string) => {
      console.log("Received roomId from server:", newRoomId);
      setRoomId(newRoomId);
      setIsHost(true);
      addPlayer(username, socket.id);
      console.log("Game state after hosting:", gameState);
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
      console.log("Host sending updated game state:", gameState);
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