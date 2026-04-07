# Access Management & Role Request System - Architecture Proposal

**Date**: April 7, 2026  
**Phase**: Planning (Pre-implementation)  
**Status**: For Review

---

## Overview

Complete system for managing user access with:
- ✅ Windows/Active Directory authentication
- ✅ Guest mode for unauthenticated users (read-only)
- ✅ Role request workflow
- ✅ Admin approval dashboard
- ✅ Workflow integration capabilities
- ✅ Permission-based access control

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Authentication Layer                   │
│  ┌─────────────────┬──────────────────────────────────┐ │
│  │ Windows/LDAP    │  Email Authentication             │ │
│  │ (SSO)           │  (Fallback/external users)        │ │
│  └─────────────────┴──────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            User Status Determination                     │
│  ├─ Existing user with role? → Login + Role            │
│  ├─ New user from Windows? → Auto-create as GUEST      │
│  └─ External user? → Create + Request access           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│         Permission-Based Access Control                 │
│  ┌──────────────┬──────────────┬───────────────────┐   │
│  │   GUEST      │   ANALYST    │   MANAGER/ADMIN   │   │
│  │ (Read-only)  │  (CRUD+View) │  (Full access)    │   │
│  └──────────────┴──────────────┴───────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│          Role Request & Workflow System                 │
│  ├─ Submit role request
│  ├─ Approval notification
│  ├─ Workflow routing (optional)
│  └─ Role assignment
└─────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Additions

### New Tables Required

```sql
-- Role Requests Table
CREATE TABLE BP_PF_role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES BP_PF_users(id) ON DELETE CASCADE,
  requestedRoles TEXT[] NOT NULL, -- ['analyst', 'manager']
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewedAt TIMESTAMP,
  reviewedBy UUID REFERENCES BP_PF_users(id) ON DELETE SET NULL,
  approvalNotes TEXT,
  workflowId UUID, -- For workflow integration
  workflowStatus VARCHAR(50), -- e.g., 'in_review', 'approved'
  UNIQUE(userId, status)
);

-- User Access Logs (for audit trail)
CREATE TABLE BP_PF_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES BP_PF_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'LOGIN', 'REQUEST_ROLE', 'ROLE_GRANTED'
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX userId
);

-- Permission Levels (predefined)
CREATE TABLE BP_PF_permission_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'guest', 'analyst', 'manager', 'admin'
  label VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL, -- ['read_projects', 'create_evaluations', ...]
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow Integration (optional)
CREATE TABLE BP_PF_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 'email', 'teams', 'jira', 'servicenow'
  label VARCHAR(255) NOT NULL,
  webhookUrl TEXT,
  isActive BOOLEAN DEFAULT true,
  config JSONB, -- Workflow-specific config
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. User Permission Model

### Guest (Invité) - Level 0
```typescript
{
  role: 'guest',
  permissions: {
    read: {
      users: false,
      projects: true,
      evaluations: true,
      auditLogs: false
    },
    write: {
      projects: false,
      evaluations: false,
      users: false
    },
    admin: false
  }
}
```

### Analyst - Level 2
```typescript
{
  role: 'analyst',
  permissions: {
    read: {
      users: false,
      projects: true,
      evaluations: true,
      auditLogs: true
    },
    write: {
      projects: true,
      evaluations: true,
      users: false
    },
    admin: false
  }
}
```

### Manager - Level 3
```typescript
{
  role: 'manager',
  permissions: {
    read: {
      users: true,
      projects: true,
      evaluations: true,
      auditLogs: true
    },
    write: {
      projects: true,
      evaluations: true,
      users: false
    },
    admin: {
      approveRoles: true,
      manageWorkflows: false
    }
  }
}
```

### Admin - Level 4
```typescript
{
  role: 'admin',
  permissions: {
    read: {
      users: true,
      projects: true,
      evaluations: true,
      auditLogs: true
    },
    write: {
      users: true,
      projects: true,
      evaluations: true
    },
    admin: {
      approveRoles: true,
      manageWorkflows: true,
      manageUsers: true
    }
  }
}
```

---

## 4. Authentication Flow

### Proposed Implementation

```
Step 1: Initial Request
  User accesses /login
  ↓
Step 2: SSO Detection
  ├─ Try Windows/LDAP authentication
  │  ├─ Success → Extract email & domain
  │  ├─ Check if user exists in BP_PF_users
  │  │  ├─ Yes → Load user + role
  │  │  └─ No → Create user with GUEST role
  │  │
  └─ Fallback → Email/Password login
     └─ Check database
        ├─ Yes → Load user + role
        └─ No → Create user with GUEST role + prompt for role request

Step 3: Session Creation
  Create JWT with:
  - userId
  - email
  - role
  - permissions (from permission matrix)

Step 4: Frontend Permission Enforcement
  Load user context
  Hide/Disable features based on permissions
  Redirect to dashboard with guest view
```

### Code Structure

```typescript
// types/auth.ts
interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'guest' | 'analyst' | 'manager' | 'admin';
  permissions: PermissionSet;
  status: 'active' | 'pending_approval' | 'rejected';
  createdAt: Date;
  lastLogin?: Date;
}

interface PermissionSet {
  read: { [key: string]: boolean };
  write: { [key: string]: boolean };
  admin?: { [key: string]: boolean };
}

interface RoleRequest {
  id: string;
  userId: string;
  requestedRoles: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedBy?: string;
  approvalNotes?: string;
  workflowId?: string;
}
```

---

## 5. Role Request Workflow

```
User Actions:
  1. Sees "Request Access" button on dashboard
  2. Fills form:
     - Select requested role(s) (analyst/manager)
     - Provide reason
     - Optional: Select workflow destination
  3. Submit request

System Process:
  1. Create RoleRequest (status: pending)
  2. Log action in access_logs
  3. Notify administrators
  4. If workflow selected:
     └─ Send to external workflow
        (Email notification, Teams, JIRA, ServiceNow, etc.)

Admin Actions:
  1. Dashboard shows pending requests
  2. Review request details
  3. Choose:
     ├─ Approve → Assign role + notify user
     ├─ Reject → Update status + provide feedback
     └─ Defer → Mark for later review

Post-Approval:
  1. Update BP_PF_users.role
  2. Create new JWT with updated permissions
  3. Send notification to user
  4. Log approval in access_logs
```

---

## 6. File Structure & Components

### Backend Files to Create

```
lib/
├── auth/
│   ├── windows-auth.ts        (LDAP/AD integration)
│   ├── permission-checker.ts  (Permission validation)
│   └── role-request-service.ts (Role request logic)
├── workflows/
│   ├── workflow-service.ts    (Route requests to workflows)
│   └── providers/
│       ├── email-provider.ts
│       ├── teams-provider.ts
│       ├── jira-provider.ts
│       └── servicenow-provider.ts

app/api/
├── auth/
│   ├── login/route.ts         (Email/password + SSO)
│   ├── callback/route.ts      (OAuth callback if needed)
│   └── logout/route.ts
├── role-requests/
│   ├── route.ts               (GET list, POST create)
│   ├── [id]/approve/route.ts  (Approve request)
│   └── [id]/reject/route.ts   (Reject request)
└── admin/
    └── approvals/route.ts     (Dashboard for admin)
```

### Frontend Components to Create

```
components/
├── auth/
│   ├── LoginForm.tsx          (Email + SSO)
│   ├── GuestBanner.tsx        (Guest mode indicator)
│   └── RoleRequestButton.tsx  (Request access)
├── dashboard/
│   ├── GuestDashboard.tsx     (Read-only view)
│   └── RoleRequestModal.tsx   (Request form)
└── admin/
    ├── ApprovalDashboard.tsx  (Review requests)
    └── RoleRequestTable.tsx   (List requests)

pages/
├── login/page.tsx
├── dashboard/page.tsx
├── guest/page.tsx             (If guest has different layout)
└── admin/
    └── approvals/page.tsx
```

---

## 7. Permission Checking Middleware

### Backend Middleware

```typescript
// middleware/permission-check.ts
export async function withPermission(
  request: NextRequest,
  requiredAction: string, // 'read_projects', 'create_evaluation'
  handler: (req: NextRequest, user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get permission matrix for user's role
  const permissions = await getPermissions(user.role);
  
  // Check if user has required permission
  if (!checkPermission(permissions, requiredAction)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Allow request
  return handler(request, user);
}

// Usage in API route:
export async function POST(request: NextRequest) {
  return withPermission(
    request,
    'create_evaluation',
    async (req, user) => {
      // Your logic here
    }
  );
}
```

### Frontend Component Wrapper

```typescript
// components/ProtectedAction.tsx
export function ProtectedAction({
  permission: string,
  children,
  fallback
}: Props) {
  const user = useContext(AuthContext);
  const hasPermission = checkPermission(user.permissions, permission);

  if (!hasPermission) {
    return fallback || <LockedFeature />;
  }

  return children;
}

// Usage:
<ProtectedAction permission="create_evaluation">
  <Button onClick={handleCreate}>Create Evaluation</Button>
</ProtectedAction>
```

---

## 8. Workflow Integration Strategy

### Abstraction Pattern

```typescript
// lib/workflows/types.ts
interface WorkflowProvider {
  name: string;
  send(request: RoleRequest, config: any): Promise<void>;
  handleCallback?(data: any): Promise<void>;
}

// lib/workflows/providers/email-provider.ts
export class EmailWorkflow implements WorkflowProvider {
  async send(request: RoleRequest) {
    // Send email to approval group
  }
}

// lib/workflows/providers/teams-provider.ts
export class TeamsWorkflow implements WorkflowProvider {
  async send(request: RoleRequest) {
    // Send Teams message with approve/reject buttons
  }
}

// lib/workflows/providers/jira-provider.ts
export class JiraWorkflow implements WorkflowProvider {
  async send(request: RoleRequest) {
    // Create Jira ticket for approval
  }
}

// lib/workflows/workflow-service.ts
export class WorkflowService {
  async routeRequest(
    request: RoleRequest,
    workflowCode: string
  ): Promise<void> {
    const workflow = getWorkflowProvider(workflowCode);
    const config = await getWorkflowConfig(workflowCode);
    await workflow.send(request, config);
  }
}
```

### Configuration

```json
{
  "workflows": {
    "email": {
      "enabled": true,
      "recipients": ["admin@bank.ma"],
      "template": "role_request"
    },
    "teams": {
      "enabled": true,
      "webhookUrl": "${TEAMS_WEBHOOK_URL}",
      "channel": "#access-requests"
    },
    "jira": {
      "enabled": false,
      "project": "ACCS",
      "issueType": "Access Request"
    },
    "servicenow": {
      "enabled": false,
      "instance": "${SERVICENOW_INSTANCE}",
      "table": "change_request"
    }
  }
}
```

---

## 9. Guest Mode Features

### What Guests Can See
- ✅ Dashboard (read-only)
- ✅ Projects list (view only)
- ✅ Evaluations list (view only)
- ✅ Project details (read-only)
- ✅ Evaluation details (read-only)
- ✅ Scoring methodology (documentation)

### What Guests Cannot Do
- ❌ Create projects
- ❌ Create evaluations
- ❌ Update projects
- ❌ Submit evaluations
- ❌ View audit logs
- ❌ Manage users
- ❌ Approve/reject evaluations

### Guest Indicators
- Banner at top: "You have Guest access - Request role to perform actions"
- Disabled buttons with tooltips
- Modal prompts: "You need [analyst] role to perform this action"
- Locked icons on restricted features

---

## 10. Admin Approval Dashboard

### Features

```typescript
interface ApprovalDashboard {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };
  
  filters: {
    status: 'pending' | 'approved' | 'rejected';
    role: 'analyst' | 'manager' | 'admin';
    dateRange: [Date, Date];
  };

  actions: {
    approve: (requestId, notes?) => Promise<void>;
    reject: (requestId, reason) => Promise<void>;
    routeToWorkflow: (requestId, workflow) => Promise<void>;
  };
}
```

### UI Layout

```
┌─────────────────────────────────────────────────┐
│  Role Request Approvals Dashboard              │
├─────────────────────────────────────────────────┤
│ Stats: 5 Pending | 42 Approved | 3 Rejected   │
├─────────────────────────────────────────────────┤
│ Filters: Status | Role | Date Range            │
├─────────────────────────────────────────────────┤
│ Table:                                          │
│ ┌───────┬──────────┬────────┬──────┬─────────┐ │
│ │ User  │ Email    │ Role   │ Date │ Actions │ │
│ ├───────┼──────────┼────────┼──────┼─────────┤ │
│ │ John  │ john@... │ ANALYST│ 2d ago│ ✓✗ ⚙  │ │
│ │ Jane  │ jane@... │ MANAGER│ 1h ago│ ✓✗ ⚙  │ │
│ └───────┴──────────┴────────┴──────┴─────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add database tables
- [ ] Create permission matrix
- [ ] Implement permission checking middleware
- [ ] Add guest role to BP_PF_users

### Phase 2: Authentication (Week 2)
- [ ] Implement Windows/LDAP authentication
- [ ] Create login flow
- [ ] Setup JWT with permissions
- [ ] Auto-create guests on first login

### Phase 3: Role Requests (Week 2-3)
- [ ] Create RoleRequest API endpoints
- [ ] Build request submission form
- [ ] Create approval dashboard
- [ ] Implement approval workflow

### Phase 4: Workflow Integration (Week 3)
- [ ] Implement workflow provider interface
- [ ] Create email provider
- [ ] Create Teams provider
- [ ] Add workflow configuration

### Phase 5: UI Implementation (Week 4)
- [ ] Guest dashboard layout
- [ ] Permission-based UI hiding
- [ ] Role request modal
- [ ] Admin approval dashboard

### Phase 6: Testing & Deployment (Week 4-5)
- [ ] Unit tests for permissions
- [ ] Integration tests
- [ ] UAT with stakeholders
- [ ] Production deployment

---

## 12. Validation Schemas

```typescript
// Zod schema for role request
export const createRoleRequestSchema = z.object({
  requestedRoles: z.array(
    z.enum(['analyst', 'manager'])
  ).min(1),
  reason: z.string().min(10).max(500),
  workflowCode: z.string().optional(), // 'email', 'teams', 'jira', 'servicenow'
});

// Zod schema for approval
export const approveRoleRequestSchema = z.object({
  requestId: z.string().uuid(),
  grantedRoles: z.array(z.enum(['analyst', 'manager'])),
  notes: z.string().optional(),
});
```

---

## 13. Data Models

```typescript
// User with permission status
interface EnhancedUser extends User {
  permissionStatus: 'active' | 'guest' | 'pending_approval' | 'rejected';
  pendingRequest?: RoleRequest;
  lastRoleRequestAt?: Date;
}

// Audit trail for access management
interface AccessAudit {
  id: string;
  userId: string;
  action: 
    | 'LOGIN'
    | 'REQUEST_ROLE'
    | 'ROLE_GRANTED'
    | 'ROLE_REJECTED'
    | 'PERMISSION_DENIED'
    | 'WORKFLOW_ROUTED';
  details: {
    ip?: string;
    userAgent?: string;
    requestedRole?: string;
    approvedRoles?: string[];
    reason?: string;
  };
  timestamp: Date;
}
```

---

## 14. Security Considerations

### Best Practices
- ✅ All permissions checked server-side (not just frontend)
- ✅ JWT includes permission hash (invalidates on role change)
- ✅ Audit trail for all access changes
- ✅ Rate limiting on role requests (1 per day)
- ✅ Approval required from admin (no auto-approval)
- ✅ Permission cache invalidation on role change
- ✅ IP logging for suspicious access patterns

### Potential Threats & Mitigation
```
Threat: User modifies JWT to gain permissions
Mitigation: Always validate permissions server-side

Threat: Workflow bypass (direct API call to bypass approval)
Mitigation: All role changes require approval, logged audit trail

Threat: Brute force role requests
Mitigation: Rate limiting, CAPTCHA after 5 attempts

Threat: Social engineering approvers
Mitigation: Approval notification shows request details, requires explicit confirmation
```

---

## 15. Configuration Template

```yaml
# config/access-management.yaml
authentication:
  sso:
    enabled: true
    provider: windows-ldap
    domain: "bank.local"
    fallback: email-password
  
  email_auth:
    enabled: true
    provider: supabase
    require_domain_whitelist: true
    whitelist:
      - "@bank.ma"
      - "@banque.ma"

permissions:
  guest:
    read: true
    write: false
    admin: false
  analyst:
    read: true
    write: true
    admin: false
  manager:
    read: true
    write: true
    admin: approve_roles
  admin:
    read: true
    write: true
    admin: all

role_requests:
  enabled: true
  require_approval: true
  max_requests_per_day: 1
  auto_expire_after_days: 30
  
workflows:
  default: email
  available:
    - email
    - teams
    - jira
    - servicenow

guest_features:
  allow_download: false
  allow_export: false
  allow_print: false
  session_timeout_minutes: 60
```

---

## 16. Migration Path

### Current State (Today)
- ✅ Backend complete with full CRUD APIs
- ✅ 4 roles (admin, manager, analyst, viewer)
- ✅ No guest/read-only access

### Transition State (After Phase 1-2)
- ✅ Windows SSO + email authentication
- ✅ Guest role with read-only access
- ✅ Role requests functionality
- ✅ Permission-based access control

### Final State (After Phase 5)
- ✅ Complete access management system
- ✅ Workflow integration
- ✅ Admin dashboard
- ✅ Full audit trail

---

## 17. Success Criteria

✅ **Authentication**
- [ ] Windows/LDAP SSO works
- [ ] Email authentication works
- [ ] Auto-create guests on first login
- [ ] JWT includes permissions

✅ **Guest Mode**
- [ ] Guests can view projects/evaluations
- [ ] Guests cannot create/edit anything
- [ ] Guest indicator visible in UI
- [ ] Permission-denied messages helpful

✅ **Role Requests**
- [ ] Users can submit requests
- [ ] Admins receive notifications
- [ ] Approvals update permissions immediately
- [ ] Audit trail complete

✅ **Workflows**
- [ ] Email notifications work
- [ ] Teams integration (if enabled)
- [ ] JIRA integration (if enabled)
- [ ] ServiceNow integration (if enabled)

---

## 18. Cost/Benefit Analysis

### Benefits
- ✅ Improved security (no full access on first login)
- ✅ Better audit trail (track all access requests)
- ✅ Flexible workflow integration
- ✅ Enterprise-ready access management
- ✅ User-friendly onboarding
- ✅ Admin control without user complaints

### Costs
- ~2-3 weeks implementation
- 3-4 new database tables
- 5-6 new API endpoints
- 4-5 new UI components
- Workflow provider implementations (optional)

### ROI
- Reduced security incidents
- Better compliance audit trail
- Faster user onboarding
- Enterprise feature for sales/marketing
- Scalable for multi-bank deployments

---

## 19. Recommendations

### Phase 1 Focus (Recommended Start)
1. **Start with**: Database schema + Permission middleware
2. **Why**: Foundation for everything else
3. **Timeline**: 3-4 days
4. **Impact**: Low-risk, high-value foundation

### Phase 2 Focus (Next Priority)
1. **Start with**: Windows/LDAP SSO
2. **Why**: Solves primary authentication need
3. **Timeline**: 4-5 days
4. **Impact**: Enables guest mode

### Phase 3 Focus (Complete Feature)
1. **Start with**: Role request API + Dashboard
2. **Why**: Core business need
3. **Timeline**: 5-6 days
4. **Impact**: Full feature completeness

### Phase 4 Focus (Future Enhancement)
1. **Start with**: Email workflow only
2. **Why**: Most common use case
3. **Timeline**: 2-3 days
4. **Impact**: Nice-to-have, can be deferred

---

## 20. Code Examples (Prepared for Implementation)

### Permission Checking Service

```typescript
// lib/auth/permission-checker.ts (Ready to implement)
export class PermissionChecker {
  static async checkPermission(
    userId: string,
    action: string
  ): Promise<boolean> {
    const user = await getUser(userId);
    const permissions = await getPermissions(user.role);
    return this.hasPermission(permissions, action);
  }

  static hasPermission(
    permissions: PermissionSet,
    action: string
  ): boolean {
    const [resource, operation] = action.split('_');
    return permissions[resource]?.[operation] ?? false;
  }
}
```

### Role Request Service

```typescript
// lib/auth/role-request-service.ts (Ready to implement)
export class RoleRequestService {
  static async createRequest(
    userId: string,
    requestedRoles: string[],
    reason: string,
    workflowCode?: string
  ): Promise<RoleRequest> {
    const request = await createRoleRequest({
      userId,
      requestedRoles,
      reason,
      status: 'pending',
      workflowCode
    });

    // Route to workflow if specified
    if (workflowCode) {
      await WorkflowService.routeRequest(request, workflowCode);
    }

    // Notify admins
    await notifyAdmins(request);

    return request;
  }

  static async approveRequest(
    requestId: string,
    grantedRoles: string[],
    approvedBy: string
  ): Promise<void> {
    const request = await updateRoleRequest(requestId, {
      status: 'approved',
      reviewedBy: approvedBy,
      reviewedAt: new Date()
    });

    // Update user role
    await updateUserRole(request.userId, grantedRoles);

    // Notify user
    await notifyUser(request, 'approved');

    // Log audit trail
    await logAccessAction(request.userId, 'ROLE_GRANTED', {
      grantedRoles,
      approvedBy
    });
  }
}
```

---

## Conclusion

This architecture provides:
- ✅ **Security**: Guest mode + permission checking
- ✅ **Flexibility**: Workflow integration pattern
- ✅ **Scalability**: Database-driven permissions
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Future-proof**: Ready for enterprise features

**Recommendation**: Implement Phase 1 (Foundation) immediately, then Phase 2 (Auth), then business requirements for Phase 3+.

---

**Status**: Ready for Review & Discussion  
**Next Step**: User feedback on approach, then implementation planning

