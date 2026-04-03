# PF Scoring V7++ - Implementation & Testing Guide

**Status**: ✅ **READY FOR TESTING & DEPLOYMENT**

**Last Updated**: April 3, 2026  
**Version**: 1.0 Complete

---

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Verify everything works
npm run type-check    # TypeScript: ✅
npm run build         # Build: ✅
npm run lint          # ESLint: ✅ (minor warnings OK)

# 3. Run local dev server
npm run dev

# 4. Test API (new terminal)
curl http://localhost:3000/api/evaluations/test-001/score/calculate \
  -X POST -H "Content-Type: application/json" \
  -d '{"projectData": {"projectId": "test", "projectName": "Test"}, "analystName": "Test"}'
```

---

## Part 1: Local Development Setup

### 1.1 Prerequisites

```bash
# Required:
- Node.js 18+ (check: node --version)
- npm 9+ (check: npm --version)
- Git (check: git --version)

# Optional but recommended:
- Docker (for containerized testing)
- Postman (for API testing)
- PostgreSQL client (psql) for database inspection
```

### 1.2 Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd pf-scoring-v7claude

# Install dependencies
npm install

# Verify installation
npm ls | head -20
```

### 1.3 Environment Setup (Local Development)

Create `.env.local`:

```bash
# Database (optional for local dev - use mock data)
DATABASE_URL="postgresql://postgres:password@localhost:5432/pf_scoring"

# Optional: Supabase (for testing with real DB)
SUPABASE_URL="https://[project].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# Application
NODE_ENV="development"
DEBUG_SCORING="true"  # Enable debug logging
```

### 1.4 Start Development Server

```bash
npm run dev

# Output:
# ▲ Next.js 15.5.14
# - ready started server on 0.0.0.0:3000
# - event compiled client and server successfully
```

### 1.5 Verify API Works

**Terminal 1**: Keep dev server running  
**Terminal 2**: Test API

```bash
# Simple health check
curl http://localhost:3000/api/health

# Test scoring calculation
curl -X POST http://localhost:3000/api/evaluations/eval-001/score/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "projectData": {
      "projectId": "proj-test-001",
      "projectName": "Test Project",
      "sector": "Energy",
      "projectFundamentals": {
        "projectCost": 10000000,
        "technologyMaturity": 8
      },
      "hostCountry": {
        "country": "Morocco",
        "countryRating": "BBB",
        "politicalRisk": "LOW"
      }
    },
    "analystName": "Test Analyst"
  }'

# Expected response: 200 OK with ScoringResult
```

---

## Part 2: Testing (Local)

### 2.1 Unit Tests

```bash
# Run unit tests only
npm run test:unit

# Output:
# PASS  __tests__/unit/scoring-engine.test.ts
# PASS  __tests__/unit/rules-engine.test.ts
# Test Suites: 2 passed, 2 total
# Tests: 20 passed, 20 total
```

### 2.2 Integration Tests

**Requires dev server running:**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run integration tests
npm run test:integration

# Output:
# PASS  __tests__/integration/api-endpoints.test.ts
# Test Suites: 1 passed, 1 total
# Tests: 7 passed, 7 total
```

### 2.3 Full Test Suite with Coverage

```bash
npm run test:coverage

# Output includes:
# - Line coverage
# - Branch coverage
# - Function coverage
# - Statement coverage
```

### 2.4 Watch Mode (Development)

```bash
# Auto-rerun tests on file changes
npm run test:watch

# Type 'a' to run all tests
# Type 'p' to filter by filename
# Type 'q' to quit
```

### 2.5 Test Solar Maroc Case Study

```bash
# The Solar Maroc fixture is in: __tests__/fixtures/solar-maroc-case.ts
# Expected result: A rating, score ~8.08

# Run tests with verbose output
npm test -- --verbose

# Look for: "Solar Maroc case study" tests passing
```

---

## Part 3: Deployment Options

### Option A: Local Production (Docker)

**Benefits**: Full control, no external dependencies  
**Time**: 20 minutes setup

#### Step 1: Install Docker

```bash
# macOS:
brew install docker

# Linux:
sudo apt-get install docker.io

# Verify:
docker --version
```

#### Step 2: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### Step 3: Create docker-compose.yml

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pf_scoring
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Step 4: Run Locally

```bash
# Build and start
docker-compose up --build

# App available at: http://localhost:3000

# Stop
docker-compose down
```

---

### Option B: Vercel Deployment (Recommended)

**Benefits**: Automatic deployments, global CDN, zero-config  
**Time**: 10 minutes setup

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Select:
# - Link to existing project? No
# - Project name: pf-scoring-v7
# - Framework: Next.js
# - Build command: npm run build ✓
```

#### Step 3: Configure Environment Variables

**In Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add:
   - `DATABASE_URL` = PostgreSQL connection string
   - `SUPABASE_URL` = https://[project].supabase.co
   - `SUPABASE_ANON_KEY` = [anon-key]
   - `JWT_SECRET` = [your-secret]

#### Step 4: Verify Deployment

```bash
# Check deployment
vercel ls

# Test deployed API
curl https://pf-scoring-v7.vercel.app/api/evaluations/test/score/calculate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{...}'

# View logs
vercel logs
```

---

### Option C: Supabase Backend Setup

**Required for database persistence**

#### Step 1: Create Supabase Project

```bash
# At https://supabase.com
1. Create new project
2. Choose region (us-east-1 recommended)
3. Wait for initialization (2-3 minutes)
```

#### Step 2: Get Connection Details

```bash
# From Supabase Dashboard → Settings → Database

# Copy:
DATABASE_URL=postgresql://postgres:[password]@[project].supabase.co:5432/postgres
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

#### Step 3: Create Database Schema

```bash
# Set DATABASE_URL in .env.local

# Push Prisma schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Verify schema created
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

#### Step 4: Test Database Connection

```bash
# Add to lib/test-db.ts:
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const result = await prisma.evaluation.findMany();
  console.log('✅ Database connected:', result.length, 'evaluations');
  await prisma.$disconnect();
}

test();

# Run: npx ts-node lib/test-db.ts
```

---

### Option D: GitHub Actions (CI/CD Pipeline)

**Automatic testing & deployment on push**

#### Step 1: Create Workflow File

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod
```

#### Step 2: Add GitHub Secrets

```bash
# In GitHub repo → Settings → Secrets and variables → Actions
# Add:
# - VERCEL_TOKEN (from https://vercel.com/account/tokens)
# - VERCEL_ORG_ID
# - VERCEL_PROJECT_ID
```

#### Step 3: Verify Workflow

```bash
# Push to main
git push origin main

# Check workflow at: GitHub → Actions
# Should see: ✅ Deploy workflow passing
```

---

## Part 4: Platform-Specific Guides

### 🐧 Linux Deployment

```bash
# System dependencies
sudo apt update && sudo apt install -y nodejs npm postgresql-client

# Install app
git clone <repo>
cd pf-scoring-v7claude
npm install
npm run build

# Create systemd service
sudo tee /etc/systemd/system/pf-scoring.service <<EOF
[Unit]
Description=PF Scoring V7++
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/app/pf-scoring-v7claude
Environment="NODE_ENV=production"
Environment="DATABASE_URL=..."
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl start pf-scoring
sudo systemctl enable pf-scoring

# Check status
sudo systemctl status pf-scoring
```

### 🍎 macOS Deployment

```bash
# Install with Homebrew
brew install node@18
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Run app
npm install && npm run build
npm start

# Access at http://localhost:3000
```

### 🪟 Windows Deployment

```powershell
# Install Node.js from https://nodejs.org
# Install PostgreSQL from https://postgresql.org

# Clone repository
git clone <repo>
cd pf-scoring-v7claude

# Install & run
npm install
npm run build
npm start

# Access at http://localhost:3000
```

---

## Part 5: Production Checklist

Before deploying to production:

### Pre-Deployment

- [ ] All tests pass: `npm test`
- [ ] TypeScript: `npm run type-check` (0 errors)
- [ ] Linting: `npm run lint` (check warnings)
- [ ] Build: `npm run build` (succeeds)
- [ ] Environment variables set in .env.local (local) or Vercel Dashboard (production)
- [ ] Database connection verified: `npx prisma db push`
- [ ] API endpoints tested with curl or Postman

### Deployment

- [ ] Database schema migrated: `npx prisma migrate deploy`
- [ ] Application deployed (Vercel/Docker/Local)
- [ ] Environment variables configured on platform
- [ ] Health check passes: `curl https://.../api/health`
- [ ] API endpoints respond correctly

### Post-Deployment

- [ ] Monitor application logs
- [ ] Test with Solar Maroc case study
- [ ] Verify audit logs are recording
- [ ] Set up monitoring/alerting
- [ ] Document deployment details
- [ ] Create backup of database

---

## Part 6: Testing Workflows

### Local Development Workflow

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Watch tests
npm run test:watch

# Make changes to code
# Tests auto-run
# Dev server auto-reloads
```

### Before Commit

```bash
npm run type-check  # TypeScript
npm run lint        # ESLint
npm test            # All tests
npm run build       # Next.js build
```

### API Testing with Curl

```bash
# Export for reuse
EVAL_ID="eval-test-$(date +%s)"
BASE_URL="http://localhost:3000/api"

# 1. Score calculation
curl -X POST $BASE_URL/evaluations/$EVAL_ID/score/calculate \
  -H "Content-Type: application/json" \
  -d @payload.json

# 2. Stress testing
curl -X POST $BASE_URL/evaluations/$EVAL_ID/stress-test \
  -H "Content-Type: application/json" \
  -d '{
    "evaluationId": "'$EVAL_ID'",
    "scenarios": ["REVENUE_DECLINE_10", "COST_INFLATION_5"]
  }'

# 3. Report retrieval
curl $BASE_URL/evaluations/$EVAL_ID/report
```

### Using Postman

1. Import collection from project
2. Set environment variables (base_url, eval_id)
3. Test endpoints in order
4. View response schemas

---

## Part 7: Troubleshooting

### "Cannot find module" Errors

```bash
# Solution
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors

```bash
# Check specific errors
npm run type-check

# Fix issues manually or:
npx tsc --noEmit --listFilesOnly
```

### Database Connection Failed

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma
npx prisma db validate
npx prisma db push
```

### Tests Failing

```bash
# Run with verbose output
npm test -- --verbose

# Run specific test file
npm test -- __tests__/unit/scoring-engine.test.ts

# Check for mocking issues
npm test -- --no-coverage
```

---

## Part 8: Performance Tuning

### Local Development

```bash
# Faster builds
NEXT_PUBLIC_SKIP_ENV_VALIDATION=true npm run dev

# Parallel testing
npm test -- --workers=4
```

### Production

```bash
# Enable caching
DATABASE_QUERY_CACHE=1 npm start

# Monitor performance
# In Vercel Dashboard: Analytics → Performance
```

---

## Summary

✅ **Everything is ready!**

| Environment | Status | Time | Guide |
|---|---|---|---|
| Local Dev | ✅ Ready | 5 min | 1.2-1.5 |
| Local Testing | ✅ Ready | 5 min | 2.1-2.5 |
| Docker | ✅ Ready | 20 min | 3.A |
| Vercel | ✅ Ready | 10 min | 3.B |
| Supabase | ✅ Ready | 15 min | 3.C |
| CI/CD | ✅ Ready | 10 min | 3.D |

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run test            # Run all tests
npm run test:watch     # Watch tests

# Quality
npm run type-check     # TypeScript
npm run lint           # ESLint
npm run format         # Prettier

# Build & Deploy
npm run build          # Next.js build
npm start              # Start production

# Database
npx prisma generate   # Generate client
npx prisma db push    # Push schema
npx prisma db seed    # Seed data
```

---

**🎯 Ready to test and deploy!**

Start with **Part 1** for local development, then choose your deployment option from **Part 3**.

For questions, see **DEPLOYMENT_GUIDE.md** and **DEVELOPER_GUIDE.md**.
