import { useGame } from "../context/GameContext";
import { useWebSocket } from "../context/WebSocketContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PlayerList } from "./shared/PlayerList";
import { useSound } from "@/context/SoundContext";

export const VotingScreen = () => {
  const { gameState, submitVote } = useGame();
  const { socket, isHost, sendToHost } = useWebSocket();
  const { playSound } = useSound();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  
  console.log("VotingScreen rendering. IsHost:", isHost);

  useEffect(() => {
    playSound("/sounds/new-page.mp3");
  }, []);

  const currentPlayer = gameState.players.find(p => p.id === socket?.id);
  const hasVoted = currentPlayer && gameState.votingResults?.[currentPlayer.id];
  const isEliminated = currentPlayer?.isEliminated;

  // Sort players by speaking order (and filter out eliminated players)
  const activePlayers = gameState.speakingOrder
    .map(id => gameState.players.find(p => p.id === id));

  // Don't show voting UI if player is eliminated
  if (isEliminated) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-4 text-gradient">Voting in Progress</h2>
        <PlayerList
          players={activePlayers}
          votingResults={gameState.votingResults}
          currentPlayerId={socket?.id}
        />
      </div>
    );
  }

  const handleVote = () => {
    playSound("/sounds/submit-vote.wav");
    if (currentPlayer && selectedPlayer) {
      //playSound("/sounds/vote.mp3");
      if (isHost) {
        submitVote(currentPlayer.id, selectedPlayer);
      } else {
        // Use the correct signature for WebSocketContext.sendToHost
        sendToHost("submitVote", currentPlayer.id, selectedPlayer);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-4 text-gradient">Vote to Eliminate</h2>

      <PlayerList
        players={activePlayers}
        selectedPlayer={selectedPlayer}
        onPlayerClick={!hasVoted ? setSelectedPlayer : undefined}
        votingResults={gameState.votingResults}
        currentPlayerId={socket?.id}
      />

      {!hasVoted && (
        <Button
          onClick={handleVote}
          disabled={!selectedPlayer}
          className="w-full mt-4 bg-primary hover:bg-primary/90"
        >
          Submit Vote
        </Button>
      )}
    </div>
  );
};