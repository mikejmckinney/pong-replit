import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RotateCcw, Home, Trophy } from "lucide-react";
import type { GameMode } from "@shared/schema";

interface GameOverProps {
  winner: "left" | "right" | null;
  leftScore: number;
  rightScore: number;
  gameMode: GameMode;
  isLocalMultiplayer: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
  onViewLeaderboard: () => void;
  onSubmitScore: (playerName: string, score: number, mode: GameMode) => void;
}

export function GameOver({
  winner,
  leftScore,
  rightScore,
  gameMode,
  isLocalMultiplayer,
  onRestart,
  onMainMenu,
  onViewLeaderboard,
  onSubmitScore,
}: GameOverProps) {
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const canSubmitScore = !isLocalMultiplayer && winner === "left" && (gameMode === "classic" || gameMode === "arcade" || gameMode === "timeAttack");
  const score = winner === "left" ? leftScore : rightScore;
  
  const handleSubmit = () => {
    if (playerName.trim() && !submitted) {
      onSubmitScore(playerName.trim(), leftScore, gameMode);
      setSubmitted(true);
    }
  };
  
  const getWinnerText = () => {
    if (!winner) return "DRAW!";
    if (isLocalMultiplayer) {
      return winner === "left" ? "PLAYER 1 WINS!" : "PLAYER 2 WINS!";
    }
    return winner === "left" ? "YOU WIN!" : "GAME OVER";
  };
  
  const getWinnerColor = () => {
    if (!winner) return "hsl(var(--foreground))";
    return winner === "left" ? "hsl(var(--primary))" : "hsl(var(--accent))";
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-background/80">
      <Card className="w-full max-w-sm mx-4" data-testid="game-over-modal">
        <CardHeader className="text-center pb-4">
          <CardTitle 
            className="font-pixel text-xl md:text-2xl tracking-wider"
            style={{ 
              color: getWinnerColor(),
              textShadow: `0 0 20px ${getWinnerColor()}`,
            }}
            data-testid="text-winner"
          >
            {getWinnerText()}
          </CardTitle>
          
          <div className="flex justify-center items-center gap-8 mt-6">
            <div className="text-center">
              <p className="font-pixel text-[10px] text-muted-foreground mb-1">
                {isLocalMultiplayer ? "P1" : "YOU"}
              </p>
              <p 
                className="font-pixel text-3xl text-primary"
                style={{ textShadow: "0 0 15px hsl(var(--primary) / 0.5)" }}
                data-testid="text-final-left-score"
              >
                {leftScore}
              </p>
            </div>
            <div className="font-pixel text-muted-foreground">VS</div>
            <div className="text-center">
              <p className="font-pixel text-[10px] text-muted-foreground mb-1">
                {isLocalMultiplayer ? "P2" : "CPU"}
              </p>
              <p 
                className="font-pixel text-3xl text-accent"
                style={{ textShadow: "0 0 15px hsl(var(--accent) / 0.5)" }}
                data-testid="text-final-right-score"
              >
                {rightScore}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-4">
          {canSubmitScore && !submitted && (
            <div className="flex flex-col gap-2">
              <p className="font-pixel text-[10px] text-muted-foreground text-center">
                ENTER NAME FOR LEADERBOARD
              </p>
              <div className="flex gap-2">
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="YOUR NAME"
                  className="font-pixel text-xs tracking-wider uppercase"
                  maxLength={10}
                  data-testid="input-player-name"
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!playerName.trim()}
                  className="font-pixel text-xs"
                  data-testid="button-submit-score"
                >
                  SAVE
                </Button>
              </div>
            </div>
          )}
          
          {submitted && (
            <p className="font-pixel text-[10px] text-accent text-center">
              SCORE SUBMITTED!
            </p>
          )}
          
          <Button 
            size="lg"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onRestart}
            data-testid="button-play-again"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </Button>
          
          <Button 
            size="lg"
            variant="secondary"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onViewLeaderboard}
            data-testid="button-view-leaderboard"
          >
            <Trophy className="w-4 h-4" />
            LEADERBOARD
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onMainMenu}
            data-testid="button-main-menu"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
