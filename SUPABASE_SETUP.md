# Supabase Database Setup Guide

Quick guide to set up Supabase PostgreSQL for persistent leaderboard storage.

## Why Supabase?

- **Free Forever**: 500MB database with no expiration
- **Better than Render PostgreSQL**: No 90-day limit
- **Easy Setup**: 5 minutes to configure
- **Reliable**: Built on PostgreSQL with automatic backups
- **Fast**: Connection pooling and optimized queries

## Setup Steps

### 1. Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### 2. Create New Project

1. Click "New Project"
2. Choose or create an organization
3. Configure project:
   - **Name**: `neon-pong` (or your preferred name)
   - **Database Password**: Click "Generate password" (save this!)
   - **Region**: Choose closest to your backend (e.g., US East for Render US)
   - **Pricing Plan**: Free tier is selected by default
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### 3. Get Connection String

1. In your Supabase project dashboard:
   - Click "Project Settings" (gear icon)
   - Navigate to "Database" in the sidebar
2. Scroll to "Connection string" section
3. Select "URI" tab
4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
5. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

### 4. Configure Render Backend

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your `neon-pong-backend` web service
3. Navigate to "Environment" tab
4. Add or update environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string (with password filled in)
5. Click "Save Changes"
6. Render will automatically redeploy with new database connection

### 5. Initialize Database Schema

**Option A: Using local npm command (recommended)**

```bash
# In your local repository directory
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres" npm run db:push
```

This creates the required tables (`users`, leaderboard structure).

**Option B: Let backend auto-initialize**

The backend can automatically create tables on first run if Drizzle is configured for migrations. Check Render logs after deployment to verify.

### 6. Verify Setup

1. **In Supabase Dashboard**:
   - Go to "Table Editor" (database icon)
   - You should see tables created by Drizzle ORM
   - Look for `users` table

2. **Test from your app**:
   - Visit your deployed frontend
   - Play a game and submit a score
   - Check Supabase Table Editor to see the entry

3. **Check Render Logs**:
   ```
   Look for: "Database connected successfully"
   ```

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?[options]
```

Example:
```
postgresql://postgres:mySecureP@ssw0rd@db.abcdefghijk.supabase.co:5432/postgres
```

**Components**:
- `postgres`: Default Supabase username
- `mySecureP@ssw0rd`: Your database password
- `db.abcdefghijk.supabase.co`: Your Supabase database host
- `5432`: PostgreSQL default port
- `postgres`: Default database name

## Connection Pooling (Optional but Recommended)

For better performance under load, use Supabase's connection pooler:

1. In Supabase Project Settings → Database
2. Find "Connection pooling" section
3. Copy the "Transaction" mode connection string
4. Use this instead of the direct connection string
5. Format: `postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

**Benefits**:
- Handles more concurrent connections
- Better performance under load
- Recommended for production

## Environment Variables Summary

Add to Render:

```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
```

Or with connection pooling:

```bash
DATABASE_URL=postgresql://postgres.xxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Troubleshooting

### "Connection refused" or "Can't connect"

1. **Check password**: Ensure `[YOUR-PASSWORD]` is replaced with actual password
2. **Check IP whitelist**: Supabase may require IP whitelisting
   - Project Settings → Database → Connection pooling
   - Add Render's IP addresses if needed (usually not required)
3. **Check SSL**: Supabase requires SSL connections (handled by Drizzle automatically)

### "Database tables not found"

1. Run `npm run db:push` locally with DATABASE_URL
2. Check Render logs for migration errors
3. Verify schema exists in Supabase Table Editor

### "Too many connections"

1. Use connection pooling (see section above)
2. Reduce concurrent connections in application
3. Consider upgrading Supabase plan if needed

### Backend still using in-memory storage

1. Verify `DATABASE_URL` is set in Render environment variables
2. Check Render logs for connection errors
3. Ensure backend redeployed after adding DATABASE_URL

## Security Best Practices

1. **Never commit passwords**: Use environment variables only
2. **Use strong passwords**: At least 20 characters with special chars
3. **Rotate passwords**: Change database password periodically
4. **Enable Row Level Security**: For additional table protection
5. **Monitor usage**: Check Supabase dashboard for unusual activity

## Monitoring

### Supabase Dashboard

- **Database Health**: Project home → Database section
- **Table Data**: Table Editor → View/edit data
- **Logs**: Logs Explorer → Query database logs
- **Performance**: Reports → Database statistics

### Render Logs

```bash
# Check connection status
grep "Database" logs

# Check queries
grep "SELECT\|INSERT\|UPDATE" logs
```

## Cost and Limits

### Free Tier Includes:
- 500MB database storage
- 2GB transfer per month
- Up to 100MB file storage
- Unlimited API requests
- No time limit (free forever)

### When to Upgrade:
- Need more than 500MB storage
- High traffic exceeding transfer limits
- Need point-in-time recovery
- Want priority support

**Pro Plan**: Starting at $25/month
- 8GB storage
- 250GB transfer
- Daily backups
- Better performance

## Migration from Render PostgreSQL

If you're migrating from Render's free PostgreSQL:

1. **Export data from Render**:
   ```bash
   pg_dump $RENDER_DATABASE_URL > backup.sql
   ```

2. **Import to Supabase**:
   - In Supabase Dashboard → SQL Editor
   - Paste and run backup.sql content
   - Or use command line:
   ```bash
   psql $SUPABASE_DATABASE_URL < backup.sql
   ```

3. **Update Render environment**:
   - Replace DATABASE_URL with Supabase connection string
   - Redeploy

## Additional Resources

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL Docs**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **Drizzle ORM Docs**: [https://orm.drizzle.team](https://orm.drizzle.team)

## Support

- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **Supabase GitHub**: [https://github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Community Forum**: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
