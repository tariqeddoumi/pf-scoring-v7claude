#!/bin/bash

# Script: Seed PF_V7PP Scoring Model
# Purpose: Insert the PF_V7PP model with all domains, criteria, and options
# Usage: ./scripts/seed-pf-v7pp.sh

set -e

echo "=========================================="
echo "🌱 PF_V7PP Scoring Model Seeder"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  Warning: .env.local not found"
  echo "Make sure DATABASE_URL is configured in your environment"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Generate Prisma client if needed
echo "🔧 Ensuring Prisma client is up to date..."
npx prisma generate

echo ""
echo "📋 Checking database connection..."
npx prisma db execute --stdin < /dev/null 2>/dev/null || {
  echo "❌ Could not connect to database"
  echo "Please check your DATABASE_URL environment variable"
  exit 1
}

echo "✅ Database connection OK"
echo ""
echo "🚀 Running seed script..."
echo "   This will insert:"
echo "   • 1 Scoring Model (PF_V7PP)"
echo "   • 1 Model Version (Published)"
echo "   • 9 Domains"
echo "   • 28 Criteria"
echo "   • 123 Options"
echo "   • 30 Ranges"
echo ""

# Run the seed
npx prisma db seed

echo ""
echo "=========================================="
echo "✨ Seeding completed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify model: npm run type-check"
echo "2. Start dev server: npm run dev"
echo "3. Visit: http://localhost:3000/evaluations/new"
echo "4. Create an evaluation - all 9 domains should appear"
echo ""
echo "📖 For detailed guide, see: PF_V7PP_SETUP.md"
echo ""
