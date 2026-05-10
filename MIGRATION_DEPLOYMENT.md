# Database Migration Deployment Guide

This guide explains how to deploy Prisma migrations to your Supabase database on both Vercel and Hostinger.

## Prerequisites

- `DATABASE_URL` and `DIRECT_URL` environment variables configured
- `npx prisma` available in your environment

## Option 1: Local Deployment (Recommended for Development)

### Step 1: Configure Environment Variables Locally

```bash
# Create or update your .env.local file
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

### Step 2: Run Migrations Locally

```bash
# Install dependencies if not already done
npm install

# Deploy all pending migrations to Supabase
npx prisma migrate deploy

# Verify the migration was successful
npx prisma db push --skip-generate
```

## Option 2: Vercel Deployment

### Step 1: Ensure Environment Variables Are Set in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/verify these variables are set:
   - `DATABASE_URL` (with pooler connection for serverless)
   - `DIRECT_URL` (direct connection for migrations)
   - `NODE_ENV` (set to `production`)
   - `JWT_SECRET` (your JWT secret)
   - `SUPABASE_JWT_SECRET` (your Supabase JWT secret, optional but recommended)

### Step 2: Deploy via Git Push

The next time you push to your branch, Vercel will:
1. Build your application
2. Automatically generate Prisma Client
3. During deployment, migrations can be run via the `/api/admin/migrate` endpoint

### Step 3: Trigger Migrations (Optional Manual Method)

If you have the migration endpoint enabled:

```bash
curl -X POST https://your-app.vercel.app/api/admin/migrate \
  -H "x-admin-token: YOUR_ADMIN_MIGRATE_TOKEN" \
  -H "Content-Type: application/json"
```

## Option 3: Hostinger Deployment

### Step 1: SSH into Your Hostinger Server

```bash
ssh user@your-hostinger-server.com
cd /path/to/your/project
```

### Step 2: Configure Environment Variables

Create or update `.env` file on the server:

```bash
# Via nano editor
nano .env

# Or via heredoc
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
JWT_SECRET=your-jwt-secret
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
EOF
```

### Step 3: Install Dependencies and Run Migrations

```bash
# Navigate to project directory
cd /path/to/your/project

# Install or update dependencies
npm install --production

# Run pending migrations
npx prisma migrate deploy

# Verify success
npx prisma db push --skip-generate
```

### Step 4: Restart Your Application

```bash
# If using PM2
pm2 restart your-app-name

# If using systemd
sudo systemctl restart your-app-service

# If using Node directly, kill and restart the process
pkill -f "node.*server.js"
npm start &
```

## Troubleshooting

### Error: "FATAL: JWT_SECRET ou SUPABASE_JWT_SECRET doit être défini"

**Solution:** Ensure both environment variables are set before running migrations:

```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export JWT_SECRET="your-secret-key-min-32-chars"
npx prisma migrate deploy
```

### Error: "Cannot connect to database"

1. Verify `DATABASE_URL` and `DIRECT_URL` are correct
2. Check that your Supabase database is running
3. Ensure your IP is whitelisted in Supabase (or use public URL)
4. Test connection:
   ```bash
   npx prisma db execute --stdin << 'SQL'
   SELECT 1;
   SQL
   ```

### Error: "Migration can only be run in production"

The `/api/admin/migrate` endpoint only works in production. For development:

```bash
NODE_ENV=development npx prisma migrate deploy
```

## Verifying Migrations

After deployment, verify migrations were applied:

```bash
# List all migrations and their status
npx prisma migrate status

# Test database connection
npx prisma db execute --stdin << 'SQL'
SELECT COUNT(*) as migration_count FROM _prisma_migrations;
SQL
```

## Automatic Migrations on Deploy

For automatic migrations on Vercel, add to your `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postbuild": "prisma migrate deploy || true"
  }
}
```

Or create a Vercel build hook in `vercel.json`:

```json
{
  "buildCommand": "npm run build && npx prisma migrate deploy"
}
```

## Safety Checklist

- [ ] Backup your database before deploying migrations
- [ ] Test migrations in a staging environment first
- [ ] Have a rollback plan if migration fails
- [ ] Monitor application logs after migration
- [ ] Verify all API endpoints are working

## Next Steps

1. Run migrations to update your database schema
2. Verify `/api/clients` endpoint returns data
3. Test login and dashboard functionality
4. Monitor server logs for any errors
