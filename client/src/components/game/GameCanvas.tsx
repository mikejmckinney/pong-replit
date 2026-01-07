import { useRef, useEffect, useCallback } from "react";
import type { GameState, ControlScheme } from "@shared/schema";

interface GameCanvasProps {
  gameState: GameState;
  canvasWidth: number;
  canvasHeight: number;
  controlScheme: ControlScheme;
  isLocalMultiplayer: boolean;
  onLeftPaddleMove: (y: number) => void;
  onRightPaddleMove: (y: number) => void;
  onLeftPaddleDirection: (dir: "up" | "down" | "none") => void;
  onRightPaddleDirection: (dir: "up" | "down" | "none") => void;
}

const NEON_MAGENTA = "#ff2d95";
const NEON_CYAN = "#00ffff";
const NEON_PURPLE = "#bf5fff";
const NEON_YELLOW = "#ffcc00";
const DARK_BG = "#0a0a12";

export function GameCanvas({
  gameState,
  canvasWidth,
  canvasHeight,
  controlScheme,
  isLocalMultiplayer,
  onLeftPaddleMove,
  onRightPaddleMove,
  onLeftPaddleDirection,
  onRightPaddleDirection,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const touchStartRef = useRef<{ [key: number]: { x: number; y: number } }>({});

  const getScaledY = useCallback((clientY: number, rect: DOMRect): number => {
    const relativeY = clientY - rect.top;
    return relativeY / scaleRef.current;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    Array.from(e.changedTouches).forEach(touch => {
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const scaledX = x / scaleRef.current;
      const scaledY = y / scaleRef.current;
      
      touchStartRef.current[touch.identifier] = { x: scaledX, y: scaledY };
      
      if (controlScheme === "tap") {
        const isLeftSide = scaledX < canvasWidth / 2;
        const isTopHalf = scaledY < canvasHeight / 2;
        
        if (isLeftSide) {
          onLeftPaddleDirection(isTopHalf ? "up" : "down");
        } else if (isLocalMultiplayer) {
          onRightPaddleDirection(isTopHalf ? "up" : "down");
        }
      } else {
        const isLeftSide = scaledX < canvasWidth * 0.4;
        const isRightSide = scaledX > canvasWidth * 0.6;
        
        if (isLeftSide) {
          onLeftPaddleMove(scaledY);
        } else if (isRightSide && isLocalMultiplayer) {
          onRightPaddleMove(scaledY);
        }
      }
    });
  }, [controlScheme, canvasWidth, canvasHeight, isLocalMultiplayer, onLeftPaddleMove, onRightPaddleMove, onLeftPaddleDirection, onRightPaddleDirection]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || controlScheme !== "drag") return;
    
    const rect = canvas.getBoundingClientRect();
    
    Array.from(e.changedTouches).forEach(touch => {
      const x = touch.clientX - rect.left;
      const scaledX = x / scaleRef.current;
      const scaledY = getScaledY(touch.clientY, rect);
      
      const isLeftSide = scaledX < canvasWidth * 0.4;
      const isRightSide = scaledX > canvasWidth * 0.6;
      
      if (isLeftSide) {
        onLeftPaddleMove(scaledY);
      } else if (isRightSide && isLocalMultiplayer) {
        onRightPaddleMove(scaledY);
      }
    });
  }, [controlScheme, canvasWidth, isLocalMultiplayer, getScaledY, onLeftPaddleMove, onRightPaddleMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(touch => {
      delete touchStartRef.current[touch.identifier];
    });
    
    if (controlScheme === "tap") {
      if (Object.keys(touchStartRef.current).length === 0) {
        onLeftPaddleDirection("none");
        onRightPaddleDirection("none");
      }
    }
  }, [controlScheme, onLeftPaddleDirection, onRightPaddleDirection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false });
    
    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    
    const updateScale = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      scaleRef.current = Math.min(scaleX, scaleY);
      
      canvas.style.width = `${canvasWidth * scaleRef.current}px`;
      canvas.style.height = `${canvasHeight * scaleRef.current}px`;
    };
    
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = DARK_BG;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    ctx.strokeStyle = NEON_PURPLE;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.strokeStyle = NEON_PURPLE + "60";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);
    
    const { leftPaddle, rightPaddle, balls, powerUps, activePowerUps } = gameState;
    
    const drawPaddle = (paddle: typeof leftPaddle, color: string) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    };
    
    drawPaddle(leftPaddle, NEON_MAGENTA);
    drawPaddle(rightPaddle, NEON_CYAN);
    
    balls.forEach(ball => {
      ball.trail.forEach((pos, i) => {
        const alpha = (i + 1) / ball.trail.length * 0.5;
        const radius = ball.radius * (0.3 + (i / ball.trail.length) * 0.7);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
      
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    powerUps.forEach(powerUp => {
      const color = powerUp.rarity === "legendary" ? NEON_YELLOW : 
                    powerUp.rarity === "rare" ? NEON_PURPLE : NEON_CYAN;
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(powerUp.x, powerUp.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = color;
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const icon = getPowerUpIcon(powerUp.type);
      ctx.fillText(icon, powerUp.x, powerUp.y);
    });
    
    if (controlScheme === "drag") {
      ctx.fillStyle = NEON_MAGENTA + "10";
      ctx.fillRect(0, 0, canvasWidth * 0.4, canvasHeight);
      
      if (isLocalMultiplayer) {
        ctx.fillStyle = NEON_CYAN + "10";
        ctx.fillRect(canvasWidth * 0.6, 0, canvasWidth * 0.4, canvasHeight);
      }
    }
    
    if (controlScheme === "tap") {
      ctx.strokeStyle = NEON_MAGENTA + "30";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight / 2);
      ctx.lineTo(canvasWidth * 0.4, canvasHeight / 2);
      ctx.stroke();
      
      if (isLocalMultiplayer) {
        ctx.strokeStyle = NEON_CYAN + "30";
        ctx.beginPath();
        ctx.moveTo(canvasWidth * 0.6, canvasHeight / 2);
        ctx.lineTo(canvasWidth, canvasHeight / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    
    for (let i = 0; i < canvasHeight; i += 4) {
      if (i % 8 === 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, i, canvasWidth, 2);
      }
    }
    
  }, [gameState, canvasWidth, canvasHeight, controlScheme, isLocalMultiplayer]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center touch-none select-none"
      data-testid="game-canvas-container"
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="block rounded-md"
        style={{
          imageRendering: "pixelated",
          boxShadow: `0 0 60px ${NEON_PURPLE}40, 0 0 120px ${NEON_MAGENTA}20`,
        }}
        data-testid="game-canvas"
      />
    </div>
  );
}

function getPowerUpIcon(type: string): string {
  switch (type) {
    case "paddleGrow": return "+";
    case "paddleShrink": return "-";
    case "multiBall": return "x3";
    case "slowMo": return "S";
    case "speedBoost": return "F";
    case "shield": return "O";
    case "curveShot": return "C";
    default: return "?";
  }
}
