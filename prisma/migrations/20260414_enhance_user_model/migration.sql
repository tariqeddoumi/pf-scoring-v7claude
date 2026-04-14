-- Add new fields to User model for better account management
ALTER TABLE "__TABLE_PREFIX___users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "__TABLE_PREFIX___users" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "__TABLE_PREFIX___users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "__TABLE_PREFIX___users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Create UserAuditLog table for tracking user management actions
CREATE TABLE IF NOT EXISTS "__TABLE_PREFIX___user_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "__TABLE_PREFIX___user_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "__TABLE_PREFIX___users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "__TABLE_PREFIX___user_audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "__TABLE_PREFIX___users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___users_isActive_idx" ON "__TABLE_PREFIX___users"("isActive");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___users_role_idx" ON "__TABLE_PREFIX___users"("role");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___users_createdAt_idx" ON "__TABLE_PREFIX___users"("createdAt");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___users_deletedAt_idx" ON "__TABLE_PREFIX___users"("deletedAt");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___user_audit_logs_userId_idx" ON "__TABLE_PREFIX___user_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___user_audit_logs_performedById_idx" ON "__TABLE_PREFIX___user_audit_logs"("performedById");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___user_audit_logs_action_idx" ON "__TABLE_PREFIX___user_audit_logs"("action");
CREATE INDEX IF NOT EXISTS "__TABLE_PREFIX___user_audit_logs_createdAt_idx" ON "__TABLE_PREFIX___user_audit_logs"("createdAt");
