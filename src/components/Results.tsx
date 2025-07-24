import { useGame } from "../context/GameContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWebSocket } from "@/context/WebSocketContext";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useSound } from "@/context/SoundContext";
import { MrWhiteGuess } from "./shared/MrWhiteGuess";
import { PlayerList } from "./shared/PlayerList";

export const Results = () => {
  const { gameState, setGameState, submitMrWhiteGuess, eliminatePlayer, checkGameEnd } = useGame();
  const { socket, isHost, sendToHost } = useWebSocket();
  const { playSound } = useSound();
  
  console.log("Results rendering. IsHost:", isHost);
  const [guess, setGuess] = useState("");
  const [tieBreakerPlayers, setTieBreakerPlayers] = useState<string[]>([]);
  const [showEliminatedCard, setShowEliminatedCard] = useState(false);

  const currentPlayer = gameState.players.find(p => p.id === socket?.id);
  const eliminatedPlayer = gameState.players
    .find(p => p.id === gameState.lastEliminatedId);

  const playEliminationSound = () => {
    if (gameState.mrWhiteGuess) {
      return playSound("/sounds/mrwhite-wrong-guess.mp3");
    }

    switch (eliminatedPlayer?.role) {
      case "mrwhite":
        playSound("/sounds/mrwhite-eliminated.mp3");
        break;
      case "undercover":
        playSound("/sounds/undercover-eliminated.mp3");
        break;
      case "civilian":
        playSound("/sounds/civilian-eliminated.mp3");
        break;
    }
  };

  useEffect(() => {
    if (gameState.lastEliminatedId && gameState.votingResults) {
      // Count votes for each player to determine if there was a tie
      const voteCount: Record<string, number> = {};
      Object.values(gameState.votingResults).forEach(targetId => {
        voteCount[targetId] = (voteCount[targetId] || 0) + 1;
      });

      const maxVotes = Math.max(...Object.values(voteCount));
      const mostVotedPlayers = Object.entries(voteCount)
        .filter(([_, votes]) => votes === maxVotes)
        .map(([id]) => id);

      setTieBreakerPlayers(mostVotedPlayers);

      if (mostVotedPlayers.length > 1) {
        setTimeout(() => {
          setShowEliminatedCard(true);
          playEliminationSound();
        }, 7000);
      } else {
        setShowEliminatedCard(true);
        playEliminationSound();
      }
    }
  }, [gameState.lastEliminatedId, gameState.votingResults]);

  const currentPlayerGotEliminated = eliminatedPlayer?.id === currentPlayer?.id;
  const isMrWhiteGuessing = eliminatedPlayer?.role === "mrwhite" && !gameState.mrWhiteGuess;
  const canContinue = isHost && !isMrWhiteGuessing;

  // Sort players by speaking order (and filter out eliminated players)
  const activePlayers = gameState.speakingOrder
    .map(id => gameState.players.find(p => p.id === id));

  const handleGuessSubmit = () => {
    if (!guess.trim()) {
      toast.error("Please enter a guess");
      return;
    }

    if (isHost) {
      submitMrWhiteGuess(guess.trim());
    } else {
      // Send guess to host using the correct signature
      sendToHost("submitMrWhiteGuess", guess.trim());
    }
  };

  const handleContinue = () => {
    eliminatePlayer(eliminatedPlayer?.id);
    setGameState((prev) => {
      const gameWinner = checkGameEnd(prev.players);

      return {
        ...prev,
        phase: gameWinner ? "gameEnd" : "discussion",
        winner: gameWinner || undefined,
        votingResults: {},
      };
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-4 text-white">Results</h2>

      {showEliminatedCard && eliminatedPlayer && (
        <Card className="p-6 text-center glass-morphism">
          <h3 className="text-xl font-bold mb-4 text-white">
            {currentPlayerGotEliminated ? "You have been eliminated" : `${eliminatedPlayer.name} was eliminated!`}
          </h3>
          <p className="text-lg mb-2 text-white">
            {currentPlayerGotEliminated ? "You" : "They"} were a{" "}
            <span className="font-bold text-primary">
              {eliminatedPlayer.role === "mrwhite"
                ? "Mr. White"
                : eliminatedPlayer.role}
            </span>
          </p>
          {eliminatedPlayer.role !== "mrwhite" && currentPlayer?.isEliminated && !currentPlayerGotEliminated && (
            <p className="text-white/80">
              Their word was: {eliminatedPlayer.word}
            </p>
          )}

          {isMrWhiteGuessing && currentPlayerGotEliminated && (
            <div className="mt-4 space-y-4">
              <p className="text-white/80">Make your final guess!</p>
              <div className="flex gap-2">
                <Input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess..."
                  className="flex-1"
                />
                <Button
                  onClick={handleGuessSubmit}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <MrWhiteGuess />
        </Card>
      )}

      <PlayerList
        players={activePlayers}
        votingResults={gameState.votingResults}
        currentPlayerId={socket?.id}
        tieBreakerPlayers={
          gameState.mrWhiteGuess == null // prevent playing tiebreaker animation again after mrWhite guess
          ? tieBreakerPlayers : []
        }
        lastEliminatedId={gameState.lastEliminatedId}
      />

      <Button
        onClick={handleContinue}
        className="w-full"
        disabled={!canContinue}
        variant={canContinue ? "default" : "secondary"}
      >
        Continue Game
      </Button>
    </div>
  );
};