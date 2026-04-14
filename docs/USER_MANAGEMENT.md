# User Management System

## Overview

The User Management System provides comprehensive account lifecycle management with built-in audit trails, soft-delete support, and role-based access control.

### Key Features

- **Soft Delete**: Inactive users retained for audit purposes
- **Audit Logging**: Complete history of all user management actions
- **Role-Based**: Support for multiple roles (ADMIN, ANALYST, APPROVER, VIEWER)
- **Session Tracking**: Last login timestamps and forced password changes
- **GDPR Compliance**: Permanent deletion when required

---

## Database Schema

### Users Table

```sql
ALTER TABLE users ADD COLUMN:
  - isActive: BOOLEAN (default: true)
  - mustChangePassword: BOOLEAN (default: false)
  - lastLoginAt: TIMESTAMP
  - deletedAt: TIMESTAMP
```

### UserAuditLog Table

```sql
CREATE TABLE user_audit_logs (
  id: UUID PRIMARY KEY
  userId: UUID FOREIGN KEY
  performedById: UUID FOREIGN KEY (who performed the action)
  action: TEXT (LOGIN, DEACTIVATE, REACTIVATE, ROLE_CHANGE, PASSWORD_CHANGE_REQUIRED)
  oldValue: TEXT (previous value)
  newValue: TEXT (new value)
  reason: TEXT (explanation)
  ipAddress: TEXT
  userAgent: TEXT
  createdAt: TIMESTAMP
)
```

### Indexes

```sql
INDEX users(isActive, deletedAt)
INDEX users(role)
INDEX users(createdAt)
INDEX user_audit_logs(userId)
INDEX user_audit_logs(performedById)
INDEX user_audit_logs(action)
INDEX user_audit_logs(createdAt)
```

---

## API

### UserManagementService

All methods are static on the `UserManagementService` class.

#### getUserById

```typescript
static async getUserById(
  id: string,
  includeInactive: boolean = false
): Promise<User>
```

Retrieves a user by ID.

**Parameters:**
- `id`: User ID (UUID)
- `includeInactive`: If false, only returns active (non-deleted) users

**Returns:**
- User object with: id, email, nom, prenom, role, isActive, mustChangePassword, lastLoginAt, createdAt, updatedAt

**Example:**
```typescript
// Get active user
const user = await UserManagementService.getUserById(userId);

// Get user even if inactive
const inactiveUser = await UserManagementService.getUserById(userId, true);
```

#### listUsers

```typescript
static async listUsers(
  filters?: {
    role?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
  }
): Promise<User[]>
```

Lists users with optional filtering.

**Parameters:**
- `filters.role`: Filter by role (ADMIN, ANALYST, APPROVER, VIEWER)
- `filters.isActive`: Filter by active status
- `filters.includeDeleted`: Include soft-deleted users

**Returns:**
- Array of user objects

**Example:**
```typescript
// All active analysts
const analysts = await UserManagementService.listUsers({
  role: 'ANALYST',
  isActive: true
});

// All users including deleted
const allUsers = await UserManagementService.listUsers({
  includeDeleted: true
});
```

#### recordLogin

```typescript
static async recordLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<User>
```

Records a successful login and resets password change requirement.

**Parameters:**
- `userId`: User ID
- `ipAddress`: Client IP address (optional, from request)
- `userAgent`: Browser user agent (optional, from request)

**Side Effects:**
- Updates `lastLoginAt` to current timestamp
- Sets `mustChangePassword` to false
- Creates audit log entry with type "LOGIN"

**Example:**
```typescript
// On successful authentication
await UserManagementService.recordLogin(userId, req.ip, req.headers['user-agent']);
```

#### deactivateUser

```typescript
static async deactivateUser(
  userId: string,
  performedById: string,
  reason?: string
): Promise<User>
```

Soft-deletes a user (sets isActive=false, deletedAt=now).

**Parameters:**
- `userId`: User to deactivate
- `performedById`: Admin/user performing action
- `reason`: Why the user was deactivated (optional)

**Side Effects:**
- Sets `isActive` = false
- Sets `deletedAt` = current timestamp
- Creates audit log with type "DEACTIVATE"

**Example:**
```typescript
await UserManagementService.deactivateUser(
  userId,
  adminId,
  'User requested account closure'
);
```

#### reactivateUser

```typescript
static async reactivateUser(
  userId: string,
  performedById: string,
  reason?: string
): Promise<User>
```

Reactivates a previously deactivated user.

**Parameters:**
- `userId`: User to reactivate
- `performedById`: Admin performing action
- `reason`: Why user is being reactivated

**Side Effects:**
- Sets `isActive` = true
- Sets `deletedAt` = null
- Creates audit log with type "REACTIVATE"

**Example:**
```typescript
await UserManagementService.reactivateUser(
  userId,
  adminId,
  'User requested account reactivation'
);
```

#### changeUserRole

```typescript
static async changeUserRole(
  userId: string,
  newRole: string,
  performedById: string,
  reason?: string
): Promise<User>
```

Changes a user's role with audit trail.

**Parameters:**
- `userId`: User whose role changes
- `newRole`: New role (ADMIN, ANALYST, APPROVER, VIEWER)
- `performedById`: Admin performing action
- `reason`: Why role is changing

**Side Effects:**
- Updates `role` field
- Creates audit log with type "ROLE_CHANGE"
- oldValue = previous role, newValue = new role

**Example:**
```typescript
await UserManagementService.changeUserRole(
  userId,
  'APPROVER',
  adminId,
  'Promoted for loan committee'
);
```

#### requirePasswordChange

```typescript
static async requirePasswordChange(
  userId: string,
  performedById: string,
  reason?: string
): Promise<User>
```

Forces user to change password at next login.

**Parameters:**
- `userId`: User who must change password
- `performedById`: Admin forcing change
- `reason`: Why password change required

**Side Effects:**
- Sets `mustChangePassword` = true
- Creates audit log with type "PASSWORD_CHANGE_REQUIRED"

**Example:**
```typescript
// After suspected breach
await UserManagementService.requirePasswordChange(
  userId,
  adminId,
  'Mandatory password reset due to security incident'
);
```

#### auditAction

```typescript
static async auditAction(
  userId: string,
  performedById: string,
  action: string,
  oldValue: string | null,
  newValue: string | null,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserAuditLog>
```

Records a user management action in the audit log.

**Parameters:**
- `userId`: Affected user
- `performedById`: User performing action
- `action`: Action type (LOGIN, DEACTIVATE, etc.)
- `oldValue`: Previous value (nullable)
- `newValue`: New value (nullable)
- `reason`: Explanation (optional)
- `ipAddress`: Client IP (optional)
- `userAgent`: Browser info (optional)

**Returns:**
- Created audit log record

**Note:** Other methods call this automatically. Direct use is rare.

#### getUserAuditLog

```typescript
static async getUserAuditLog(
  userId: string,
  limit: number = 50
): Promise<UserAuditLog[]>
```

Retrieves audit history for a user.

**Parameters:**
- `userId`: User to audit
- `limit`: Maximum records (default: 50)

**Returns:**
- Array of audit log entries, newest first
- Includes related performedBy user info

**Example:**
```typescript
// Get last 100 actions for a user
const auditTrail = await UserManagementService.getUserAuditLog(userId, 100);

auditTrail.forEach(entry => {
  console.log(`${entry.createdAt}: ${entry.action} by ${entry.performedBy.email}`);
});
```

#### permanentlyDeleteUser

```typescript
static async permanentlyDeleteUser(userId: string): Promise<User>
```

**DANGER**: Permanently deletes user and all audit logs.

**Parameters:**
- `userId`: User to permanently delete

**Side Effects:**
- Deletes ALL audit logs for this user (as userId or performedById)
- Deletes the user record
- **IRREVERSIBLE**

**Example:**
```typescript
// GDPR data deletion request
await UserManagementService.permanentlyDeleteUser(userId);
```

---

## Workflows

### New User Registration

```typescript
// 1. Create user (via auth provider)
const user = await prisma.user.create({
  data: {
    email: 'analyst@bank.ma',
    nom: 'Rachid',
    prenom: 'Mansouri',
    role: 'ANALYST',
    isActive: true,
  }
});

// 2. User logs in → recordLogin called automatically
await UserManagementService.recordLogin(user.id, clientIp, userAgent);

// 3. First login creates audit entry
// 4. User can now access system
```

### Offboarding User

```typescript
// 1. Deactivate account
await UserManagementService.deactivateUser(
  userId,
  adminId,
  'Employee left organization'
);

// 2. User cannot log in anymore
// 3. Audit log preserved
// 4. Data remains in database

// Later: If GDPR deletion requested
// 5. Permanently delete
await UserManagementService.permanentlyDeleteUser(userId);
```

### Promoting Analyst to Approver

```typescript
// 1. Change role
await UserManagementService.changeUserRole(
  analystId,
  'APPROVER',
  adminId,
  'Promoted to loan committee reviewer'
);

// 2. User's next request will have new role
// 3. Audit trail shows role change
// 4. Old role is in audit log oldValue
```

### Security Incident Response

```typescript
// User account compromised
// 1. Deactivate immediately
await UserManagementService.deactivateUser(
  userId,
  securityAdminId,
  'Account compromise detected'
);

// 2. Require password change when reactivated
await UserManagementService.requirePasswordChange(
  userId,
  securityAdminId,
  'Required after password reset'
);

// 3. Investigate via audit log
const auditTrail = await UserManagementService.getUserAuditLog(userId);
```

---

## Audit Log Fields

Each audit entry contains:

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Unique identifier |
| userId | UUID | Affected user |
| performedById | UUID | Who made the change |
| action | TEXT | Type of change |
| oldValue | TEXT | Previous value (nullable) |
| newValue | TEXT | New value (nullable) |
| reason | TEXT | Why change was made |
| ipAddress | TEXT | Client IP address |
| userAgent | TEXT | Browser user agent |
| createdAt | TIMESTAMP | When change occurred |

### Action Types

| Action | Trigger | oldValue | newValue |
|--------|---------|----------|----------|
| LOGIN | User logs in | null | null |
| DEACTIVATE | User disabled | 'true' | 'false' |
| REACTIVATE | User re-enabled | 'false' | 'true' |
| ROLE_CHANGE | Role updated | oldRole | newRole |
| PASSWORD_CHANGE_REQUIRED | Force reset | 'false' | 'true' |

---

## Integration Points

### Authentication Middleware

When user logs in successfully:

```typescript
// After password verification
await UserManagementService.recordLogin(
  userId,
  request.ip,
  request.headers['user-agent']
);
```

### Admin UI

Deactivate user button:

```typescript
await UserManagementService.deactivateUser(
  selectedUser.id,
  currentAdmin.id,
  formReason
);
```

Role change dropdown:

```typescript
await UserManagementService.changeUserRole(
  selectedUser.id,
  newRole,
  currentAdmin.id,
  'Bulk role assignment'
);
```

### GDPR Compliance

Data deletion request:

```typescript
// Find user
const user = await UserManagementService.getUserById(userId);

if (user) {
  // Delete permanently
  await UserManagementService.permanentlyDeleteUser(userId);
  
  // Log deletion separately (before user exists)
  await prisma.gdprDeletionLog.create({
    data: { userId, requestedAt: new Date(), completedAt: new Date() }
  });
}
```

---

## Best Practices

### ✅ Do

- Always provide `reason` when modifying users
- Use `includeInactive` flag carefully (audit only)
- Record `ipAddress` for security audit trails
- Require password change after role promotion
- Keep audit logs for compliance period

### ❌ Don't

- Call `permanentlyDeleteUser` without approval process
- Bypass soft-delete and directly DELETE from database
- Create users without recording them in audit
- Assume inactive users are deleted (they're not)

---

## Compliance

### SOX (Sarbanes-Oxley)

- Audit trail preserved: ✓
- User action tracking: ✓
- Change control: ✓

### GDPR (European Compliance)

- Right to deletion: ✓ (permanentlyDeleteUser)
- Right to access: ✓ (getUserAuditLog)
- Data minimization: ✓ (soft delete by default)

### Bank Al-Maghrib Requirements

- User segregation: ✓ (roles)
- Action traceability: ✓ (audit logs)
- Session management: ✓ (lastLoginAt, mustChangePassword)

---

## Troubleshooting

### User Can't Log In

**Cause 1: User is deactivated**
```typescript
const user = await UserManagementService.getUserById(userId);
if (!user) {
  // User is inactive - reactivate
  await UserManagementService.reactivateUser(userId, adminId, 'Accidental deactivation');
}
```

**Cause 2: Must change password**
```typescript
if (user.mustChangePassword) {
  // Redirect to password change page
}
```

### Can't Find User

**Issue: User was deleted**
```typescript
// Check with includeInactive
const user = await UserManagementService.getUserById(userId, true);
```

### Audit Trail Missing

**Issue: Manually updated database**
```sql
-- Never do this:
UPDATE users SET role = 'ADMIN' WHERE id = '...';

-- Always use:
await UserManagementService.changeUserRole(userId, 'ADMIN', adminId, 'reason');
```

---

## API Endpoints (Planned)

These endpoints would expose the service to the API:

```
GET /api/admin/users
  - List users
  - Query params: role, isActive, includeDeleted

GET /api/admin/users/[id]
  - Get user details

POST /api/admin/users/[id]/deactivate
  - Deactivate user

POST /api/admin/users/[id]/reactivate
  - Reactivate user

POST /api/admin/users/[id]/role
  - Change role

POST /api/admin/users/[id]/password-reset
  - Require password change

GET /api/admin/users/[id]/audit
  - Get user audit log
```

---

## Code References

- **Service**: `/lib/services/user-management-service.ts`
- **Schema**: `/prisma/schema.prisma` (User, UserAuditLog)
- **Migration**: `/prisma/migrations/20260414_enhance_user_model/`

