import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Game Mode Types
export type GameMode = "classic" | "arcade" | "timeAttack" | "chaos" | "zen";

// Power-up Types
export type PowerUpType = 
  | "paddleGrow" 
  | "paddleShrink" 
  | "multiBall" 
  | "slowMo" 
  | "speedBoost" 
  | "shield" 
  | "curveShot";

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  duration: number;
  rarity: "common" | "rare" | "legendary";
}

export interface ActivePowerUp {
  type: PowerUpType;
  playerId: number;
  expiresAt: number;
  duration: number;
}

// Game State Types
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  baseHeight: number;
  speed: number;
}

export interface GameState {
  ball: Ball;
  balls: Ball[];
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  leftScore: number;
  rightScore: number;
  gameMode: GameMode;
  isPaused: boolean;
  isGameOver: boolean;
  winner: "left" | "right" | null;
  powerUps: PowerUp[];
  activePowerUps: ActivePowerUp[];
  timeRemaining: number | null;
  difficultyMultiplier: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  mode: GameMode;
  date: string;
}

export const insertLeaderboardSchema = z.object({
  playerName: z.string().min(1).max(20),
  score: z.number().int().min(0),
  mode: z.enum(["classic", "arcade", "timeAttack", "chaos", "zen"]),
});

export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;

// Multiplayer Types
export interface GameRoom {
  id: string;
  code: string;
  hostId: string;
  guestId: string | null;
  gameState: GameState | null;
  status: "waiting" | "playing" | "finished";
  mode: GameMode;
}

export interface PlayerInput {
  playerId: string;
  direction: "up" | "down" | "none";
  timestamp: number;
}

// Control Scheme Types
export type ControlScheme = "drag" | "tap";

// Settings Types
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  controlScheme: ControlScheme;
  difficulty: "easy" | "medium" | "hard";
  showEffects: boolean;
}

// WebSocket Message Types
export type WSMessage = 
  | { type: "createRoom"; mode: GameMode }
  | { type: "joinRoom"; code: string }
  | { type: "roomCreated"; room: GameRoom }
  | { type: "playerJoined"; room: GameRoom }
  | { type: "gameStart"; state: GameState }
  | { type: "gameUpdate"; state: GameState }
  | { type: "playerInput"; input: PlayerInput }
  | { type: "gameEnd"; winner: "left" | "right" }
  | { type: "error"; message: string }
  | { type: "playerDisconnected" };
