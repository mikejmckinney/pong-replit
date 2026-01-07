import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertLeaderboardSchema, type WSMessage, type GameMode } from "@shared/schema";
import { z } from "zod";

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  roomId: string | null;
}

const clients = new Map<string, ConnectedClient>();
const roomClients = new Map<string, Set<string>>();

function generateClientId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function broadcastToRoom(roomId: string, message: WSMessage, excludeClientId?: string) {
  const clientIds = roomClients.get(roomId);
  if (!clientIds) return;
  
  const data = JSON.stringify(message);
  clientIds.forEach(clientId => {
    if (clientId !== excludeClientId) {
      const client = clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  });
}

function sendToClient(clientId: string, message: WSMessage) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const mode = req.query.mode as GameMode | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const entries = await storage.getLeaderboard(mode, limit);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const parsed = insertLeaderboardSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      if (parsed.data.score < 0 || parsed.data.score > 1000) {
        return res.status(400).json({ error: "Invalid score" });
      }
      
      if (parsed.data.playerName.length < 1 || parsed.data.playerName.length > 20) {
        return res.status(400).json({ error: "Invalid player name" });
      }
      
      const entry = await storage.addLeaderboardEntry(parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to add leaderboard entry" });
    }
  });

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    const clientId = generateClientId();
    const client: ConnectedClient = { ws, id: clientId, roomId: null };
    clients.set(clientId, client);
    
    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(clientId, message);
      } catch (error) {
        console.error("WebSocket message error:", error);
        sendToClient(clientId, { type: "error", message: "Invalid message format" });
      }
    });
    
    ws.on("close", async () => {
      const client = clients.get(clientId);
      if (client && client.roomId) {
        const roomClientIds = roomClients.get(client.roomId);
        if (roomClientIds) {
          roomClientIds.delete(clientId);
          if (roomClientIds.size === 0) {
            roomClients.delete(client.roomId);
            const room = await storage.getRoomByCode(client.roomId);
            if (room) {
              await storage.deleteRoom(room.id);
            }
          } else {
            broadcastToRoom(client.roomId, { type: "playerDisconnected" });
          }
        }
      }
      clients.delete(clientId);
    });
  });

  async function handleWebSocketMessage(clientId: string, message: any) {
    const client = clients.get(clientId);
    if (!client) return;
    
    switch (message.type) {
      case "createRoom": {
        const mode = message.mode as GameMode || "classic";
        const room = await storage.createRoom(clientId, mode);
        
        client.roomId = room.code;
        clients.set(clientId, client);
        
        const clientSet = new Set<string>();
        clientSet.add(clientId);
        roomClients.set(room.code, clientSet);
        
        sendToClient(clientId, { type: "roomCreated", room });
        break;
      }
      
      case "joinRoom": {
        const code = (message.code as string).toUpperCase();
        const room = await storage.getRoomByCode(code);
        
        if (!room) {
          sendToClient(clientId, { type: "error", message: "Room not found" });
          return;
        }
        
        if (room.guestId) {
          sendToClient(clientId, { type: "error", message: "Room is full" });
          return;
        }
        
        const updatedRoom = await storage.updateRoom(room.id, { guestId: clientId });
        if (!updatedRoom) {
          sendToClient(clientId, { type: "error", message: "Failed to join room" });
          return;
        }
        
        client.roomId = room.code;
        clients.set(clientId, client);
        
        const clientSet = roomClients.get(room.code) || new Set();
        clientSet.add(clientId);
        roomClients.set(room.code, clientSet);
        
        broadcastToRoom(room.code, { type: "playerJoined", room: updatedRoom });
        break;
      }
      
      case "startGame": {
        if (!client.roomId) {
          sendToClient(clientId, { type: "error", message: "Not in a room" });
          return;
        }
        
        const room = await storage.getRoomByCode(client.roomId);
        if (!room || room.hostId !== clientId) {
          sendToClient(clientId, { type: "error", message: "Only host can start game" });
          return;
        }
        
        if (!room.guestId) {
          sendToClient(clientId, { type: "error", message: "Waiting for opponent" });
          return;
        }
        
        await storage.updateRoom(room.id, { status: "playing" });
        
        const initialState = {
          ball: { x: 400, y: 300, vx: 5, vy: 3, radius: 10, trail: [] },
          balls: [{ x: 400, y: 300, vx: 5, vy: 3, radius: 10, trail: [] }],
          leftPaddle: { x: 20, y: 250, width: 12, height: 100, baseHeight: 100, speed: 8 },
          rightPaddle: { x: 768, y: 250, width: 12, height: 100, baseHeight: 100, speed: 8 },
          leftScore: 0,
          rightScore: 0,
          gameMode: room.mode,
          isPaused: false,
          isGameOver: false,
          winner: null,
          powerUps: [],
          activePowerUps: [],
          timeRemaining: room.mode === "timeAttack" ? 60 : null,
          difficultyMultiplier: 1,
        };
        
        broadcastToRoom(client.roomId, { type: "gameStart", state: initialState });
        break;
      }
      
      case "playerInput": {
        if (!client.roomId) return;
        
        broadcastToRoom(client.roomId, {
          type: "playerInput",
          input: message.input,
        }, clientId);
        break;
      }
      
      case "gameUpdate": {
        if (!client.roomId) return;
        
        broadcastToRoom(client.roomId, {
          type: "gameUpdate",
          state: message.state,
        }, clientId);
        break;
      }
    }
  }

  return httpServer;
}
