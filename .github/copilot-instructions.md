# Copilot Agent Instructions - Neon Pong

## Required context
- Always read /AI_REPO_GUIDE.md first and follow it.
- If AI_REPO_GUIDE.md conflicts with README, prefer the most recently updated source and note the discrepancy.

## Repository Overview

**Neon Pong** is a full-stack web-based Pong game with a retro arcade synthwave aesthetic. The application is a ~8,500 line TypeScript codebase (76 files) featuring classic Pong mechanics with modern enhancements including multiple game modes, power-ups, local and online multiplayer, and a leaderboard system. Built as a mobile-first experience with touch-friendly controls while supporting desktop play.

**Type:** Full-stack web application  
**Primary Languages:** TypeScript, React, Node.js  
**Runtime:** Node.js v20.19.6, npm v10.8.2  
**Target Platform:** Replit deployment (autoscale)

## Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript, Vite build system
- **Routing:** Wouter (lightweight router)
- **State Management:** React hooks, TanStack Query for server state
- **Styling:** Tailwind CSS with CSS variables for theming
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Game Rendering:** HTML5 Canvas (800x600 logical resolution)

### Backend
- **Framework:** Express.js with TypeScript
- **Real-time:** WebSocket (ws library) for multiplayer
- **Server:** Node.js http module wrapping Express
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Fallback Storage:** In-memory MemStorage class (when DB unavailable)

### Build Tools
- **TypeScript Compiler:** v5.6.3
- **Frontend Build:** Vite v7.3.0 with React plugin
- **Server Build:** esbuild v0.25.0 (bundles to dist/index.cjs)
- **Dev Server:** tsx v4.20.5 for TypeScript execution

## Build, Test, and Development Commands

### Installation
**ALWAYS run `npm install` first before any other commands.** Dependencies must be installed before building or running the application.

```bash
npm install
```

### TypeScript Type Checking
Run type checking without building. This is fast (~2-3 seconds) and should be run frequently during development:

```bash
npm run check
```

### Development Server
Start the development server with hot module replacement. Server runs on port 5000:

```bash
npm run dev
```

**Notes:**
- Server starts in ~1-2 seconds
- Serves both frontend (via Vite middleware) and backend API
- WebSocket server runs on same port at `/ws` path
- Frontend available at http://localhost:5000
- API endpoints at http://localhost:5000/api/*
- Will run WITHOUT a database using in-memory storage (MemStorage)

### Production Build
Build both client and server for production deployment. Takes ~4-5 seconds total:

```bash
npm run build
```

**Build Process:**
1. Cleans `dist/` directory
2. Builds client with Vite → `dist/public/` (HTML, CSS, JS assets)
3. Builds server with esbuild → `dist/index.cjs` (single bundled file)

**Expected Output:**
- Client: ~385KB JS bundle, ~73KB CSS bundle
- Server: ~975KB bundled CJS file
- PostCSS warning about `from` option is EXPECTED and can be ignored

**Build Artifacts:** Ensure `dist/` and `node_modules/` are in `.gitignore`. They are already excluded in this project, so no changes should be needed.

### Production Server
Start the production server using built artifacts:

```bash
npm start
```

**Prerequisites:** Must run `npm run build` first.

### Database Operations
Push database schema to PostgreSQL (optional - app works without database):

```bash
npm run db:push
```

**Notes:**
- Requires `DATABASE_URL` environment variable
- Will fail gracefully if not set - app uses in-memory storage instead
- Database is OPTIONAL for development and testing

### Command Execution Order
**For fresh development setup:**
```bash
npm install          # Install dependencies (required)
npm run check        # Verify TypeScript (optional but recommended)
npm run dev          # Start development server
```

**For production deployment:**
```bash
npm install          # Install dependencies (required)
npm run build        # Build client and server (required)
npm start            # Start production server
```

**To verify changes don't break the build:**
```bash
npm run check        # Type check (fast, run first)
npm run build        # Full build (slower, run if check passes)
```

## Project Structure

### Root Directory Files
```
├── .replit                  # Replit configuration (deployment, ports)
├── .gitignore              # Git ignore rules (node_modules, dist, etc.)
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration with path aliases
├── vite.config.ts          # Vite configuration (React, plugins, aliases)
├── tailwind.config.ts      # Tailwind theme configuration
├── postcss.config.js       # PostCSS plugins (Tailwind, Autoprefixer)
├── drizzle.config.ts       # Drizzle ORM configuration
├── components.json         # shadcn/ui configuration
├── readme.md               # Project documentation
└── design_guidelines.md    # UI/UX design specifications
```

### Directory Structure
```
├── client/                 # Frontend React application
│   ├── index.html         # HTML entry point
│   ├── public/            # Static assets
│   └── src/
│       ├── main.tsx       # React entry point
│       ├── App.tsx        # Root component with routing
│       ├── index.css      # Global styles, CSS variables, Tailwind imports
│       ├── components/
│       │   ├── game/      # Game-specific components (9 files)
│       │   │   ├── GameCanvas.tsx      # Main canvas rendering
│       │   │   ├── GameHUD.tsx         # Score, timer display
│       │   │   ├── GameOver.tsx        # End game screen
│       │   │   ├── Leaderboard.tsx     # Leaderboard table
│       │   │   ├── MainMenu.tsx        # Title screen
│       │   │   ├── ModeSelect.tsx      # Game mode picker
│       │   │   ├── MultiplayerLobby.tsx # Room creation/joining
│       │   │   ├── PauseMenu.tsx       # Pause overlay
│       │   │   └── SettingsPanel.tsx   # Settings dialog
│       │   └── ui/        # shadcn/ui components (50+ files)
│       ├── hooks/
│       │   ├── useGameEngine.ts        # Core game loop logic
│       │   ├── useAudio.ts             # Web Audio API sounds
│       │   ├── use-mobile.tsx          # Responsive detection
│       │   └── use-toast.ts            # Toast notifications
│       ├── lib/
│       │   ├── queryClient.ts          # TanStack Query config
│       │   └── utils.ts                # Utility functions (cn, etc.)
│       └── pages/
│           ├── Game.tsx                # Main game page
│           └── not-found.tsx           # 404 page
│
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point, Express setup
│   ├── routes.ts          # API routes and WebSocket handlers
│   ├── storage.ts         # Storage interface and MemStorage class
│   ├── static.ts          # Static file serving for production
│   └── vite.ts            # Vite dev middleware setup
│
├── shared/                 # Shared types between client and server
│   └── schema.ts          # Drizzle schema, Zod schemas, TypeScript types
│
└── script/                 # Build scripts
    └── build.ts           # Production build orchestration
```

### Path Aliases

**TypeScript (`tsconfig.json`):**
- `@/*` → `./client/src/*` (frontend imports)
- `@shared/*` → `./shared/*` (shared types)

**Vite (`vite.config.ts`):**
- `@/*` → `./client/src/*` (frontend imports)
- `@shared/*` → `./shared/*` (shared types)
- `@assets/*` → `./attached_assets/*` (static assets)

### Key Configuration Files

**TypeScript Configuration (`tsconfig.json`):**
- Module system: ESNext with bundler resolution
- Strict mode enabled
- Includes: client/src, shared, server
- Excludes: node_modules, build, dist, test files

**Vite Configuration (`vite.config.ts`):**
- Root directory: `./client`
- Output directory: `./dist/public`
- Includes Replit-specific plugins in development
- Path aliases configured for `@`, `@shared`, `@assets`

**Tailwind Configuration (`tailwind.config.ts`):**
- Content: `./client/index.html`, `./client/src/**/*.{js,jsx,ts,tsx}`
- Custom theme with retro arcade color scheme
- Pixel font: "Press Start 2P" imported from Google Fonts
- Plugins: tailwindcss-animate, @tailwindcss/typography

**Drizzle Configuration (`drizzle.config.ts`):**
- Schema location: `./shared/schema.ts`
- Migration output: `./migrations`
- Dialect: PostgreSQL
- Requires DATABASE_URL environment variable (throws error if missing for db:push)

## Architecture Details

### Frontend Architecture
- **Single Page Application** with wouter routing (lightweight alternative to react-router)
- **Game Engine** in `useGameEngine.ts`: Canvas-based with frame loop, collision detection
- **State Management:** Local state with useState/useReducer, server state with TanStack Query
- **Game Modes:** Classic (11 pts), Arcade (power-ups), Time Attack (60s), Chaos (multi-ball), Zen (practice)
- **Control Schemes:** Drag (touch/mouse), Tap Zones (touch), Keyboard (W/S, arrows)
- **Audio System:** Web Audio API synthesized sounds (no external files)

### Backend Architecture
- **Express Server** on port 5000 (configurable via PORT env var)
- **REST API Endpoints:**
  - `GET /api/leaderboard?mode=<mode>&limit=<n>` - Fetch leaderboard
  - `POST /api/leaderboard` - Submit score (validates 0-1000 range, 1-20 char name)
- **WebSocket Server** at `/ws` path:
  - Handles multiplayer room creation, joining, game state sync
  - Room codes: 6-character alphanumeric (no confusing chars: I, O, 1, 0)
  - Auto-cleanup on disconnect
- **Storage Layer:** Interface-based (IStorage) with MemStorage fallback when DB unavailable

### Data Flow
1. **Development:** Vite dev middleware serves frontend, Express serves API/WS on same port
2. **Production:** Express serves static files from `dist/public/`, API/WS on same port
3. **Multiplayer:** Client ↔ WebSocket ↔ Room State ↔ Opponent Client
4. **Leaderboard:** Client → REST API → Storage (Memory or DB) → Client

### Shared Schema (`shared/schema.ts`)
- **Drizzle Tables:** users (id, username, password)
- **TypeScript Types:** GameState, Ball, Paddle, PowerUp, LeaderboardEntry, GameRoom, etc.
- **Zod Schemas:** insertUserSchema, insertLeaderboardSchema for validation
- **Game Types:** GameMode, PowerUpType, ControlScheme, GameSettings
- **WebSocket Types:** WSMessage union type for all message types

## Common Development Scenarios

### Making UI Changes
1. Edit components in `client/src/components/game/` or `client/src/components/ui/`
2. Styles use Tailwind classes and CSS variables from `client/src/index.css`
3. Reference `design_guidelines.md` for design system specifications
4. Run `npm run dev` to see changes with HMR (hot reload)

### Modifying Game Logic
1. Core game engine: `client/src/hooks/useGameEngine.ts`
2. Shared types: `shared/schema.ts`
3. Test changes in development with `npm run dev`
4. Run `npm run check` to verify TypeScript types

### Adding API Endpoints
1. Add route handler in `server/routes.ts`
2. Update shared types in `shared/schema.ts` if needed
3. Create corresponding client-side query in component using TanStack Query
4. Test with `npm run dev` (backend restarts automatically with tsx)

### Database Schema Changes
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` (requires DATABASE_URL)
3. App continues working with MemStorage if DB unavailable

### Build Issues
- **PostCSS warning:** Expected and harmless, can be ignored
- **Build fails after dependency change:** Run `rm -rf node_modules && npm install`
- **Type errors:** Run `npm run check` to see full error details
- **Build succeeds but production fails:** Check if `dist/` contains `index.cjs` and `public/` directory

## Environment Variables

**Optional:**
- `DATABASE_URL`: PostgreSQL connection string (app works without it using MemStorage)
- `PORT`: Server port (defaults to 5000, required for Replit deployment)
- `NODE_ENV`: Set to "production" or "development" (handled by npm scripts)

**Replit-Specific:**
- `REPL_ID`: Used by Vite plugins to enable Replit tooling in development

## Validation and Testing

**No automated tests currently exist** in this repository. Validate changes manually:

1. **Type Safety:** `npm run check` (should exit with code 0)
2. **Build Validation:** `npm run build` (should complete in ~4-5 seconds)
3. **Development Server:** `npm run dev` → open http://localhost:5000 → test gameplay
4. **Production Server:** `npm run build && npm start` → verify production build works

**Manual Testing Checklist:**
- Game starts and paddles respond to input
- Ball physics work correctly (bouncing, scoring)
- Mode selection screen appears and modes work
- Leaderboard can be accessed and displays entries
- Settings panel opens and controls work
- Multiplayer lobby can create/join rooms (if testing multiplayer)
- Sound effects play (if enabled in settings)
- Responsive behavior on mobile viewport sizes

## Deployment

**Target Platform:** Replit autoscale deployment

**Deployment Configuration (`.replit`):**
- Build command: `npm run build`
- Run command: `node ./dist/index.cjs`
- Port mapping: 5000 (internal) → 80 (external)
- Modules: nodejs-20, web, postgresql-16

**Deployment Process:**
1. Replit runs `npm run build` during deployment
2. Starts production server with `node ./dist/index.cjs`
3. Serves on port 5000 (proxied to port 80 externally)

## Important Notes and Gotchas

1. **Always run `npm install` first** - Many failures are due to missing dependencies
2. **Database is optional** - App uses in-memory storage when DATABASE_URL not set
3. **Port 5000 is required** - Replit firewalls other ports, always use PORT env var
4. **Build artifacts go to `dist/`** - Already in `.gitignore`, don't commit them
5. **PostCSS warning is harmless** - Ignore the warning about `from` option during builds
6. **WebSocket path is `/ws`** - Don't try to connect to a different path
7. **Game uses canvas** - Not accessible via standard DOM queries, state is in JavaScript
8. **Shared schema matters** - Both client and server import from `shared/schema.ts`
9. **shadcn/ui components** - Use existing components from `client/src/components/ui/`
10. **Touch controls** - Test on mobile viewport sizes if modifying controls

## When to Search vs Trust Instructions

**Trust these instructions for:**
- Build commands and order of operations
- File locations and directory structure
- Technology stack and dependencies
- Environment setup and configuration
- Development vs production differences

**Search the codebase when:**
- Implementing new features (to find similar patterns)
- Modifying existing game logic (to understand current implementation)
- Fixing bugs (to locate the problematic code)
- Adding new components (to match existing style and patterns)
- Instructions seem outdated or don't match your observations

**The goal:** Use these instructions to work efficiently without wasting time on basic setup, build commands, or exploration. Focus your search efforts on understanding specific code that you need to modify.
