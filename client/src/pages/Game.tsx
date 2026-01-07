import { useState, useEffect, useCallback, useRef } from "react";
import { useAudio } from "@/hooks/useAudio";
import { useGameEngine } from "@/hooks/useGameEngine";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHUD } from "@/components/game/GameHUD";
import { MainMenu } from "@/components/game/MainMenu";
import { ModeSelect } from "@/components/game/ModeSelect";
import { PauseMenu } from "@/components/game/PauseMenu";
import { GameOver } from "@/components/game/GameOver";
import { SettingsPanel } from "@/components/game/SettingsPanel";
import { Leaderboard } from "@/components/game/Leaderboard";
import { MultiplayerLobby } from "@/components/game/MultiplayerLobby";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GameMode, GameSettings, InsertLeaderboardEntry } from "@shared/schema";

type Screen = "menu" | "modeSelect" | "game" | "settings" | "leaderboard" | "multiplayer";

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: false,
  volume: 0.7,
  controlScheme: "drag",
  difficulty: "medium",
  showEffects: true,
};

function loadSettings(): GameSettings {
  try {
    const saved = localStorage.getItem("pong_settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: GameSettings) {
  localStorage.setItem("pong_settings", JSON.stringify(settings));
}

function saveLocalScore(playerName: string, score: number, mode: GameMode) {
  try {
    const existing = localStorage.getItem("pong_leaderboard");
    const entries = existing ? JSON.parse(existing) : [];
    entries.push({
      id: `local_${Date.now()}`,
      playerName,
      score,
      mode,
      date: new Date().toISOString(),
    });
    entries.sort((a: any, b: any) => b.score - a.score);
    localStorage.setItem("pong_leaderboard", JSON.stringify(entries.slice(0, 100)));
  } catch (e) {
    console.error("Failed to save local score:", e);
  }
}

export default function Game() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [prevScreen, setPrevScreen] = useState<Screen>("menu");
  const [selectedMode, setSelectedMode] = useState<GameMode>("classic");
  const [isLocalMultiplayer, setIsLocalMultiplayer] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [gameStarted, setGameStarted] = useState(false);
  
  const audio = useAudio(settings);
  
  const audioCallbacks = {
    onPaddleHit: audio.playPaddleHit,
    onWallHit: audio.playWallHit,
    onScore: audio.playScore,
    onPowerUp: audio.playPowerUp,
    onGameOver: audio.playGameOver,
  };
  
  const {
    gameState,
    startGame,
    stopGame,
    resetGame,
    togglePause,
    setLeftPaddleDirection,
    setRightPaddleDirection,
    setLeftPaddlePosition,
    setRightPaddlePosition,
    canvasWidth,
    canvasHeight,
  } = useGameEngine(selectedMode, isLocalMultiplayer, audioCallbacks);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "game") return;
      
      switch (e.key.toLowerCase()) {
        case "w":
          setLeftPaddleDirection("up");
          break;
        case "s":
          setLeftPaddleDirection("down");
          break;
        case "arrowup":
          if (isLocalMultiplayer) {
            e.preventDefault();
            setRightPaddleDirection("up");
          }
          break;
        case "arrowdown":
          if (isLocalMultiplayer) {
            e.preventDefault();
            setRightPaddleDirection("down");
          }
          break;
        case " ":
        case "escape":
          e.preventDefault();
          if (!gameState.isGameOver) {
            togglePause();
          }
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (screen !== "game") return;
      
      switch (e.key.toLowerCase()) {
        case "w":
        case "s":
          setLeftPaddleDirection("none");
          break;
        case "arrowup":
        case "arrowdown":
          if (isLocalMultiplayer) {
            setRightPaddleDirection("none");
          }
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [screen, isLocalMultiplayer, gameState.isGameOver, setLeftPaddleDirection, setRightPaddleDirection, togglePause]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const handleModeSelect = useCallback((mode: GameMode) => {
    audio.initAudio();
    setSelectedMode(mode);
    setIsLocalMultiplayer(false);
    setScreen("game");
    setGameStarted(true);
  }, [audio]);

  const handleLocalMultiplayer = useCallback(() => {
    audio.initAudio();
    setIsLocalMultiplayer(true);
    setScreen("modeSelect");
  }, [audio]);

  const handleLocalMultiplayerModeSelect = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    setScreen("game");
    setGameStarted(true);
  }, []);

  const handleSubmitScore = useCallback(async (playerName: string, score: number, mode: GameMode) => {
    const entry: InsertLeaderboardEntry = { playerName, score, mode };
    
    try {
      await apiRequest("POST", "/api/leaderboard", entry);
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    } catch (e) {
      console.error("Failed to submit to server, saving locally:", e);
    }
    
    saveLocalScore(playerName, score, mode);
  }, []);

  const gameControlsRef = useRef({ resetGame, startGame, stopGame });
  gameControlsRef.current = { resetGame, startGame, stopGame };

  useEffect(() => {
    if (screen === "game" && gameStarted) {
      gameControlsRef.current.resetGame();
      gameControlsRef.current.startGame();
    } else {
      gameControlsRef.current.stopGame();
    }
  }, [screen, gameStarted, selectedMode]);

  const navigateToScreen = (newScreen: Screen) => {
    setPrevScreen(screen);
    setScreen(newScreen);
    audio.playMenuNavigate();
  };

  const handleBack = () => {
    audio.playMenuSelect();
    if (screen === "modeSelect" && isLocalMultiplayer) {
      setIsLocalMultiplayer(false);
    }
    setScreen(prevScreen === screen ? "menu" : prevScreen);
  };

  const renderScreen = () => {
    switch (screen) {
      case "menu":
        return (
          <MainMenu
            onSinglePlayer={() => navigateToScreen("modeSelect")}
            onLocalMultiplayer={handleLocalMultiplayer}
            onOnlineMultiplayer={() => navigateToScreen("multiplayer")}
            onLeaderboard={() => navigateToScreen("leaderboard")}
            onSettings={() => navigateToScreen("settings")}
            onNavigate={audio.playMenuSelect}
          />
        );
      
      case "modeSelect":
        return (
          <ModeSelect
            onSelectMode={isLocalMultiplayer ? handleLocalMultiplayerModeSelect : handleModeSelect}
            onBack={handleBack}
            onNavigate={audio.playMenuSelect}
          />
        );
      
      case "settings":
        return (
          <SettingsPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onBack={handleBack}
          />
        );
      
      case "leaderboard":
        return <Leaderboard onBack={handleBack} />;
      
      case "multiplayer":
        return (
          <MultiplayerLobby
            onBack={handleBack}
            onGameStart={(roomId, isHost) => {
              setScreen("game");
              setGameStarted(true);
            }}
            onNavigate={audio.playMenuSelect}
          />
        );
      
      case "game":
        return (
          <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
            <div className="flex-1 relative">
              <GameCanvas
                gameState={gameState}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                controlScheme={settings.controlScheme}
                isLocalMultiplayer={isLocalMultiplayer}
                onLeftPaddleMove={setLeftPaddlePosition}
                onRightPaddleMove={setRightPaddlePosition}
                onLeftPaddleDirection={setLeftPaddleDirection}
                onRightPaddleDirection={setRightPaddleDirection}
              />
              
              <GameHUD
                gameState={gameState}
                onPause={togglePause}
                soundEnabled={settings.soundEnabled}
                onToggleSound={() => handleSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
              />
              
              {gameState.isPaused && !gameState.isGameOver && (
                <PauseMenu
                  onResume={togglePause}
                  onRestart={() => {
                    resetGame();
                    startGame();
                  }}
                  onSettings={() => {
                    setPrevScreen("game");
                    setScreen("settings");
                  }}
                  onQuit={() => {
                    stopGame();
                    setGameStarted(false);
                    setScreen("menu");
                  }}
                />
              )}
              
              {gameState.isGameOver && (
                <GameOver
                  winner={gameState.winner}
                  leftScore={gameState.leftScore}
                  rightScore={gameState.rightScore}
                  gameMode={gameState.gameMode}
                  isLocalMultiplayer={isLocalMultiplayer}
                  onRestart={() => {
                    resetGame();
                    startGame();
                  }}
                  onMainMenu={() => {
                    stopGame();
                    setGameStarted(false);
                    setScreen("menu");
                  }}
                  onViewLeaderboard={() => {
                    setPrevScreen("game");
                    setScreen("leaderboard");
                  }}
                  onSubmitScore={handleSubmitScore}
                />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {renderScreen()}
    </div>
  );
}
