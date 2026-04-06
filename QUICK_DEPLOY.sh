#!/bin/bash
# ⚡ QUICK DEPLOY - 20 minutes pour être live!

echo "🚀 PF SCORING DEPLOYMENT"
echo "========================"
echo ""

# Step 1
echo "✅ STEP 1: Supabase Setup"
echo "Go to: https://supabase.com"
echo "Create new project → copy credentials"
echo ""
read -p "Ready? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

# Step 2
echo ""
echo "✅ STEP 2: Environment Variables"
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Created .env.local - edit it with your Supabase credentials"
else
    echo ".env.local exists"
fi
echo ""
read -p "Credentials set? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

# Step 3
echo ""
echo "✅ STEP 3: Database Setup"
echo "In Supabase SQL Editor:"
echo "1. New Query"
echo "2. Paste content from database/schema.sql"
echo "3. Execute"
echo ""
read -p "Schema applied? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi

# Step 4
echo ""
echo "✅ STEP 4: Build & Test"
npm install
npm run build
echo "✓ Build successful"
echo ""

# Step 5
echo "✅ STEP 5: Deploy to Vercel"
if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi
vercel deploy --prod

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your app is live!"
