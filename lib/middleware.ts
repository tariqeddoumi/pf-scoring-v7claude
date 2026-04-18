import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "./auth-middleware";

// DEPRECATED: Use auth-middleware.ts instead. This is kept for backward compatibility only.
// DO NOT USE in new code.

/**
 * DEPRECATED: Use withAuth from auth-middleware.ts instead
 * This middleware does NOT verify JWT signatures properly.
 * @deprecated
 */
export function withAuth(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return handler(req, context, user.role);
  };
}

/**
 * Updated role permissions matrix aligned with new role hierarchy
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  system_admin: [
    "read",
    "create",
    "update",
    "delete",
    "configure",
    "manage_users",
    "manage_roles",
    "system_settings",
  ],
  scoring_admin: [
    "read",
    "create",
    "update",
    "delete",
    "configure",
    "publish_model",
    "manage_scoring",
  ],
  risk_manager: [
    "read",
    "create",
    "update",
    "evaluate",
    "review",
    "approve",
    "override",
  ],
  committee_member: ["read", "evaluate", "approve", "decision"],
  risk_analyst: ["read", "create", "update", "evaluate"],
  auditor: ["read"],
  read_only: ["read"],
};

export function checkPermission(
  userRole: string,
  requiredAction: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredAction);
}
