# Neon Pong - Retro Arcade Game

## Overview

Neon Pong is a web-based Pong game with a retro arcade synthwave aesthetic. The application features classic Pong mechanics with modern enhancements including multiple game modes, power-ups, local and online multiplayer, and a leaderboard system. Built as a mobile-first experience with touch-friendly controls while supporting desktop play.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: React hooks and TanStack Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with HMR support

The frontend follows a component-based architecture with game-specific components in `client/src/components/game/` and reusable UI components in `client/src/components/ui/`. Custom hooks handle game logic (`useGameEngine`), audio (`useAudio`), and responsive detection (`use-mobile`).

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Real-time Communication**: WebSocket (ws) for multiplayer functionality
- **HTTP Server**: Node.js native http module wrapping Express

The server handles REST API endpoints for leaderboard operations and WebSocket connections for real-time multiplayer game state synchronization. Routes are registered in `server/routes.ts` with WebSocket room management for matchmaking.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Fallback**: In-memory storage (`MemStorage` class) when database is unavailable
- **Client-side**: localStorage for settings persistence and local leaderboard backup

Database schema includes:
- `users` table for player accounts
- Leaderboard entries with game mode, score, and timestamps
- Game rooms for multiplayer session management

### Game Engine Design
The game engine (`useGameEngine.ts`) implements:
- Canvas-based rendering with 800x600 logical resolution
- Frame-based game loop with delta time updates
- Collision detection for ball-paddle and ball-wall interactions
- AI opponent with configurable difficulty
- Power-up spawn system with rarity tiers

### Game Modes
- **Classic**: First to 11 points, no power-ups
- **Arcade**: Power-ups enabled with spawn mechanics
- **Time Attack**: 60-second score challenge
- **Chaos**: Multi-ball with speed ramps
- **Zen**: Practice mode with slower AI

### Control Schemes
- **Drag**: Touch/mouse drag to move paddle
- **Tap Zones**: Tap upper/lower screen areas for direction
- **Keyboard**: W/S and Arrow keys for desktop

## External Dependencies

### Third-Party Services
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Google Fonts**: "Press Start 2P" pixel font for retro typography

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `ws`: WebSocket server for multiplayer
- `@tanstack/react-query`: Server state management
- `zod`: Runtime type validation
- `drizzle-zod`: Schema-to-Zod type generation

### Audio System
- Web Audio API for synthesized sound effects (paddle hit, wall hit, score)
- No external audio files - all sounds generated programmatically
- Respects mobile autoplay restrictions (audio starts on user interaction)

### Build & Development
- `tsx`: TypeScript execution for development server
- `esbuild`: Server bundling for production
- `vite`: Frontend bundling with React plugin
- Replit-specific plugins for development tooling