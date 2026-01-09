# Render Backend Deployment Guide

This guide explains how to deploy the Neon Pong backend to Render, enabling full functionality including multiplayer and server-side leaderboard for your Vercel-hosted frontend.

## Prerequisites

- Render account ([sign up free](https://render.com))
- GitHub repository with this code
- Vercel deployment URL (e.g., `https://pong-replit.vercel.app`)
- (Optional) Supabase account for database ([setup guide](./SUPABASE_SETUP.md))

## Quick Start

**Recommended stack**: Vercel (frontend) + Render (backend) + Supabase (database)

1. Deploy backend to Render (this guide)
2. Set up Supabase database ([SUPABASE_SETUP.md](./SUPABASE_SETUP.md))
3. Configure environment variables
4. Deploy frontend to Vercel ([VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md))

## Deployment Options

### Option 1: Blueprint Deployment (Recommended)

Render can automatically deploy using the `render.yaml` configuration file.

1. **Go to Render Dashboard**
   - Visit [https://dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Blueprint"

2. **Connect Repository**
   - Select your GitHub repository: `mikejmckinney/pong-replit`
   - Render will detect the `render.yaml` file automatically

3. **Configure Environment Variables**
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://pong-replit.vercel.app`)
   - `DATABASE_URL`: (Optional) PostgreSQL connection string
   - `PORT`: Automatically set by Render (default: 10000)
   - `NODE_ENV`: Automatically set to `production`

4. **Deploy**
   - Click "Apply" to create the service
   - Render will build and deploy automatically
   - Wait for deployment to complete (~3-5 minutes)

5. **Get Backend URL**
   - Your backend will be available at: `https://neon-pong-backend.onrender.com`
   - Copy this URL for frontend configuration

### Option 2: Manual Deployment

If you prefer manual setup:

1. **Create New Web Service**
   - Go to Render Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Name**: `neon-pong-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.cjs`
   - **Plan**: Free

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   ALLOWED_ORIGINS=https://pong-replit.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for initial deployment

## Database Setup (Recommended: Supabase)

The backend works without a database using in-memory storage, but for persistent leaderboard across restarts, we recommend **Supabase** (PostgreSQL):

### Why Supabase?

- ✅ **Free tier**: 500MB database, no expiration
- ✅ **Always available**: No 90-day limit like Render's free PostgreSQL
- ✅ **Better performance**: Optimized PostgreSQL with connection pooling
- ✅ **Easy setup**: Simple dashboard and automatic backups
- ✅ **Direct connection**: Works perfectly with Drizzle ORM

### Supabase Setup

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and set:
     - **Name**: `neon-pong`
     - **Database Password**: Generate strong password (save it!)
     - **Region**: Choose closest to your Render backend region
   - Click "Create new project" (takes ~2 minutes)

2. **Get Connection String**
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string (looks like):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
     ```
   - **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

3. **Add to Render**
   - In Render Dashboard → Your web service → Environment
   - Add environment variable:
     - **Key**: `DATABASE_URL`
     - **Value**: Your Supabase connection string
   - Save changes (triggers redeploy)

4. **Push Database Schema**
   
   **Option A: Local push (recommended)**
   ```bash
   # In your local repository
   DATABASE_URL="your-supabase-connection-string" npm run db:push
   ```
   
   **Option B: Let backend auto-create**
   - Backend will automatically create tables on first run
   - Check Render logs to verify: "Database tables created successfully"

5. **Verify Setup**
   - In Supabase Dashboard → Table Editor
   - You should see `users` and `leaderboard` tables (created by Drizzle)
   - Test by submitting a score through your app

### Alternative: Render PostgreSQL

If you prefer Render's built-in database:

1. **Create PostgreSQL Database**
   - In Render Dashboard → "New +" → "PostgreSQL"
   - **Name**: `neon-pong-db`
   - **Plan**: Free (1GB storage, **expires after 90 days**)
   - Click "Create Database"

2. **Connect Database to Web Service**
   - Go to your web service settings
   - Add environment variable:
     - **Key**: `DATABASE_URL`
     - **Value**: Copy "Internal Database URL" from your PostgreSQL instance

3. **Push Database Schema**
   - Same as Supabase option above

**⚠️ Note**: Render's free PostgreSQL expires after 90 days. You'll need to:
- Migrate to Supabase (recommended)
- Upgrade to paid PostgreSQL ($7/month)
- Use in-memory storage only

### Comparison

| Feature | Supabase (Free) | Render PostgreSQL (Free) | In-Memory |
|---------|----------------|-------------------------|-----------|
| **Cost** | Free forever | Free for 90 days | Free |
| **Storage** | 500MB | 1GB | Limited by RAM |
| **Persistence** | ✅ Permanent | ✅ 90 days | ❌ Lost on restart |
| **Connection Pooling** | ✅ Built-in | ❌ Not included | N/A |
| **Backups** | ✅ Automatic | ❌ Manual only | ❌ None |
| **Best for** | Production | Testing | Development |

**Recommendation**: Use Supabase for production deployments.

## Frontend Configuration

Update your Vercel frontend to use the Render backend:

### Option 1: Environment Variable (Recommended)

1. **In Vercel Dashboard**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add new variable:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://neon-pong-backend.onrender.com`
   - Redeploy frontend

2. **Update Frontend Code**
   - Modify `client/src/lib/queryClient.ts` to use environment variable:
   ```typescript
   const API_URL = import.meta.env.VITE_API_URL || '';
   
   export async function apiRequest(
     method: string,
     url: string,
     data?: any
   ) {
     const fullUrl = API_URL + url;
     // ... rest of implementation
   }
   ```

### Option 2: Hardcode Backend URL

Update `client/src/lib/queryClient.ts` and `client/src/components/game/MultiplayerLobby.tsx`:

```typescript
// In queryClient.ts
const API_URL = 'https://neon-pong-backend.onrender.com';

// In MultiplayerLobby.tsx
const protocol = "wss:"; // Always use secure WebSocket
const ws = new WebSocket(`${protocol}//neon-pong-backend.onrender.com/ws`);
```

## CORS Configuration

The backend is configured to accept requests from allowed origins via the `ALLOWED_ORIGINS` environment variable.

**Important**: Update `ALLOWED_ORIGINS` when:
- You change your Vercel domain
- You add a custom domain
- You want to allow localhost for development

Example for multiple origins:
```
ALLOWED_ORIGINS=https://pong-replit.vercel.app,https://custom-domain.com,http://localhost:5173
```

## Health Check

Render will automatically health-check your service at `/api/leaderboard` endpoint. The service is considered healthy when:
- HTTP 200 response is returned
- Response time is < 30 seconds

## Monitoring

### View Logs
- Render Dashboard → Your Service → "Logs" tab
- Real-time logs showing:
  - Server startup
  - API requests
  - WebSocket connections
  - Errors and warnings

### Metrics
- Render Dashboard → Your Service → "Metrics" tab
- Monitor:
  - CPU usage
  - Memory usage
  - Request rate
  - Response time

## Free Tier Limitations

Render's free tier includes:
- **Web Service**: 750 hours/month (enough for 24/7 operation)
- **Cold starts**: Services spin down after 15 minutes of inactivity
- **Startup time**: 30-60 seconds after cold start
- **PostgreSQL**: 1GB storage, expires after 90 days

**Cold Start Impact**:
- First request after inactivity may take 30-60 seconds
- Subsequent requests are fast
- Consider upgrading to paid tier ($7/month) for always-on service

## Testing the Backend

After deployment, test your backend:

### Test Leaderboard API
```bash
# GET leaderboard
curl https://neon-pong-backend.onrender.com/api/leaderboard

# POST new score
curl -X POST https://neon-pong-backend.onrender.com/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{"playerName":"TestPlayer","score":100,"mode":"classic"}'
```

### Test WebSocket
Use a WebSocket client or browser console:
```javascript
const ws = new WebSocket('wss://neon-pong-backend.onrender.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (msg) => console.log('Message:', msg.data);
```

## Troubleshooting

### 503 Service Unavailable
- **Cause**: Service is spinning up from cold start
- **Solution**: Wait 30-60 seconds and retry

### CORS Errors
- **Cause**: Frontend origin not in `ALLOWED_ORIGINS`
- **Solution**: Update `ALLOWED_ORIGINS` environment variable in Render
- **Check**: Browser console for specific origin being blocked

### WebSocket Connection Failed
- **Cause**: Using `ws://` instead of `wss://` for production
- **Solution**: Ensure frontend uses `wss://` protocol for Render backend

### Database Connection Failed
- **Cause**: Invalid `DATABASE_URL` or database not running
- **Solution**: Verify database is active in Render dashboard
- **Fallback**: App works without database using in-memory storage

### Build Fails
- **Cause**: Missing dependencies or TypeScript errors
- **Solution**: Run `npm run check` locally to verify TypeScript
- **Check**: Render build logs for specific error messages

## Architecture Overview

```
┌─────────────────┐         HTTPS/WSS          ┌──────────────────┐
│                 │ ◄───────────────────────► │                  │
│  Vercel         │    API & WebSocket         │  Render          │
│  (Frontend)     │    Requests                │  (Backend)       │
│                 │                            │                  │
└─────────────────┘                            └────────┬─────────┘
                                                        │
                                                        │ SQL
                                                        ▼
                                               ┌──────────────────┐
                                               │  PostgreSQL      │
                                               │  (Optional)      │
                                               └──────────────────┘
```

**Data Flow**:
1. User loads frontend from Vercel
2. Frontend makes API calls to Render backend
3. Backend processes requests and queries database (if configured)
4. Backend sends response back to frontend
5. For multiplayer: WebSocket maintains persistent connection

## Updating the Backend

### Automatic Deploys
If you connected GitHub:
- Push to main branch → Render auto-deploys
- View deployment status in Render dashboard

### Manual Deploys
- Render Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"

## Cost Optimization

**Free Tier Strategy**:
- Use free web service for backend
- Use free PostgreSQL for 90 days, then:
  - Migrate to external database (Supabase, Neon, etc.)
  - Use in-memory storage only
  - Upgrade to paid PostgreSQL ($7/month)

**Paid Upgrade Benefits** ($7/month):
- No cold starts (always-on)
- Faster response times
- 512MB RAM (vs 512MB free)
- Better for multiplayer experience

## Security Considerations

1. **CORS**: Only allow trusted frontend origins
2. **Rate Limiting**: Consider adding rate limiting for production
3. **Database**: Use strong passwords, restrict network access
4. **Environment Variables**: Never commit secrets to repository
5. **HTTPS/WSS**: Always use secure protocols in production

## Support

- **Render Docs**: [https://render.com/docs](https://render.com/docs)
- **Render Status**: [https://status.render.com](https://status.render.com)
- **Community**: [Render Community Forum](https://community.render.com)

## Next Steps

After successful deployment:
1. ✅ Verify backend is accessible at your Render URL
2. ✅ Test API endpoints with curl or Postman
3. ✅ Update frontend environment variables with backend URL
4. ✅ Redeploy frontend on Vercel
5. ✅ Test multiplayer and leaderboard features
6. ✅ Monitor logs for any errors
7. ✅ Consider setting up custom domain
8. ✅ Plan for database persistence (if using PostgreSQL free tier)
