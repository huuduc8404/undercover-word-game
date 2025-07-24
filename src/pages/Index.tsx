import { GameProvider } from "../context/GameContext";
import { WebSocketProvider } from "../context/WebSocketContext";
import { useGame } from "../context/GameContext";
import { useWebSocket } from "../context/WebSocketContext";
import { GameSetup } from "../components/GameSetup";
import { GameLobby } from "../components/GameLobby";
import { WordReveal } from "../components/WordReveal";
import { MultiplayerSetup } from "../components/MultiplayerSetup";
import { VotingScreen } from "../components/VotingScreen";
import { Results } from "../components/Results";
import { GameEnd } from "../components/GameEnd";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { SoundProvider } from "@/context/SoundContext";

const GameContent = () => {
  const { gameState } = useGame();
  const { roomId } = useWebSocket();

  console.log("GameContent rendering. RoomId:", roomId, "GameState phase:", gameState.phase, "Round:", gameState.currentRound);

  if (!roomId) {
    console.log("No roomId, rendering MultiplayerSetup");
    return <MultiplayerSetup />;
  }

  if (gameState.phase === "setup" && gameState.currentRound === 0) {
    console.log("Rendering GameSetup");
    return <GameSetup />;
  }

  if (gameState.phase === "setup" && gameState.currentRound >= 1) {
    console.log("Rendering GameLobby");
    return <GameLobby />;
  }

  console.log("Rendering based on game phase:", gameState.phase);
  switch (gameState.phase) {
    case "wordReveal":
      return <WordReveal />;
    case "voting":
      return <VotingScreen />;
    case "results":
      return <Results />;
    case "gameEnd":
      return <GameEnd />;
    default:
      return <GameLobby />;
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-secondary to-accent text-white">
      <div className="container mx-auto px-4 py-3">
        <SoundProvider>
          <GameProvider>
            <WebSocketProvider>
              <div className="max-w-4xl mx-auto">
                <GameContent />
              </div>
            </WebSocketProvider>
          </GameProvider>
        </SoundProvider>
      </div>
      <div className="hidden md:block">
        <a
          href="https://github.com/antebrl/undercover-word-game"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 left-4 md:bottom-8 md:left-8"
        >
          <Button
            variant="secondary"
            className="glass-morphism hover:bg-white/10 transition-all duration-300"
          >
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Index;