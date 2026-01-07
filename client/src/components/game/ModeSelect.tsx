import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, Clock, Skull, Heart, Gamepad2 } from "lucide-react";
import type { GameMode } from "@shared/schema";

interface ModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
  onNavigate?: () => void;
}

const MODES: { mode: GameMode; title: string; description: string; icon: typeof Zap }[] = [
  {
    mode: "classic",
    title: "CLASSIC",
    description: "First to 11 wins. No power-ups, pure skill.",
    icon: Gamepad2,
  },
  {
    mode: "arcade",
    title: "ARCADE",
    description: "Power-ups enabled! Collect bonuses to gain advantage.",
    icon: Zap,
  },
  {
    mode: "timeAttack",
    title: "TIME ATTACK",
    description: "60 seconds. Score as many points as possible.",
    icon: Clock,
  },
  {
    mode: "chaos",
    title: "CHAOS",
    description: "Multi-ball madness! Speed increases over time.",
    icon: Skull,
  },
  {
    mode: "zen",
    title: "ZEN",
    description: "Relaxed practice mode. No score limit, slower AI.",
    icon: Heart,
  },
];

export function ModeSelect({ onSelectMode, onBack, onNavigate }: ModeSelectProps) {
  const handleSelect = (mode: GameMode) => {
    onNavigate?.();
    onSelectMode(mode);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/20" />
      
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col gap-8 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 
            className="font-pixel text-xl md:text-2xl tracking-wider"
            style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
          >
            SELECT MODE
          </h1>
        </div>
        
        <div className="flex flex-col gap-4">
          {MODES.map(({ mode, title, description, icon: Icon }) => (
            <Card 
              key={mode}
              className="hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => handleSelect(mode)}
              data-testid={`card-mode-${mode}`}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div 
                  className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center"
                  style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" }}
                >
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-pixel text-sm tracking-wider">
                    {title}
                  </CardTitle>
                  <CardDescription className="font-pixel text-[10px] tracking-wide mt-1">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
