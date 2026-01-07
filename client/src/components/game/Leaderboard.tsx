import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry, GameMode } from "@shared/schema";

interface LeaderboardProps {
  onBack: () => void;
}

function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem("pong_leaderboard");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode | "all">("all");
  
  const { data: serverLeaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });
  
  const localLeaderboard = getLocalLeaderboard();
  const combinedLeaderboard = [...serverLeaderboard, ...localLeaderboard]
    .sort((a, b) => b.score - a.score)
    .filter((entry, index, self) => 
      index === self.findIndex(e => e.id === entry.id)
    );
  
  const filteredLeaderboard = selectedMode === "all" 
    ? combinedLeaderboard 
    : combinedLeaderboard.filter(e => e.mode === selectedMode);
  
  const topEntries = filteredLeaderboard.slice(0, 50);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 2: return <Medal className="w-4 h-4 text-gray-300" />;
      case 3: return <Award className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  const getModeColor = (mode: GameMode) => {
    switch (mode) {
      case "classic": return "bg-blue-500/20 text-blue-400";
      case "arcade": return "bg-primary/20 text-primary";
      case "timeAttack": return "bg-accent/20 text-accent";
      case "chaos": return "bg-red-500/20 text-red-400";
      case "zen": return "bg-green-500/20 text-green-400";
      default: return "";
    }
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
      
      <div className="relative z-10 flex flex-col gap-6 max-w-lg mx-auto w-full flex-1">
        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={onBack}
            data-testid="button-leaderboard-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 
            className="font-pixel text-xl md:text-2xl tracking-wider"
            style={{ textShadow: "0 0 20px hsl(var(--accent) / 0.5)" }}
          >
            LEADERBOARD
          </h1>
        </div>
        
        <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as GameMode | "all")}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all" className="font-pixel text-[8px]" data-testid="tab-all">ALL</TabsTrigger>
            <TabsTrigger value="classic" className="font-pixel text-[8px]" data-testid="tab-classic">CLASSIC</TabsTrigger>
            <TabsTrigger value="arcade" className="font-pixel text-[8px]" data-testid="tab-arcade">ARCADE</TabsTrigger>
            <TabsTrigger value="timeAttack" className="font-pixel text-[8px]" data-testid="tab-time">TIME</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <div className="grid grid-cols-12 gap-2 font-pixel text-[10px] text-muted-foreground tracking-wide">
              <div className="col-span-2">RANK</div>
              <div className="col-span-4">NAME</div>
              <div className="col-span-3 text-right">SCORE</div>
              <div className="col-span-3 text-right">MODE</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] px-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="font-pixel text-xs text-muted-foreground animate-pulse">
                    LOADING...
                  </p>
                </div>
              ) : topEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <Trophy className="w-8 h-8 text-muted-foreground" />
                  <p className="font-pixel text-xs text-muted-foreground">
                    NO SCORES YET
                  </p>
                  <p className="font-pixel text-[10px] text-muted-foreground/50">
                    BE THE FIRST TO PLAY!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 py-2">
                  {topEntries.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`grid grid-cols-12 gap-2 items-center py-2 px-2 rounded-md ${
                        index < 3 ? "bg-muted/30" : ""
                      }`}
                      data-testid={`leaderboard-row-${index}`}
                    >
                      <div className="col-span-2 flex items-center gap-2 font-pixel text-xs">
                        {getRankIcon(index + 1)}
                        <span className={index < 3 ? "text-foreground" : "text-muted-foreground"}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-4 font-pixel text-xs truncate">
                        {entry.playerName}
                      </div>
                      <div 
                        className="col-span-3 text-right font-pixel text-sm"
                        style={{ 
                          color: index === 0 ? "hsl(var(--accent))" : "inherit",
                          textShadow: index === 0 ? "0 0 10px hsl(var(--accent) / 0.5)" : "none",
                        }}
                      >
                        {entry.score}
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <Badge 
                          variant="secondary" 
                          className={`font-pixel text-[8px] ${getModeColor(entry.mode)}`}
                        >
                          {entry.mode.toUpperCase().slice(0, 4)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
