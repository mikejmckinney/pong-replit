# Deploying Neon Pong to Vercel

This guide explains how to deploy Neon Pong to Vercel. Since Vercel is primarily a frontend hosting platform, this guide covers different deployment strategies depending on which features you need.

## Understanding the Architecture

Neon Pong is a **full-stack application** with:
- **Frontend**: React + Vite (can be deployed to Vercel)
- **Backend**: Express.js REST API + WebSocket server (requires a Node.js server)

### Feature Availability by Deployment Type

| Feature | Frontend-Only (Vercel) | Full-Stack |
|---------|------------------------|------------|
| Single player vs AI | ✅ Works | ✅ Works |
| All game modes | ✅ Works | ✅ Works |
| Power-ups | ✅ Works | ✅ Works |
| Sound effects | ✅ Works | ✅ Works |
| Local settings | ✅ Works (localStorage) | ✅ Works |
| Global leaderboard | ❌ No backend | ✅ Works |
| Online multiplayer | ❌ No WebSocket | ✅ Works |

## Option 1: Frontend-Only Deployment (Simple)

Deploy just the React frontend to Vercel. Perfect if you only need single-player gameplay.

### Step 1: Deploy to Vercel

The existing project structure works with Vercel. The key is using a custom build command that only builds the client:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure the build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave empty (use project root)
   - **Build Command**: `npx vite build --outDir dist/public`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`
6. Click "Deploy"

Alternatively, create a `vercel.json` in the project root:

```json
{
  "buildCommand": "npx vite build --outDir dist/public",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Step 2: Handle Missing Backend Gracefully

The game will work in single-player mode, but leaderboard and multiplayer features will fail silently. The app already handles this gracefully - API calls will fail but won't break the game.

## Option 2: Vercel with Serverless Functions (Advanced)

You can use Vercel Serverless Functions to handle the leaderboard API. This requires restructuring the backend code.

### Step 1: Create API Directory

Create an `api` directory in the project root with serverless functions:

```
api/
├── leaderboard.ts     # GET/POST /api/leaderboard
```

### Step 2: Create Leaderboard Function

Create `api/leaderboard.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (resets on cold starts)
// For persistent storage, use Vercel KV, Postgres, or external DB
let leaderboard: Array<{
  id: number;
  playerName: string;
  score: number;
  mode: string;
  createdAt: Date;
}> = [];

let nextId = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const mode = req.query.mode as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    
    let entries = [...leaderboard];
    if (mode) {
      entries = entries.filter(e => e.mode === mode);
    }
    entries.sort((a, b) => b.score - a.score);
    entries = entries.slice(0, limit);
    
    return res.status(200).json(entries);
  }
  
  if (req.method === 'POST') {
    const { playerName, score, mode } = req.body;
    
    if (!playerName || typeof score !== 'number' || !mode) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    if (score < 0 || score > 1000) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    
    if (playerName.length < 1 || playerName.length > 20) {
      return res.status(400).json({ error: 'Invalid player name' });
    }
    
    const entry = {
      id: nextId++,
      playerName,
      score,
      mode,
      createdAt: new Date(),
    };
    
    leaderboard.push(entry);
    return res.status(201).json(entry);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Step 3: Update Vercel Configuration

Update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

**Note**: WebSocket multiplayer will NOT work with this approach because Vercel Serverless Functions don't support persistent WebSocket connections.

## Option 3: Full-Stack Deployment (Recommended)

For full functionality including multiplayer, deploy to a platform that supports Node.js servers:

### Recommended Platforms

1. **Replit** (Current setup) - Already configured in `.replit`
2. **Railway** - Easy Node.js deployment
3. **Render** - Free tier available
4. **Fly.io** - Global edge deployment
5. **DigitalOcean App Platform** - Simple container deployment

### Deploy Commands for These Platforms

```bash
# Build command
npm run build

# Start command
npm start

# Or directly
node dist/index.cjs
```

### Environment Variables

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string (optional, uses in-memory storage if not set)
- `NODE_ENV` - Set to `production` for production builds

## Option 4: Split Deployment (Frontend + Backend)

Deploy frontend to Vercel and backend to a separate platform.

### Step 1: Deploy Backend Separately

Deploy the backend to Railway, Render, or similar:

```bash
# On your backend platform
npm install
npm run build
npm start
```

Note your backend URL (e.g., `https://your-pong-api.railway.app`)

### Step 2: Configure Frontend API URL

Update `client/src/lib/queryClient.ts` to use an environment variable:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
```

Then update API calls to use this base URL.

### Step 3: Set Environment Variables in Vercel

Add `VITE_API_URL` environment variable in Vercel dashboard:
```
VITE_API_URL=https://your-pong-api.railway.app
```

### Step 4: Handle CORS

Update `server/index.ts` to allow cross-origin requests:

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

## Quick Start: Vercel CLI

If you have the Vercel CLI installed:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Build Fails with Module Errors

Ensure all dependencies are in `dependencies` (not `devDependencies`) that are needed at runtime.

### API Calls Fail

The game works offline without the backend. If you see network errors in console, that's expected for frontend-only deployment.

### Styles Look Wrong

Make sure Tailwind CSS is building correctly. Check that `postcss.config.js` and `tailwind.config.ts` are in the project root.

### Fonts Not Loading

The "Press Start 2P" font is loaded from Google Fonts in `client/index.html`. This should work on any deployment.

## Summary

| Deployment Type | Complexity | Features | Best For |
|-----------------|------------|----------|----------|
| Frontend-only Vercel | Easy | Single player only | Quick demo |
| Vercel + Serverless | Medium | + Leaderboard | Casual sharing |
| Full-stack (Railway, etc.) | Medium | All features | Full experience |
| Split (Vercel + backend) | Complex | All features | Production scale |

For the simplest deployment with all features, use **Replit** (already configured) or **Railway**.

For just a quick frontend demo, push to GitHub and import into Vercel - it will work for single-player immediately!
