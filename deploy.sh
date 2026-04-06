#!/bin/bash

# 🚀 PF Scoring V7++ - Deployment Script

set -e

echo "📦 Starting deployment process..."

# ============================================
# STEP 1: Supabase Setup
# ============================================
echo ""
echo "1️⃣  SUPABASE SETUP"
echo "================================"
echo "✓ Go to: https://supabase.com"
echo "✓ Create new project"
echo "✓ Copy these credentials:"
echo "  - Project URL"
echo "  - Anon Key"
echo "  - Service Role Key"
echo ""
read -p "Press enter when credentials are ready..."

# ============================================
# STEP 2: Create .env.local
# ============================================
echo ""
echo "2️⃣  ENVIRONMENT VARIABLES"
echo "================================"

if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✓ Created .env.local"
else
    echo "✓ .env.local exists"
fi

echo ""
echo "📝 Update .env.local with your Supabase credentials:"
echo "   NEXT_PUBLIC_SUPABASE_URL=<your-url>"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
echo "   SUPABASE_SERVICE_ROLE_KEY=<your-service-key>"
echo ""
read -p "Press enter when .env.local is updated..."

# ============================================
# STEP 3: Setup Database
# ============================================
echo ""
echo "3️⃣  DATABASE SETUP"
echo "================================"
echo "✓ In Supabase Dashboard:"
echo "  1. Go to SQL Editor"
echo "  2. Create new query"
echo "  3. Copy content from: database/schema.sql"
echo "  4. Execute the full script"
echo ""
read -p "Press enter when database schema is applied..."

# ============================================
# STEP 4: Test Locally
# ============================================
echo ""
echo "4️⃣  LOCAL TESTING"
echo "================================"
npm install
npm run build

echo "✓ Build successful"
echo ""
echo "Test API locally:"
echo "  npm run dev"
echo "  curl http://localhost:3000/api/evaluations"
echo ""
read -p "Press enter when local tests pass..."

# ============================================
# STEP 5: Deploy to Vercel
# ============================================
echo ""
echo "5️⃣  VERCEL DEPLOYMENT"
echo "================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo "Deploying to Vercel..."
vercel deploy --prod

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Test production URL"
echo "3. Monitor deployment logs"
