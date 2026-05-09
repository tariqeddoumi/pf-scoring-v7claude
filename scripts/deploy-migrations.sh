#!/bin/bash
# Deploy Prisma migrations to database
# Usage: npm run migrate:deploy
# Or manually: bash scripts/deploy-migrations.sh

set -e

echo "🚀 Starting database migration deployment..."

# Check if environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "❌ ERROR: DATABASE_URL and DIRECT_URL environment variables must be set"
  exit 1
fi

# Optional: Check JWT secrets for production
if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$JWT_SECRET" ] && [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo "⚠️  WARNING: Neither JWT_SECRET nor SUPABASE_JWT_SECRET is set in production"
    echo "    This may cause API authentication issues"
  fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install --production
fi

echo "🔍 Checking migration status..."
npx prisma migrate status

echo ""
echo "🗂️  Deploying migrations..."
if npx prisma migrate deploy; then
  echo "✅ Migrations deployed successfully!"

  # Optional: Verify migrations
  if command -v psql &> /dev/null; then
    echo ""
    echo "📊 Verifying migration history..."
    psql "$DATABASE_URL" -c "SELECT id, checksum, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
  fi
else
  echo "❌ Migration deployment failed"
  exit 1
fi

echo ""
echo "🎉 Database migration deployment complete!"
