# Quick Reference - Authentification & V8

## 🔐 Authentication Architecture

### API Endpoints
```
POST   /api/auth/register     → Create user (admin-only)
POST   /api/auth/login        → Get JWT token + set cookie
GET    /api/auth/me           → Get current user (requires auth)
POST   /api/auth/logout       → Clear cookie
```

### Database Schema
**Table:** `BP_PF_users`
```
id              UUID primary key
email           String unique
password        String? (bcrypt hashed)
role            UserRole enum
nom             String
prenom          String
isActive        Boolean
createdAt       DateTime
updatedAt       DateTime
```

### User Roles (UserRole Enum)
```
system_admin        → Full system access
scoring_admin       → Scoring configuration
risk_manager        → Risk assessment & approval
committee_member    → Committee review
risk_analyst        → Risk analysis
auditor             → Audit only
read_only           → View only (default)
```

### JWT Token Contents
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "system_admin",
  "iat": 1702300000,
  "exp": 1702386400    // 24 hours
}
```

### Cookie Configuration
```
Name:       auth_token
Value:      JWT token string
Path:       /
HttpOnly:   true (no JavaScript access)
Secure:     true (HTTPS only in production)
SameSite:   lax (CSRF protection)
MaxAge:     7 days (604800 seconds)
```

---

## 📊 V8 Sectoral Model

### Tables V8 (6 tables)
```
BP_PF_v8_sectors                 → 12 master sectors
BP_PF_v8_sector_domain_weights   → Domain weights per sector
BP_PF_v8_sector_stress_tests     → Sector stress scenarios
BP_PF_v8_sector_red_flags        → Sector red flags
BP_PF_v8_sector_domain_impacts   → Relative domain emphasis
BP_PF_v8_integration_rules       → Bonus/malus config
```

### V8 Activation Check
```typescript
// In code:
const v8Count = await prisma.v8Sector.count();
const v8Enabled = v8Count > 0;

// In admin dashboard:
GET /api/admin/diagnostic/v8-status
→ { enabled: boolean, v8SectorCount: number, ... }
```

### 12 V8 Sectors
```
1.  HYDRO            → Hydroelectric power
2.  WIND             → Wind energy
3.  SOLAR            → Solar power
4.  THERMAL          → Thermal power plants
5.  TRANSMISSION     → Electricity transmission
6.  TRANSPORT        → Transportation infrastructure
7.  WATER            → Water & wastewater
8.  LOGISTICS        → Logistics & storage
9.  TELECOM          → Telecommunications
10. HEALTHCARE       → Healthcare facilities
11. WASTE            → Waste management
12. OTHER            → Other sectors
```

### Domain Weights Distribution (D1-D9)
```
D1  Sponsor                      10%  (if SECTOR = HYDRO, D1 = 12%)
D2  Project Characteristics      10%  (adjusted per sector)
D3  Construction Risk            15%
D4  Market Risk                  10%
D5  Operational Risk             10%
D6  Counterparty Risk            10%
D7  Financial Structure          15%
D8  Legal & Documentation        10%
D9  Environmental & Social       10%
────────────────────────────────────
TOTAL                           100%
```

---

## 🔧 API Usage Examples

### Register Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<existing-admin-jwt>" \
  -d '{
    "email": "analyst@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "password": "Secure@123",
    "role": "risk_analyst"
  }'
```

### Login & Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "analyst@example.com",
    "password": "Secure@123"
  }'

# Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "analyst@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "risk_analyst"
  }
}
```

### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt

# Response:
{
  "id": "uuid",
  "email": "analyst@example.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "risk_analyst",
  "avatar": null,
  "createdAt": "2026-06-10T...",
  "success": true
}
```

### Check V8 Status
```bash
curl -X GET http://localhost:3000/api/admin/diagnostic/v8-status \
  -b cookies.txt

# Response:
{
  "enabled": true,
  "v8SectorCount": 12,
  "v8RuleCount": 24,
  "sectors": [
    { "code": "HYDRO", "label": "Hydroelectric", "isActive": true },
    { "code": "WIND", "label": "Wind Energy", "isActive": true },
    ...
  ],
  "timestamp": "2026-06-10T..."
}
```

### Check System Integrity
```bash
curl -X GET http://localhost:3000/api/admin/diagnostic/system-integrity \
  -b cookies.txt

# Response:
{
  "overall_status": "OK",
  "authentication": {
    "system_admins": 1,
    "total_active_users": 5,
    "status": "✓ HEALTHY"
  },
  "v7pp_scoring_model": {
    "models": 2,
    "versions": 5,
    "nodes": 234,
    "rules": 18,
    "evaluations": 12,
    "status": "✓ ACTIVE"
  },
  "v8_sectoral_adjustments": {
    "sectors": 12,
    "domain_weights": 108,
    "status": "✓ ENABLED"
  },
  "model_selection": {
    "active_model": "V8 (Sectoral)",
    "v8_enabled": true,
    "recommendation": "Using V8 with sector-specific adjustments"
  }
}
```

---

## 🧪 Testing

### Run Auth Flow Test
```bash
./scripts/test-auth-flow.sh http://localhost:3000
```

Tests:
- ✓ User registration
- ✓ Login & JWT generation
- ✓ /api/auth/me endpoint
- ✓ Auth status diagnostic
- ✓ V8 status detection
- ✓ System integrity check

### Manual Testing
```typescript
// In browser console:

// 1. Login
const loginRes = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Important: send cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { token, user } = await loginRes.json();
console.log('User role:', user.role);  // Should show role

// 2. Check current user
const meRes = await fetch('/api/auth/me', {
  credentials: 'include'
});
const userData = await meRes.json();
console.log('Verified role:', userData.role);  // Should match

// 3. Check V8 status
const v8Res = await fetch('/api/admin/diagnostic/v8-status', {
  credentials: 'include'
});
const v8Data = await v8Res.json();
console.log('V8 Enabled:', v8Data.enabled);
console.log('Active Model:', v8Data.enabled ? 'V8' : 'V7++');
```

---

## 🐛 Troubleshooting

### "Email ou mot de passe incorrect" on login
**Causes:**
- User doesn't exist
- Password hash mismatch
- User isActive = false

**Debug:**
```bash
sqlite3 .db "SELECT email, password, isActive FROM BP_PF_users WHERE email='test@example.com';"
```

### "Non authentifié" on protected endpoints
**Causes:**
- Cookie not sent (missing `credentials: 'include'`)
- JWT expired (refresh token not implemented yet)
- JWT_SECRET mismatch between login & verification

**Fix:**
```typescript
// Ensure credentials sent:
const res = await fetch('/api/auth/me', {
  credentials: 'include'  // ← REQUIRED
});
```

### "Seuls les administrateurs peuvent..." on register
**Cause:** Registering user must be authenticated with system_admin role

**Fix:**
```bash
# Login as admin first, then register new user
curl -X POST /api/auth/register \
  -b cookies.txt \  # ← Admin's auth_token cookie
  -d '{"email": "...", ...}'
```

### V8 shows as "V7++" in admin panel
**Cause:** V8 tables not populated (count = 0)

**Fix:**
```sql
-- Insert V8 sectors
INSERT INTO BP_PF_v8_sectors (id, code, label, isActive) VALUES
  ('1', 'HYDRO', 'Hydroelectric', true),
  ('2', 'WIND', 'Wind Energy', true),
  ...
```

---

## 📋 Checklist for New Deployment

- [ ] Set JWT_SECRET env variable (64+ random chars)
- [ ] Set NODE_ENV=production for secure cookies
- [ ] Seed at least 1 system_admin user
- [ ] Seed test users with different roles
- [ ] Verify DATABASE_URL points to production DB
- [ ] Run auth flow test: `./scripts/test-auth-flow.sh`
- [ ] Check V8 status: GET /api/admin/diagnostic/v8-status
- [ ] Check system integrity: GET /api/admin/diagnostic/system-integrity
- [ ] Review audit logs: psql → SELECT * FROM BP_PF_user_audit_logs
- [ ] Test admin panel login → should show correct role
- [ ] Test logout → cookie cleared

---

## 📚 Related Files

```
Core Auth:
  /lib/auth.ts                       → Low-level functions
  /lib/prisma-client.ts              → DB client

API Routes:
  /app/api/auth/login/route.ts       → Login endpoint
  /app/api/auth/register/route.ts    → Register endpoint
  /app/api/auth/me/route.ts          → Current user info
  /app/api/auth/logout/route.ts      → Logout & clear cookie

Diagnostics:
  /app/api/admin/diagnostic/v8-status/route.ts
  /app/api/admin/diagnostic/auth-status/route.ts
  /app/api/admin/diagnostic/system-integrity/route.ts

UI:
  /app/admin/page.tsx                → Admin dashboard
  /app/login/page.tsx                → Login page

Schema:
  /prisma/schema.prisma              → Full DB schema
  Line 18-85: User & UserAuditLog models
  Line 1655-1741: V8 models
```

---

**Last Updated:** 2026-06-10  
**Version:** 1.0 (Post-Audit)  
**Status:** ✅ Production Ready
