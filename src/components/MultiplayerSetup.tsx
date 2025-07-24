import { useState, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
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
  const { hostGame, joinGame, roomId, connected } = useWebSocket();
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
    
    if (!joinId?.trim()) {
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
    console.log("Start Hosting button clicked");
    
    if (!connected) {
      console.error("Not connected to server");
      toast.error("Not connected to server");
      return;
    }
    
    if (!username.trim()) {
      console.error("Username is empty");
      toast.error("Please enter your username!");
      return;
    }
    
    console.log("Calling hostGame with username:", username.trim());
    hostGame(username.trim());
    console.log("hostGame function called");
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

  // Add logging outside of JSX
  console.log("MultiplayerSetup rendering. Connected:", connected, "RoomId:", roomId);

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
            {/* Rendering host form */}
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
              value={joinId || ""}
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