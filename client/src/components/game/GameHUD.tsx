import { Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GameState, ActivePowerUp } from "@shared/schema";

interface GameHUDProps {
  gameState: GameState;
  onPause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const POWER_UP_NAMES: Record<string, string> = {
  paddleGrow: "GROW",
  paddleShrink: "SHRINK",
  multiBall: "MULTI",
  slowMo: "SLOW",
  speedBoost: "FAST",
  shield: "SHIELD",
  curveShot: "CURVE",
};

export function GameHUD({ gameState, onPause, soundEnabled, onToggleSound }: GameHUDProps) {
  const { leftScore, rightScore, gameMode, timeRemaining, activePowerUps } = gameState;
  
  const leftPowerUps = activePowerUps.filter(p => p.playerId === 0);
  const rightPowerUps = activePowerUps.filter(p => p.playerId === 1);
  
  const getModeLabel = () => {
    switch (gameMode) {
      case "classic": return "CLASSIC";
      case "arcade": return "ARCADE";
      case "timeAttack": return "TIME ATTACK";
      case "chaos": return "CHAOS";
      case "zen": return "ZEN";
      default: return "";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="game-hud">
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-4 pointer-events-auto">
        <Button 
          size="icon" 
          variant="ghost"
          onClick={onToggleSound}
          className="text-foreground/80"
          data-testid="button-sound-toggle"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>
        
        <div className="flex flex-col items-center gap-2">
          <Badge variant="secondary" className="text-xs tracking-wider">
            {getModeLabel()}
          </Badge>
          {timeRemaining !== null && (
            <div 
              className="font-pixel text-xl text-accent"
              style={{ textShadow: "0 0 10px hsl(var(--accent))" }}
              data-testid="text-timer"
            >
              {Math.ceil(timeRemaining)}
            </div>
          )}
        </div>
        
        <Button 
          size="icon" 
          variant="ghost"
          onClick={onPause}
          className="text-foreground/80"
          data-testid="button-pause"
        >
          <Pause className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-8 md:px-16">
        <div 
          className="font-pixel text-4xl md:text-6xl text-primary"
          style={{ textShadow: "0 0 20px hsl(var(--primary))" }}
          data-testid="text-left-score"
        >
          {leftScore}
        </div>
        <div 
          className="font-pixel text-4xl md:text-6xl text-accent"
          style={{ textShadow: "0 0 20px hsl(var(--accent))" }}
          data-testid="text-right-score"
        >
          {rightScore}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 flex gap-2">
        {leftPowerUps.map((powerUp, i) => (
          <PowerUpIndicator key={i} powerUp={powerUp} side="left" />
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4 flex gap-2">
        {rightPowerUps.map((powerUp, i) => (
          <PowerUpIndicator key={i} powerUp={powerUp} side="right" />
        ))}
      </div>
    </div>
  );
}

function PowerUpIndicator({ powerUp, side }: { powerUp: ActivePowerUp; side: "left" | "right" }) {
  const now = Date.now();
  const remaining = Math.max(0, powerUp.expiresAt - now);
  const progress = remaining / powerUp.duration;
  
  return (
    <div 
      className={`flex flex-col items-center gap-1 ${side === "left" ? "text-primary" : "text-accent"}`}
      data-testid={`powerup-indicator-${side}-${powerUp.type}`}
    >
      <div 
        className="w-12 h-12 rounded-md border-2 flex items-center justify-center font-pixel text-xs"
        style={{
          borderColor: side === "left" ? "hsl(var(--primary))" : "hsl(var(--accent))",
          boxShadow: `0 0 10px ${side === "left" ? "hsl(var(--primary) / 0.5)" : "hsl(var(--accent) / 0.5)"}`,
          animation: "pulse 1s ease-in-out infinite",
        }}
      >
        {POWER_UP_NAMES[powerUp.type]?.slice(0, 3) || "?"}
      </div>
      <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${side === "left" ? "bg-primary" : "bg-accent"}`}
          style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }}
        />
      </div>
    </div>
  );
}
