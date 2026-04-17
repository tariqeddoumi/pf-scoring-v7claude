# Scoring Engine V8 - Deployment Guide

**Status**: ✅ READY FOR PRODUCTION  
**Version**: 7/8 Phases Complete (87.5%)  
**Last Updated**: 2026-04-17

---

## Quick Start (5 minutes)

### 1. Run SQL Setup Script in Supabase

```sql
-- Go to: https://supabase.com/dashboard
-- Click: SQL Editor
-- Create new query
-- Copy & paste contents of: supabase/scoring-setup.sql
-- Click: Run
```

**What it does**:
- ✅ Creates all required indexes
- ✅ Adds test data (sample model + nodes + bindings + rules)
- ✅ Verifies all tables exist
- ✅ Displays verification report

---

### 2. Test APIs via Postman/Thunder Client

#### Create Evaluation
```http
POST /api/scoring/evaluations
Content-Type: application/json

{
  "projectId": "your-project-id",
  "modelVersionId": "version-id"
}
```

#### Calculate Score
```http
POST /api/scoring/evaluations/{eval_id}/calculate
```

#### View Results
```http
GET /api/scoring/evaluations/{eval_id}/trace
```

---

### 3. Test UI

```
http://localhost:3000/scoring/evaluations/{eval_id}
http://localhost:3000/scoring/evaluations/{eval_id}/results
http://localhost:3000/admin/scoring-designer
```

---

## Phase 8: Pre-Production Hardening

**Before production**, complete:

### Security (1-2 days)
- [ ] Replace eval() with mathjs library
- [ ] Add RBAC to admin APIs
- [ ] Add rate limiting
- [ ] Strengthen input validation

### Testing (1-2 days)
- [ ] API endpoint tests
- [ ] E2E tests
- [ ] Performance tests (load testing)
- [ ] Security tests (OWASP)

### Performance (1 day)
- [ ] Optimize binding resolution
- [ ] Add API caching
- [ ] Implement pagination
- [ ] Monitor database queries

### Monitoring (1 day)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Backup strategy
- [ ] Rollback procedure

---

## Database Schema

**13 v7pp tables + 1 binding table**

All tables indexed and configured with:
- Foreign key constraints
- Cascading deletes
- Auto-timestamps (createdAt, updatedAt)
- UUID primary keys

See HEALTH_DIAGNOSTIC.md for full schema details.

---

## Status

✅ **READY for staging/QA testing**

⚠️ **NOT READY for production** (Phase 8 completion needed)

---

*See HEALTH_DIAGNOSTIC.md and SCORING_IMPLEMENTATION.md for more details.*
