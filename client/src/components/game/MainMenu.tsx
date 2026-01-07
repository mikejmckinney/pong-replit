import { Button } from "@/components/ui/button";
import { Play, Users, Trophy, Settings, Gamepad2 } from "lucide-react";

interface MainMenuProps {
  onSinglePlayer: () => void;
  onLocalMultiplayer: () => void;
  onOnlineMultiplayer: () => void;
  onLeaderboard: () => void;
  onSettings: () => void;
  onNavigate?: () => void;
}

export function MainMenu({
  onSinglePlayer,
  onLocalMultiplayer,
  onOnlineMultiplayer,
  onLeaderboard,
  onSettings,
  onNavigate,
}: MainMenuProps) {
  const handleClick = (action: () => void) => {
    onNavigate?.();
    action();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center gap-12 max-w-md w-full">
        <div className="text-center">
          <h1 
            className="font-pixel text-3xl md:text-5xl lg:text-6xl tracking-wider"
            style={{
              background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 40px hsl(var(--primary) / 0.5)",
              filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.3))",
            }}
            data-testid="text-game-title"
          >
            NEON
          </h1>
          <h1 
            className="font-pixel text-4xl md:text-6xl lg:text-7xl tracking-wider mt-2"
            style={{
              background: "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--primary)) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 40px hsl(var(--accent) / 0.5)",
              filter: "drop-shadow(0 0 30px hsl(var(--accent) / 0.3))",
            }}
          >
            PONG
          </h1>
          <p className="font-pixel text-xs text-muted-foreground mt-4 tracking-wide">
            RETRO ARCADE EXPERIENCE
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <Button 
            size="lg"
            className="w-full font-pixel text-sm tracking-wider py-6 gap-3"
            onClick={() => handleClick(onSinglePlayer)}
            data-testid="button-single-player"
          >
            <Play className="w-5 h-5" />
            SINGLE PLAYER
          </Button>
          
          <Button 
            size="lg"
            variant="secondary"
            className="w-full font-pixel text-sm tracking-wider py-6 gap-3"
            onClick={() => handleClick(onLocalMultiplayer)}
            data-testid="button-local-multiplayer"
          >
            <Users className="w-5 h-5" />
            LOCAL MULTIPLAYER
          </Button>
          
          <Button 
            size="lg"
            variant="secondary"
            className="w-full font-pixel text-sm tracking-wider py-6 gap-3"
            onClick={() => handleClick(onOnlineMultiplayer)}
            data-testid="button-online-multiplayer"
          >
            <Gamepad2 className="w-5 h-5" />
            ONLINE MULTIPLAYER
          </Button>
          
          <div className="flex gap-4 mt-4">
            <Button 
              size="lg"
              variant="outline"
              className="flex-1 font-pixel text-xs tracking-wider py-6 gap-2"
              onClick={() => handleClick(onLeaderboard)}
              data-testid="button-leaderboard"
            >
              <Trophy className="w-4 h-4" />
              SCORES
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="flex-1 font-pixel text-xs tracking-wider py-6 gap-2"
              onClick={() => handleClick(onSettings)}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
              SETTINGS
            </Button>
          </div>
        </div>
        
        <p className="font-pixel text-[10px] text-muted-foreground/50 tracking-wide text-center">
          TOUCH OR KEYBOARD TO PLAY
        </p>
      </div>
    </div>
  );
}
