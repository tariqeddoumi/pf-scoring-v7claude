/**
 * Role hierarchy - higher number = more permissions
 */
export const ROLE_HIERARCHY = {
  system_admin: 7,
  scoring_admin: 6,
  risk_manager: 5,
  committee_member: 4,
  risk_analyst: 3,
  auditor: 2,
  read_only: 1,
} as const;

export type UserRole =
  | "system_admin"
  | "scoring_admin"
  | "risk_manager"
  | "committee_member"
  | "risk_analyst"
  | "auditor"
  | "read_only";

/**
 * Permission definitions by role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  system_admin: new Set([
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "users:manage_roles",
    "scoring:create",
    "scoring:read",
    "scoring:update",
    "scoring:delete",
    "scoring:configure",
    "domains:create",
    "domains:read",
    "domains:update",
    "domains:delete",
    "audit:read",
    "audit:export",
    "settings:configure",
    "diagnostic:run",
  ]),
  scoring_admin: new Set([
    "users:read",
    "users:update",
    "scoring:create",
    "scoring:read",
    "scoring:update",
    "scoring:delete",
    "scoring:configure",
    "domains:read",
    "domains:update",
    "domains:create",
    "audit:read",
    "diagnostic:run",
  ]),
  risk_manager: new Set([
    "scoring:read",
    "scoring:update",
    "users:read",
    "audit:read",
    "audit:export",
  ]),
  committee_member: new Set([
    "scoring:read",
    "audit:read",
  ]),
  risk_analyst: new Set([
    "scoring:read",
    "scoring:create",
    "scoring:update",
  ]),
  auditor: new Set([
    "audit:read",
    "audit:export",
    "scoring:read",
  ]),
  read_only: new Set([
    "scoring:read",
    "audit:read",
  ]),
};

/**
 * Check if user role is at least the minimum required role
 */
export function hasMinimumRole(userRole: string, minimumRole: UserRole): boolean {
  const userHierarchy = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredHierarchy = ROLE_HIERARCHY[minimumRole];
  return userHierarchy >= requiredHierarchy;
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as UserRole];
  if (!permissions) return false;
  return permissions.has(permission);
}

/**
 * Check if user has any of the provided permissions
 */
export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(userRole, perm));
}

/**
 * Check if user has all of the provided permissions
 */
export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  return permissions.every((perm) => hasPermission(userRole, perm));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(userRole: string): string[] {
  const permissions = ROLE_PERMISSIONS[userRole as UserRole];
  return permissions ? Array.from(permissions) : [];
}

/**
 * Get role hierarchy level (0 if invalid role)
 */
export function getRoleLevel(userRole: string): number {
  return ROLE_HIERARCHY[userRole as UserRole] ?? 0;
}
