import type { User, InsertUser, LeaderboardEntry, InsertLeaderboardEntry, GameRoom, GameMode } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(username: string, password: string): Promise<User | null>;
  
  getLeaderboard(mode?: GameMode, limit?: number): Promise<LeaderboardEntry[]>;
  addLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  
  createRoom(hostId: string, mode: GameMode): Promise<GameRoom>;
  getRoom(id: string): Promise<GameRoom | undefined>;
  getRoomByCode(code: string): Promise<GameRoom | undefined>;
  updateRoom(id: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined>;
  deleteRoom(id: string): Promise<void>;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private leaderboard: Map<string, LeaderboardEntry>;
  private rooms: Map<string, GameRoom>;

  constructor() {
    this.users = new Map();
    this.leaderboard = new Map();
    this.rooms = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    // Hash the password before storing
    const passwordHash = await bcrypt.hash(insertUser.password, SALT_ROUNDS);
    const user: User = { 
      id, 
      username: insertUser.username, 
      passwordHash 
    };
    this.users.set(id, user);
    return user;
  }

  async verifyPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    // Always perform bcrypt comparison to prevent timing attacks
    // Use a dummy hash when user doesn't exist to ensure consistent timing
    const hashToCompare = user?.passwordHash || '$2b$10$dummyhashtopreventtimingattacksxxxxxxxxxxxxxxxxxxxxxxxxx';
    const isValid = await bcrypt.compare(password, hashToCompare);
    
    // Only return user if they exist AND password is valid
    return (user && isValid) ? user : null;
  }

  async getLeaderboard(mode?: GameMode, limit: number = 50): Promise<LeaderboardEntry[]> {
    let entries = Array.from(this.leaderboard.values());
    
    if (mode) {
      entries = entries.filter(e => e.mode === mode);
    }
    
    return entries
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async addLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const id = randomUUID();
    const leaderboardEntry: LeaderboardEntry = {
      id,
      playerName: entry.playerName,
      score: entry.score,
      mode: entry.mode,
      date: new Date().toISOString(),
    };
    this.leaderboard.set(id, leaderboardEntry);
    return leaderboardEntry;
  }

  async createRoom(hostId: string, mode: GameMode): Promise<GameRoom> {
    const id = randomUUID();
    let code = generateRoomCode();
    
    while (await this.getRoomByCode(code)) {
      code = generateRoomCode();
    }
    
    const room: GameRoom = {
      id,
      code,
      hostId,
      guestId: null,
      gameState: null,
      status: "waiting",
      mode,
    };
    
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: string): Promise<GameRoom | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByCode(code: string): Promise<GameRoom | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.code === code.toUpperCase(),
    );
  }

  async updateRoom(id: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<void> {
    this.rooms.delete(id);
  }
}

export const storage = new MemStorage();
