import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw, Settings, Home } from "lucide-react";

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onRestart, onSettings, onQuit }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-background/80">
      <Card className="w-full max-w-sm mx-4" data-testid="pause-menu">
        <CardHeader className="text-center pb-4">
          <CardTitle 
            className="font-pixel text-xl tracking-wider"
            style={{ textShadow: "0 0 15px hsl(var(--primary) / 0.5)" }}
          >
            PAUSED
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button 
            size="lg"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onResume}
            data-testid="button-resume"
          >
            <Play className="w-4 h-4" />
            RESUME
          </Button>
          
          <Button 
            size="lg"
            variant="secondary"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onRestart}
            data-testid="button-restart"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART
          </Button>
          
          <Button 
            size="lg"
            variant="secondary"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onSettings}
            data-testid="button-pause-settings"
          >
            <Settings className="w-4 h-4" />
            SETTINGS
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            className="w-full font-pixel text-xs tracking-wider gap-3"
            onClick={onQuit}
            data-testid="button-quit"
          >
            <Home className="w-4 h-4" />
            QUIT TO MENU
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
