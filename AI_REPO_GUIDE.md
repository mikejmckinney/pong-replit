# AI Repo Guide - Neon Pong

## Overview
Neon Pong is a full-stack web-based Pong game with retro arcade synthwave aesthetics. Built as a mobile-first progressive web app supporting local AI play, online multiplayer (WebSocket), multiple game modes, power-ups, and a leaderboard system. ~8,500 lines of TypeScript across 76 files.

**Target deployment:** Replit autoscale (Node.js v20.19.6, npm v10.8.2)

## Quickstart

### Run locally
```bash
npm install              # ALWAYS run first
npm run dev              # Starts dev server on port 5000 (~1-2s)
```
Open http://localhost:5000 - no database required (uses in-memory fallback).

### Test & validate
```bash
npm run check            # TypeScript type check (~2-3s)
npm run build            # Production build (~4-5s) - expect PostCSS warning (harmless)
```

**No automated tests exist.** Manual validation checklist in [.github/copilot-instructions.md](.github/copilot-instructions.md#validation-and-testing).

### Deploy
```bash
npm run build            # Creates dist/index.cjs + dist/public/
npm start                # Runs production server (port 5000)
```

## Folder Map

```
pong-replit/
├── .github/             # Copilot instructions for agents
├── .replit              # Replit deployment config (build/run commands, port mapping)
├── client/              # React frontend (Vite)
│   ├── index.html       # Entry HTML (imports Press Start 2P font)
│   ├── public/          # Static assets (favicon, etc.)
│   └── src/
│       ├── main.tsx     # React entry point
│       ├── App.tsx      # Root component with Wouter routing
│       ├── index.css    # Global styles (Tailwind imports, CSS variables)
│       ├── components/
│       │   ├── game/    # 9 game-specific components (canvas, HUD, menus)
│       │   └── ui/      # 50+ shadcn/ui components (Radix primitives)
│       ├── hooks/       # useGameEngine (core logic), useAudio, use-mobile
│       ├── lib/         # queryClient, utils (cn)
│       └── pages/       # Game.tsx (main page), not-found.tsx
├── server/              # Express backend (TypeScript)
│   ├── index.ts         # Server entry, middleware, port 5000
│   ├── routes.ts        # REST API + WebSocket handlers
│   ├── storage.ts       # IStorage interface + MemStorage (in-memory fallback)
│   ├── static.ts        # Static file serving (production)
│   └── vite.ts          # Vite dev middleware setup
├── shared/
│   └── schema.ts        # Shared types (Drizzle schema, Zod, game state types)
├── script/
│   └── build.ts         # Production build orchestration (Vite + esbuild)
├── attached_assets/     # Additional static assets
├── package.json         # Dependencies + npm scripts
├── tsconfig.json        # TypeScript config (path aliases: @, @shared, @assets)
├── vite.config.ts       # Vite config (root: ./client, output: dist/public)
├── tailwind.config.ts   # Tailwind theme (retro colors, Press Start 2P font)
├── drizzle.config.ts    # Drizzle ORM config (PostgreSQL, optional)
├── components.json      # shadcn/ui config (style: new-york)
└── readme.md            # Architecture overview, system design
```

## Key Entry Points

### Frontend Bootstrap
- `client/index.html` → `client/src/main.tsx` → `App.tsx`
- `App.tsx` wraps Wouter router, TanStack Query provider, shadcn/ui Toaster
- Single route: `/` → `pages/Game.tsx`

### Backend Bootstrap
- `server/index.ts` creates Express app + HTTP server
- Registers middleware (JSON, URL-encoded, request logging)
- Calls `registerRoutes(httpServer, app)` from `routes.ts`
- In dev: imports `vite.ts` for HMR middleware
- In prod: imports `static.ts` to serve `dist/public/`
- Listens on port 5000 (configurable via `PORT` env var)

### Game Execution Flow
1. User loads `/` → React renders `Game.tsx`
2. `Game.tsx` contains game state machine: MainMenu → ModeSelect → GameCanvas → GameOver
3. `useGameEngine` hook runs canvas frame loop (60fps), handles physics/collision
4. User actions (paddle movement) update game state via hook callbacks
5. For multiplayer: WebSocket connection to `/ws` syncs state with opponent

### API Flow
- **Leaderboard GET:** `GET /api/leaderboard?mode=classic&limit=50` → `storage.getLeaderboard()`
- **Leaderboard POST:** `POST /api/leaderboard` (Zod validation) → `storage.addLeaderboardEntry()`
- **WebSocket:** `ws://localhost:5000/ws` → room creation/join, game state sync, player input relay

## Key Data Flows

### Multiplayer Room Flow
1. Host creates room → WebSocket `createRoom` → server generates 6-char code (no I/O/1/0)
2. Guest joins → WebSocket `joinRoom` → server validates room, adds guest
3. Host starts game → WebSocket `startGame` → server broadcasts initial state
4. Players send input → WebSocket `playerInput` → server relays to opponent
5. Disconnect → server auto-cleans room

### Leaderboard Flow
1. Game ends → client POSTs score (playerName, score, mode) → Zod validation
2. Server: validates score 0-1000, name 1-20 chars → `storage.addLeaderboardEntry()`
3. Client fetches: `GET /api/leaderboard?mode=...` → sorted by score DESC, limit 50

### Game State Management
- Local game state: `useGameEngine` hook (React useState/useReducer)
- Server state (leaderboard): TanStack Query (`@tanstack/react-query`)
- Settings persistence: localStorage (soundEnabled, volume, controlScheme)
- No global state library (Redux/Zustand) - intentionally simple

## Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | Module: ESNext, strict mode, path aliases (`@`, `@shared`, `@assets`) |
| `vite.config.ts` | Root: `./client`, output: `dist/public`, Replit plugins (dev only) |
| `tailwind.config.ts` | Content: `client/**/*.{tsx,jsx}`, custom retro theme, pixel font |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `drizzle.config.ts` | Schema: `shared/schema.ts`, dialect: PostgreSQL (throws if no DB URL for db:push) |
| `components.json` | shadcn/ui: style new-york, aliases point to `@/components`, `@/lib` |
| `.replit` | Deployment: build=`npm run build`, run=`node dist/index.cjs`, port 5000→80 |
| `.gitignore` | Excludes: node_modules, dist, .DS_Store, server/public, vite.config.ts.* |

## Conventions

### Code Style
- **TypeScript strict mode:** All files use explicit types
- **No ESLint/Prettier configs:** Rely on editor defaults + TypeScript compiler
- **Imports:** Use path aliases (`@/`, `@shared/`) - avoid relative paths across dirs
- **Component structure:** Functional components with hooks, no class components

### Naming
- **Components:** PascalCase (GameCanvas.tsx, MainMenu.tsx)
- **Hooks:** camelCase with `use` prefix (useGameEngine, useAudio)
- **Types:** PascalCase interfaces/types in `shared/schema.ts`
- **Files:** Match export name (GameCanvas.tsx exports GameCanvas)

### Branching & Commits
- No explicit conventions documented
- Current PR branch: `copilot/add-copilot-instructions-file`
- Commits use conventional format: "Add comprehensive .github/copilot-instructions.md file"

### Formatting
- Indentation: 2 spaces (inferred from existing code)
- Line length: No hard limit (some lines exceed 100 chars)
- Trailing commas: Yes (in objects/arrays)

## Where to Add Things

### New Game Component
- Create in `client/src/components/game/[ComponentName].tsx`
- Import and use in `pages/Game.tsx` state machine
- Style with Tailwind classes + CSS variables from `index.css`

### New UI Component
- If shadcn/ui: Use `npx shadcn@latest add [component-name]` (auto-installs to `components/ui/`)
- Custom component: Add to `components/ui/` following Radix UI patterns

### New API Endpoint
1. Add route handler in `server/routes.ts` (REST or WebSocket case)
2. Update shared types in `shared/schema.ts` if needed (Zod schema + TypeScript types)
3. Add client query in component using `@tanstack/react-query`

### New Game Mode
1. Add mode to `GameMode` type in `shared/schema.ts`: `"classic" | "arcade" | "newMode"`
2. Update `useGameEngine` logic for mode-specific behavior
3. Add mode to `ModeSelect.tsx` UI
4. Update leaderboard queries to filter by new mode

### Database Schema Change
1. Edit `shared/schema.ts` Drizzle tables
2. Run `npm run db:push` (requires DATABASE_URL)
3. App continues working without DB via MemStorage fallback

### New Build Step
- Edit `script/build.ts` (orchestrates Vite + esbuild)
- For client: modify `vite.config.ts`
- For server: modify esbuild options in `build.ts`

## Troubleshooting / Common Gotchas

### Build & Runtime
1. **PostCSS warning during build:** "PostCSS plugin did not pass `from` option" - EXPECTED, safe to ignore
2. **Port 5000 required:** Replit firewalls other ports. Always use `PORT=5000` env var.
3. **Database optional:** If no `DATABASE_URL`, server uses `MemStorage` (in-memory). Not an error.
4. **Build fails after dep change:** Run `rm -rf node_modules && npm install`
5. **Production fails but build succeeds:** Check `dist/` contains `index.cjs` + `public/` dir

### Development
6. **Hot reload not working:** Vite dev middleware only active in dev mode (`NODE_ENV=development`)
7. **Canvas not updating:** Game state is in `useGameEngine` hook, not DOM. Check hook state updates.
8. **WebSocket connection fails:** Ensure connecting to `/ws` path, not `/websocket` or root
9. **Shared types out of sync:** Always import types from `@shared/schema`, never duplicate
10. **shadcn/ui component missing:** Run `npx shadcn@latest add [component]` - don't manually create

### Multiplayer
11. **Room code not working:** Codes are 6-char uppercase, exclude I/O/1/0 for clarity
12. **Guest can't join full room:** Check room status, only 2 players (host + guest) allowed
13. **Disconnect cleanup:** Server auto-deletes room when all clients disconnect

### Styling
14. **Pixel font not loading:** "Press Start 2P" loaded from Google Fonts in `index.html`
15. **CSS variables not working:** Variables defined in `client/src/index.css` `:root` selector
16. **Tailwind classes not applying:** Ensure file in `tailwind.config.ts` content paths

### Path Aliases
17. **`@/` import fails:** Check `tsconfig.json` and `vite.config.ts` both define path aliases
18. **`@shared` not found in server:** Ensure `tsconfig.json` includes `"server/**/*"` in files

## Additional Notes

- **No tests:** Validate changes manually via `npm run dev` + browser testing
- **Mobile-first:** Test responsive behavior at <768px viewport
- **Touch controls:** Drag (primary), tap zones (alternative), keyboard (desktop)
- **Replit deployment:** `.replit` file configures autoscale deployment (build + run commands)
- **Design system:** See `design_guidelines.md` for detailed UI/UX specs (colors, spacing, typography)
- **Comprehensive guide:** `.github/copilot-instructions.md` has exhaustive agent onboarding info

---

**Last updated:** 2026-01-08 (created alongside copilot-instructions.md)
