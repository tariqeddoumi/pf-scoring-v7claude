#!/bin/bash

# PF Scoring - Pre-Deployment Verification Script
# Checks all critical components before deploying to Vercel

echo "🚀 PF Scoring Pre-Deployment Check"
echo "=================================="
echo ""

ERRORS=0

# Check Node.js and npm
echo "📦 Checking Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    ERRORS=$((ERRORS+1))
else
    echo "✅ Node.js: $(node --version)"
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    ERRORS=$((ERRORS+1))
else
    echo "✅ npm: $(npm --version)"
fi

# Check dependencies
echo ""
echo "📚 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found - installing..."
    npm install
else
    echo "✅ node_modules directory exists"
fi

# Check required files
echo ""
echo "📄 Checking required files..."
REQUIRED_FILES=(
    "package.json"
    "tsconfig.json"
    ".env.example"
    "next.config.js"
    "prisma/schema.prisma"
    "database/schema.sql"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file not found"
        ERRORS=$((ERRORS+1))
    fi
done

# Check TypeScript compilation
echo ""
echo "🔍 Checking TypeScript compilation..."
if npm run type-check 2>/dev/null; then
    echo "✅ TypeScript compilation successful"
else
    echo "⚠️  TypeScript compilation issues found"
fi

# Check API routes
echo ""
echo "🛣️  Checking API routes..."
API_ROUTES=(
    "app/api/evaluations/route.ts"
    "app/api/projects/route.ts"
    "app/api/clients/route.ts"
    "app/api/users/route.ts"
    "lib/supabase-client.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "$route" ]; then
        echo "✅ $route"
    else
        echo "❌ $route not found"
        ERRORS=$((ERRORS+1))
    fi
done

# Check environment variables template
echo ""
echo "🔐 Checking environment configuration..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" ".env.example"; then
    echo "✅ Supabase configuration template exists"
else
    echo "❌ Supabase configuration missing from .env.example"
    ERRORS=$((ERRORS+1))
fi

# Build check
echo ""
echo "🏗️  Testing production build..."
if npm run build 2>/dev/null; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    ERRORS=$((ERRORS+1))
fi

# Final summary
echo ""
echo "=================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "📋 Deployment Checklist:"
    echo "1. Set environment variables in .env.local"
    echo "2. Create Supabase project"
    echo "3. Execute database/schema.sql in Supabase"
    echo "4. Create Vercel project"
    echo "5. Add environment variables to Vercel"
    echo "6. Deploy with: npm run build && vercel deploy --prod"
    echo ""
    echo "📚 See DEPLOYMENT_READY.md for detailed instructions"
    exit 0
else
    echo "❌ Found $ERRORS error(s). Please fix before deploying."
    echo ""
    echo "Common issues:"
    echo "- Run: npm install"
    echo "- Check .env.local is properly configured"
    echo "- Verify all dependencies are installed"
    exit 1
fi
