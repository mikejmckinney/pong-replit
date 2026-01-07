import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Users, Loader2, Wifi, WifiOff } from "lucide-react";
import type { GameMode, GameRoom, WSMessage } from "@shared/schema";

interface MultiplayerLobbyProps {
  onBack: () => void;
  onGameStart: (roomId: string, isHost: boolean) => void;
  onNavigate?: () => void;
}

type LobbyState = "menu" | "creating" | "joining" | "waiting" | "ready";

export function MultiplayerLobby({ onBack, onGameStart, onNavigate }: MultiplayerLobbyProps) {
  const [lobbyState, setLobbyState] = useState<LobbyState>("menu");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [connected, setConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };
    
    ws.onclose = () => {
      setConnected(false);
      if (lobbyState !== "menu") {
        setError("Connection lost. Please try again.");
        setLobbyState("menu");
      }
    };
    
    ws.onerror = () => {
      setError("Failed to connect to server.");
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };
    
    wsRef.current = ws;
  };

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case "roomCreated":
        setRoomCode(message.room.code);
        setLobbyState("waiting");
        break;
      case "playerJoined":
        setOpponentJoined(true);
        setLobbyState("ready");
        break;
      case "gameStart":
        onNavigate?.();
        onGameStart(roomCode || inputCode, isHost);
        break;
      case "error":
        setError(message.message);
        break;
      case "playerDisconnected":
        setOpponentJoined(false);
        setError("Opponent disconnected.");
        setLobbyState("waiting");
        break;
    }
  };

  const handleCreateRoom = () => {
    setIsHost(true);
    setLobbyState("creating");
    connectWebSocket();
    
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "createRoom", mode: selectedMode }));
      }
    }, 500);
  };

  const handleJoinRoom = () => {
    if (!inputCode.trim()) {
      setError("Please enter a room code.");
      return;
    }
    
    setIsHost(false);
    setLobbyState("joining");
    connectWebSocket();
    
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "joinRoom", code: inputCode.toUpperCase() }));
      }
    }, 500);
  };

  const handleStartGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && opponentJoined) {
      wsRef.current.send(JSON.stringify({ type: "startGame" }));
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const renderContent = () => {
    switch (lobbyState) {
      case "menu":
        return (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-pixel text-sm tracking-wider">CREATE ROOM</CardTitle>
                <CardDescription className="font-pixel text-[10px]">
                  Host a game and invite a friend
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {(["classic", "arcade", "chaos"] as GameMode[]).map((mode) => (
                    <Button
                      key={mode}
                      size="sm"
                      variant={selectedMode === mode ? "default" : "outline"}
                      className="font-pixel text-[10px] tracking-wider"
                      onClick={() => setSelectedMode(mode)}
                      data-testid={`button-mode-${mode}`}
                    >
                      {mode.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <Button 
                  className="w-full font-pixel text-xs tracking-wider gap-2"
                  onClick={handleCreateRoom}
                  data-testid="button-create-room"
                >
                  <Users className="w-4 h-4" />
                  CREATE ROOM
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="font-pixel text-sm tracking-wider">JOIN ROOM</CardTitle>
                <CardDescription className="font-pixel text-[10px]">
                  Enter a room code to join
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="font-pixel text-xs tracking-wider uppercase text-center"
                  maxLength={6}
                  data-testid="input-room-code"
                />
                <Button 
                  variant="secondary"
                  className="w-full font-pixel text-xs tracking-wider gap-2"
                  onClick={handleJoinRoom}
                  data-testid="button-join-room"
                >
                  JOIN GAME
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      
      case "creating":
      case "joining":
        return (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="font-pixel text-xs text-muted-foreground">
                {lobbyState === "creating" ? "CREATING ROOM..." : "JOINING ROOM..."}
              </p>
            </CardContent>
          </Card>
        );
      
      case "waiting":
      case "ready":
        return (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-pixel text-sm tracking-wider">
                {isHost ? "YOUR ROOM" : "JOINED ROOM"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <p className="font-pixel text-[10px] text-muted-foreground">ROOM CODE</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="font-pixel text-3xl tracking-[0.3em] text-accent px-4 py-2 bg-muted rounded-md"
                    style={{ textShadow: "0 0 15px hsl(var(--accent) / 0.5)" }}
                    data-testid="text-room-code"
                  >
                    {roomCode || inputCode}
                  </div>
                  {isHost && (
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={copyRoomCode}
                      data-testid="button-copy-code"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <p className="font-pixel text-[10px] text-muted-foreground">PLAYERS</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="font-pixel text-[10px]">
                      {isHost ? "YOU (HOST)" : "HOST"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {opponentJoined ? (
                      <Badge variant="secondary" className="font-pixel text-[10px]">
                        {isHost ? "OPPONENT" : "YOU"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-pixel text-[10px] animate-pulse">
                        WAITING...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {isHost && opponentJoined && (
                <Button 
                  size="lg"
                  className="w-full font-pixel text-xs tracking-wider"
                  onClick={handleStartGame}
                  data-testid="button-start-game"
                >
                  START GAME
                </Button>
              )}
              
              {!opponentJoined && (
                <p className="font-pixel text-[10px] text-muted-foreground animate-pulse">
                  WAITING FOR OPPONENT...
                </p>
              )}
            </CardContent>
          </Card>
        );
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
      
      <div className="relative z-10 flex flex-col gap-6 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onBack}
              data-testid="button-multiplayer-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 
              className="font-pixel text-xl md:text-2xl tracking-wider"
              style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
            >
              ONLINE
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="py-3">
              <p className="font-pixel text-[10px] text-destructive text-center">
                {error}
              </p>
            </CardContent>
          </Card>
        )}
        
        {renderContent()}
      </div>
    </div>
  );
}
