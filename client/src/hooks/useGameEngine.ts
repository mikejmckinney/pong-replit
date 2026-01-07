import { useState, useCallback, useRef, useEffect } from "react";
import type { GameState, GameMode, Ball, Paddle, PowerUp, ActivePowerUp, PowerUpType } from "@shared/schema";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;
const WIN_SCORE = 11;

const POWER_UP_TYPES: PowerUpType[] = [
  "paddleGrow", "paddleShrink", "multiBall", "slowMo", "speedBoost", "shield", "curveShot"
];

const POWER_UP_RARITY: Record<PowerUpType, "common" | "rare" | "legendary"> = {
  paddleGrow: "common",
  paddleShrink: "common",
  speedBoost: "common",
  slowMo: "rare",
  multiBall: "rare",
  curveShot: "rare",
  shield: "legendary",
};

function createBall(x?: number, y?: number, vx?: number, vy?: number): Ball {
  const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: x ?? CANVAS_WIDTH / 2,
    y: y ?? CANVAS_HEIGHT / 2,
    vx: vx ?? Math.cos(angle) * INITIAL_BALL_SPEED * direction,
    vy: vy ?? Math.sin(angle) * INITIAL_BALL_SPEED,
    radius: BALL_RADIUS,
    trail: [],
  };
}

function createPaddle(isLeft: boolean): Paddle {
  return {
    x: isLeft ? 20 : CANVAS_WIDTH - 20 - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    baseHeight: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
  };
}

function createInitialState(mode: GameMode): GameState {
  return {
    ball: createBall(),
    balls: [createBall()],
    leftPaddle: createPaddle(true),
    rightPaddle: createPaddle(false),
    leftScore: 0,
    rightScore: 0,
    gameMode: mode,
    isPaused: false,
    isGameOver: false,
    winner: null,
    powerUps: [],
    activePowerUps: [],
    timeRemaining: mode === "timeAttack" ? 60 : null,
    difficultyMultiplier: 1,
  };
}

interface AudioCallbacks {
  onPaddleHit: () => void;
  onWallHit: () => void;
  onScore: () => void;
  onPowerUp: () => void;
  onGameOver: () => void;
}

export function useGameEngine(mode: GameMode, isLocalMultiplayer: boolean, audioCallbacks: AudioCallbacks) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(mode));
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const powerUpSpawnTimerRef = useRef<number>(0);
  const currentModeRef = useRef<GameMode>(mode);
  const inputRef = useRef<{ left: "up" | "down" | "none"; right: "up" | "down" | "none" }>({
    left: "none",
    right: "none",
  });

  useEffect(() => {
    currentModeRef.current = mode;
  }, [mode]);

  const resetGame = useCallback(() => {
    setGameState(createInitialState(currentModeRef.current));
    powerUpSpawnTimerRef.current = 0;
  }, []);

  const spawnPowerUp = useCallback((state: GameState): PowerUp | null => {
    if (state.gameMode === "classic" || state.gameMode === "zen") return null;
    if (state.powerUps.length >= 2) return null;
    
    const type = POWER_UP_TYPES[Math.floor(Math.random() * POWER_UP_TYPES.length)];
    const rarity = POWER_UP_RARITY[type];
    
    const rarityChance = rarity === "legendary" ? 0.1 : rarity === "rare" ? 0.3 : 1;
    if (Math.random() > rarityChance) return null;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: CANVAS_WIDTH / 4 + Math.random() * CANVAS_WIDTH / 2,
      y: 50 + Math.random() * (CANVAS_HEIGHT - 100),
      duration: type === "shield" ? 10000 : 5000,
      rarity,
    };
  }, []);

  const applyPowerUp = useCallback((powerUp: PowerUp, playerId: number, state: GameState): GameState => {
    const newState = { ...state };
    const paddle = playerId === 0 ? newState.leftPaddle : newState.rightPaddle;
    const now = Date.now();
    
    switch (powerUp.type) {
      case "paddleGrow":
        paddle.height = paddle.baseHeight * 1.5;
        break;
      case "paddleShrink":
        const otherPaddle = playerId === 0 ? newState.rightPaddle : newState.leftPaddle;
        otherPaddle.height = otherPaddle.baseHeight * 0.6;
        break;
      case "multiBall":
        if (newState.balls.length < 3) {
          const mainBall = newState.balls[0];
          newState.balls.push(
            createBall(mainBall.x, mainBall.y, -mainBall.vx, mainBall.vy * 1.2),
            createBall(mainBall.x, mainBall.y, mainBall.vx, -mainBall.vy * 1.2)
          );
        }
        break;
      case "slowMo":
        newState.difficultyMultiplier *= 0.5;
        break;
      case "speedBoost":
        newState.balls.forEach(b => {
          b.vx *= 1.3;
          b.vy *= 1.3;
        });
        break;
      default:
        break;
    }
    
    newState.activePowerUps = [
      ...newState.activePowerUps,
      { type: powerUp.type, playerId, expiresAt: now + powerUp.duration, duration: powerUp.duration }
    ];
    newState.powerUps = newState.powerUps.filter(p => p.id !== powerUp.id);
    
    return newState;
  }, []);

  const updatePaddles = useCallback((state: GameState, delta: number): GameState => {
    const newState = { ...state };
    const { leftPaddle, rightPaddle } = newState;
    const moveAmount = PADDLE_SPEED * delta * 60;
    
    if (inputRef.current.left === "up") {
      leftPaddle.y = Math.max(0, leftPaddle.y - moveAmount);
    } else if (inputRef.current.left === "down") {
      leftPaddle.y = Math.min(CANVAS_HEIGHT - leftPaddle.height, leftPaddle.y + moveAmount);
    }
    
    if (isLocalMultiplayer) {
      if (inputRef.current.right === "up") {
        rightPaddle.y = Math.max(0, rightPaddle.y - moveAmount);
      } else if (inputRef.current.right === "down") {
        rightPaddle.y = Math.min(CANVAS_HEIGHT - rightPaddle.height, rightPaddle.y + moveAmount);
      }
    } else {
      const targetY = newState.balls[0].y - rightPaddle.height / 2;
      const difficulty = state.gameMode === "zen" ? 0.02 : 0.04 * state.difficultyMultiplier;
      rightPaddle.y += (targetY - rightPaddle.y) * difficulty;
      rightPaddle.y = Math.max(0, Math.min(CANVAS_HEIGHT - rightPaddle.height, rightPaddle.y));
    }
    
    return newState;
  }, [isLocalMultiplayer]);

  const updateBalls = useCallback((state: GameState, delta: number): GameState => {
    let newState = { ...state };
    const speedMultiplier = delta * 60 * state.difficultyMultiplier;
    
    newState.balls = newState.balls.map(ball => {
      const newBall = { ...ball };
      
      newBall.trail = [...ball.trail, { x: ball.x, y: ball.y }].slice(-7);
      
      newBall.x += newBall.vx * speedMultiplier;
      newBall.y += newBall.vy * speedMultiplier;
      
      if (newBall.y - newBall.radius <= 0 || newBall.y + newBall.radius >= CANVAS_HEIGHT) {
        newBall.vy = -newBall.vy;
        newBall.y = newBall.y - newBall.radius <= 0 ? newBall.radius : CANVAS_HEIGHT - newBall.radius;
        audioCallbacks.onWallHit();
      }
      
      const { leftPaddle, rightPaddle } = newState;
      
      if (
        newBall.x - newBall.radius <= leftPaddle.x + leftPaddle.width &&
        newBall.x + newBall.radius >= leftPaddle.x &&
        newBall.y >= leftPaddle.y &&
        newBall.y <= leftPaddle.y + leftPaddle.height &&
        newBall.vx < 0
      ) {
        const hitPos = (newBall.y - leftPaddle.y) / leftPaddle.height;
        const angle = (hitPos - 0.5) * Math.PI * 0.6;
        const speed = Math.sqrt(newBall.vx ** 2 + newBall.vy ** 2) * 1.02;
        newBall.vx = Math.abs(Math.cos(angle) * speed);
        newBall.vy = Math.sin(angle) * speed;
        newBall.x = leftPaddle.x + leftPaddle.width + newBall.radius;
        audioCallbacks.onPaddleHit();
      }
      
      if (
        newBall.x + newBall.radius >= rightPaddle.x &&
        newBall.x - newBall.radius <= rightPaddle.x + rightPaddle.width &&
        newBall.y >= rightPaddle.y &&
        newBall.y <= rightPaddle.y + rightPaddle.height &&
        newBall.vx > 0
      ) {
        const hitPos = (newBall.y - rightPaddle.y) / rightPaddle.height;
        const angle = (hitPos - 0.5) * Math.PI * 0.6;
        const speed = Math.sqrt(newBall.vx ** 2 + newBall.vy ** 2) * 1.02;
        newBall.vx = -Math.abs(Math.cos(angle) * speed);
        newBall.vy = Math.sin(angle) * speed;
        newBall.x = rightPaddle.x - newBall.radius;
        audioCallbacks.onPaddleHit();
      }
      
      return newBall;
    });
    
    newState.balls = newState.balls.filter((ball, index) => {
      if (ball.x < -50) {
        if (index === 0 || newState.balls.length === 1) {
          newState.rightScore++;
          audioCallbacks.onScore();
          return true;
        }
        return false;
      }
      if (ball.x > CANVAS_WIDTH + 50) {
        if (index === 0 || newState.balls.length === 1) {
          newState.leftScore++;
          audioCallbacks.onScore();
          return true;
        }
        return false;
      }
      return true;
    });
    
    if (newState.balls.length === 0 || newState.balls[0].x < -50 || newState.balls[0].x > CANVAS_WIDTH + 50) {
      newState.balls = [createBall()];
    }
    
    newState.ball = newState.balls[0];
    
    return newState;
  }, [audioCallbacks]);

  const updatePowerUps = useCallback((state: GameState, delta: number): GameState => {
    let newState = { ...state };
    const now = Date.now();
    
    newState.activePowerUps = newState.activePowerUps.filter(ap => {
      if (ap.expiresAt <= now) {
        if (ap.type === "paddleGrow" || ap.type === "paddleShrink") {
          newState.leftPaddle.height = newState.leftPaddle.baseHeight;
          newState.rightPaddle.height = newState.rightPaddle.baseHeight;
        }
        if (ap.type === "slowMo") {
          newState.difficultyMultiplier = 1;
        }
        return false;
      }
      return true;
    });
    
    newState.balls.forEach(ball => {
      newState.powerUps.forEach(powerUp => {
        const dx = ball.x - powerUp.x;
        const dy = ball.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ball.radius + 20) {
          const playerId = ball.vx > 0 ? 0 : 1;
          newState = applyPowerUp(powerUp, playerId, newState);
          audioCallbacks.onPowerUp();
        }
      });
    });
    
    powerUpSpawnTimerRef.current += delta * 1000;
    if (powerUpSpawnTimerRef.current > 5000 && newState.gameMode !== "classic" && newState.gameMode !== "zen") {
      const newPowerUp = spawnPowerUp(newState);
      if (newPowerUp) {
        newState.powerUps = [...newState.powerUps, newPowerUp];
      }
      powerUpSpawnTimerRef.current = 0;
    }
    
    return newState;
  }, [spawnPowerUp, applyPowerUp, audioCallbacks]);

  const checkWinCondition = useCallback((state: GameState): GameState => {
    const newState = { ...state };
    const winScore = state.gameMode === "timeAttack" ? Infinity : WIN_SCORE;
    
    if (state.gameMode === "timeAttack" && state.timeRemaining !== null && state.timeRemaining <= 0) {
      newState.isGameOver = true;
      newState.winner = state.leftScore > state.rightScore ? "left" : state.rightScore > state.leftScore ? "right" : null;
      audioCallbacks.onGameOver();
    } else if (state.leftScore >= winScore) {
      newState.isGameOver = true;
      newState.winner = "left";
      audioCallbacks.onGameOver();
    } else if (state.rightScore >= winScore) {
      newState.isGameOver = true;
      newState.winner = "right";
      audioCallbacks.onGameOver();
    }
    
    return newState;
  }, [audioCallbacks]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;
    
    setGameState(prevState => {
      if (prevState.isPaused || prevState.isGameOver) {
        return prevState;
      }
      
      let newState = updatePaddles(prevState, delta);
      newState = updateBalls(newState, delta);
      newState = updatePowerUps(newState, delta);
      newState = checkWinCondition(newState);
      
      if (newState.timeRemaining !== null) {
        newState.timeRemaining = Math.max(0, newState.timeRemaining - delta);
      }
      
      if (prevState.gameMode === "chaos") {
        newState.difficultyMultiplier = 1 + (prevState.leftScore + prevState.rightScore) * 0.05;
        if (Math.random() < 0.001 * delta * 60 && newState.balls.length < 5) {
          newState.balls.push(createBall());
        }
      }
      
      return newState;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updatePaddles, updateBalls, updatePowerUps, checkWinCondition]);

  const startGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    lastTimeRef.current = 0;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const stopGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const setLeftPaddleDirection = useCallback((direction: "up" | "down" | "none") => {
    inputRef.current.left = direction;
  }, []);

  const setRightPaddleDirection = useCallback((direction: "up" | "down" | "none") => {
    inputRef.current.right = direction;
  }, []);

  const setLeftPaddlePosition = useCallback((y: number) => {
    setGameState(prev => ({
      ...prev,
      leftPaddle: {
        ...prev.leftPaddle,
        y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.leftPaddle.height, y - prev.leftPaddle.height / 2)),
      },
    }));
  }, []);

  const setRightPaddlePosition = useCallback((y: number) => {
    setGameState(prev => ({
      ...prev,
      rightPaddle: {
        ...prev.rightPaddle,
        y: Math.max(0, Math.min(CANVAS_HEIGHT - prev.rightPaddle.height, y - prev.rightPaddle.height / 2)),
      },
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return {
    gameState,
    startGame,
    stopGame,
    resetGame,
    togglePause,
    setLeftPaddleDirection,
    setRightPaddleDirection,
    setLeftPaddlePosition,
    setRightPaddlePosition,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}
