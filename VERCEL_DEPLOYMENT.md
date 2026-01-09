# Vercel Deployment Guide

## Overview

This guide explains how to deploy the Neon Pong frontend to Vercel. The game will work in single-player mode with local leaderboard storage. **Note: Multiplayer features require a backend server and will not work in frontend-only Vercel deployments.**

## Quick Deploy

### Option 1: Using Vercel Dashboard

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository: `mikejmckinney/pong-replit`
4. Vercel will automatically detect the `vercel.json` configuration
5. Click "Deploy"

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from the repository root
vercel

# For production deployment
vercel --prod
```

## Configuration

The repository includes a `vercel.json` file with the following configuration:

- **Build Command**: `npm run build` (builds the Vite frontend)
- **Output Directory**: `dist/public` (where Vite outputs the built files)
- **Framework**: None (manual configuration)
- **Rewrites**: All routes redirect to `/index.html` for client-side routing
- **Headers**: Cache assets in `/assets/` for 1 year (immutable)

## What Works

✅ **Single-player game modes:**
- Classic mode (first to 11 points)
- Arcade mode (with power-ups)
- Time Attack mode (60-second challenge)
- Chaos mode (multi-ball)
- Zen mode (practice)

✅ **Local features:**
- AI opponent gameplay
- Touch and keyboard controls
- Settings persistence (localStorage)
- Local leaderboard (localStorage)
- Sound effects
- Pause/resume functionality

## What Doesn't Work (Frontend-Only Deployment)

❌ **Multiplayer mode**: Requires WebSocket server (not available in static hosting)
❌ **Server leaderboard**: API endpoints not available (uses localStorage fallback)
❌ **Cross-device leaderboard sync**: Requires backend database

## Build Details

The build process:
1. Runs `npm run build` which executes `tsx script/build.ts`
2. Builds the client with Vite → outputs to `dist/public/`
3. Builds the server with esbuild → `dist/index.cjs` (not used by Vercel)
4. Vercel serves the static files from `dist/public/`

Expected build output:
- `dist/public/index.html` (~1KB)
- `dist/public/assets/index-[hash].js` (~385KB)
- `dist/public/assets/index-[hash].css` (~73KB)
- `dist/public/favicon.png`

## Troubleshooting

### 404 Error on Vercel

If you see a 404 error, ensure:
1. The `vercel.json` file exists in the repository root
2. The build command successfully creates `dist/public/index.html`
3. The output directory is set to `dist/public` in Vercel settings

### Build Fails

Common issues:
- **Missing dependencies**: Vercel runs `npm install` automatically, but ensure `package.json` is up to date
- **Build timeout**: The build typically takes 30-60 seconds; Vercel's free tier allows up to 45 minutes
- **PostCSS warning**: The warning about `from` option is expected and harmless

### Game Won't Load

Check the browser console:
- API errors for leaderboard are expected (will use localStorage)
- WebSocket connection errors for multiplayer are expected
- Other errors may indicate build or asset loading issues

## Environment Variables

No environment variables are required for frontend-only deployment. The game works entirely client-side with localStorage.

## Full-Stack Deployment (Replit)

For full functionality including multiplayer and server leaderboard, deploy the complete application to Replit:

1. Import the repository to Replit
2. Set `DATABASE_URL` environment variable (optional)
3. Replit will automatically run the build and start commands
4. The app runs on port 5000 with both frontend and backend

See `.replit` for the Replit deployment configuration.

## Custom Domain

To use a custom domain with Vercel:
1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS records

## Performance

The frontend-only deployment benefits from:
- Vercel's global CDN for fast asset delivery
- Automatic compression (Gzip/Brotli)
- Edge caching for static assets
- HTTP/2 support

Expected load times:
- First contentful paint: < 1 second
- Time to interactive: < 2 seconds
- (On typical broadband/4G connections)

## Support

For issues specific to:
- **Vercel deployment**: Check [Vercel documentation](https://vercel.com/docs)
- **Game functionality**: Open an issue on the GitHub repository
- **Full-stack deployment**: See `readme.md` for Replit instructions
