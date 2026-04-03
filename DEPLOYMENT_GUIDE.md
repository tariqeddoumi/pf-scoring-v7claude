# PF Scoring V7++ - Deployment Guide

## Quick Start

Deploy to production in 3 steps:

1. **Configure Supabase**
2. **Deploy to Vercel**
3. **Verify and Monitor**

---

## Prerequisites

- Supabase account (PostgreSQL database)
- Vercel account (connected to GitHub)
- Environment variables configured

---

## Part 1: Supabase Setup

### 1.1 Create Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create new project
supabase projects create --name "pf-scoring-v7" --region us-east-1
```

### 1.2 Database Schema

```bash
# Initialize Prisma
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

### 1.3 Environment Variables

Create `.env.local` with Supabase credentials:

```bash
# From Supabase project settings
DATABASE_URL="postgresql://postgres:[password]@[project].supabase.co:5432/postgres"

# From Supabase API settings
SUPABASE_URL="https://[project].supabase.co"
SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# Authentication
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRY="7d"

# Optional: Rate limiting
REDIS_URL="redis://..."
```

### 1.4 Enable RLS (Row Level Security)

```sql
-- For Evaluation table
ALTER TABLE pf_scoring_v7pp_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evaluations"
  ON pf_scoring_v7pp_evaluations
  FOR SELECT
  USING (analyst_id = auth.uid());

CREATE POLICY "Users can insert their own evaluations"
  ON pf_scoring_v7pp_evaluations
  FOR INSERT
  WITH CHECK (analyst_id = auth.uid());
```

### 1.5 Seed Initial Data (Optional)

```bash
# Create seed file
npx prisma db seed
```

---

## Part 2: Vercel Deployment

### 2.1 Connect Repository

```bash
# Link to Vercel
vercel link

# Select organization and project
# Configure to use production branch (main)
```

### 2.2 Configure Environment Variables in Vercel

In Vercel dashboard → Settings → Environment Variables:

```
DATABASE_URL = postgresql://...
SUPABASE_URL = https://...
SUPABASE_ANON_KEY = ...
SUPABASE_SERVICE_ROLE_KEY = ...
JWT_SECRET = ...
```

### 2.3 Deploy

```bash
# Option 1: Git push (auto-deploys)
git push origin main

# Option 2: Manual deploy
vercel --prod

# Option 3: From Vercel Dashboard
# Settings → Git → Deployments → Deploy
```

### 2.4 Build Configuration

Vercel automatically detects Next.js. Confirm in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## Part 3: Database Migrations

### 3.1 Run Migrations

```bash
# Before first production deployment
npx prisma migrate deploy

# Verify schema
npx prisma db push --skip-generate
```

### 3.2 Backup Strategy

```bash
# Create backup before migration
supabase db pull

# Store backup safely
git commit -m "Backup before migration"
```

---

## Part 4: Verification

### 4.1 Health Check

```bash
curl https://your-app.vercel.app/api/health
# Should return: { "status": "ok" }
```

### 4.2 Test Scoring API

```bash
# Create test evaluation
curl -X POST https://your-app.vercel.app/api/evaluations/test-001/score/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "projectData": { /* test data */ },
    "analystName": "Test User"
  }'
```

### 4.3 Verify Database Connection

```bash
# Check Prisma client initialization
npx prisma validate
```

### 4.4 Monitor Logs

**Vercel Dashboard:**
- Deployments → Production → Logs
- Functions → Runtime Logs

**Supabase Dashboard:**
- Database → Query Performance
- Auth → Events

---

## Part 5: Monitoring & Maintenance

### 5.1 Set Up Alerts

**Vercel:**
- Failed deployments → Email alert
- High memory usage → Slack notification

**Supabase:**
- Database size > 5GB
- Connection pool exhaustion
- Query performance degradation

### 5.2 Performance Monitoring

```typescript
// Add to API endpoints
console.time("scoring-calculation");
const result = engine.calculateGlobalScore(...);
console.timeEnd("scoring-calculation");
```

### 5.3 Database Maintenance

```bash
# Weekly: Analyze query performance
supabase projects analyze-database

# Monthly: Vacuum tables
supabase db clean

# Quarterly: Backup verification
supabase backups list
```

### 5.4 Scaling Considerations

| Metric | Threshold | Action |
|--------|-----------|--------|
| Database size | 10GB | Archive old evaluations |
| Concurrent connections | 80% | Upgrade instance |
| API latency | >1s | Cache results |
| Error rate | >1% | Investigate logs |

---

## Part 6: Troubleshooting

### Deploy Fails: "DATABASE_URL not found"

```bash
# Solution: Verify environment variable in Vercel Dashboard
vercel env list
vercel env pull .env.local
```

### Application Errors in Production

```bash
# Check logs
vercel logs --prod

# Connect to database shell
supabase projects list
psql [DATABASE_URL]
```

### Migration Fails

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back [migration_name]

# Re-run migration
npx prisma migrate deploy
```

### Database Connection Pool Exhausted

```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';
```

---

## Part 7: Zero-Downtime Updates

### Rolling Deployment

```bash
# 1. Deploy new version (blue)
vercel --prod

# 2. Run database migrations
npx prisma migrate deploy

# 3. Monitor error rates
# If problems, roll back: vercel rollback [deployment_id]

# 4. Traffic automatically shifts to new version
```

### A/B Testing New Features

```bash
# Create preview deployment
vercel --target production

# Compare performance
# If good: promote to production
# If bad: discard

vercel promote [preview_url]
```

---

## Part 8: Security Best Practices

### Secrets Management

```bash
# Store secrets securely
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Never commit .env files
echo ".env.local" >> .gitignore
```

### Rate Limiting

```typescript
// Add to API endpoints
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
// app/api/evaluations/[id]/score/calculate/route.ts

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}
```

---

## Part 9: Disaster Recovery

### Backup & Restore

```bash
# Daily automatic backups (Supabase)
# Access at: Supabase Dashboard → Backups

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20260403.sql
```

### Disaster Recovery Plan

| Scenario | RTO | Action |
|----------|-----|--------|
| Database corruption | 1 hour | Restore from backup |
| Deployment error | 10 min | Rollback version |
| Region outage | 2 hours | Failover region |
| Data breach | 15 min | Rotate secrets |

---

## Part 10: Scaling to Production

### Performance Targets

- API response time: < 500ms (p95)
- Database query time: < 100ms
- Concurrent users: 1000+
- Monthly evaluations: 10,000+

### Optimization Checklist

- [ ] Enable caching (Redis)
- [ ] Implement connection pooling
- [ ] Add CDN for static assets
- [ ] Batch API requests
- [ ] Archive old evaluations
- [ ] Monitor database indexes
- [ ] Load test before peak season

### Example Load Test

```bash
# Using Apache Bench
ab -n 10000 -c 100 https://your-app.vercel.app/api/health

# Using k6
k6 run load-test.js
```

---

## Post-Deployment Checklist

- [ ] API health check passes
- [ ] Database connected and accessible
- [ ] All NO-GO rules working
- [ ] Stress testing scenarios execute
- [ ] Reports generate correctly
- [ ] Audit logs recorded
- [ ] User authentication working
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Monitoring dashboard operational
- [ ] Backup strategy verified
- [ ] Team notified of deployment

---

## Support & Escalation

### Vercel Support
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

### Supabase Support
- Documentation: https://supabase.io/docs
- Community: https://discord.gg/dBmSrPsP

### Emergency Rollback

```bash
# Immediate rollback
vercel rollback --prod [deployment_id]

# Check previous deployments
vercel list --prod
```

---

## Continuous Deployment

### GitHub Actions Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci && npm test && npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Final Notes

- **Always test in staging first**
- **Monitor for 24 hours post-deployment**
- **Keep database backups for 30 days**
- **Document any custom configurations**
- **Schedule maintenance windows monthly**

For issues or questions, see `DEVELOPER_GUIDE.md` or contact the DevOps team.
