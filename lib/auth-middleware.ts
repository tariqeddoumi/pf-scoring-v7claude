import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { hasPermission, hasMinimumRole as checkMinimumRole, type UserRole } from "./permissions";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string; // Dynamic role type
  iat?: number;
  exp?: number;
}

const JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "your-secret-key";

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthPayload;
  } catch {
    return null;
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", errorCode: "ERR_AUTH_401" },
      { status: 401 }
    );
  }
  return handler(request, user);
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    // Check if user has admin-level role
    if (!checkMinimumRole(user.role, "scoring_admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

/**
 * Middleware to check specific permission
 */
export async function withPermission(
  permission: string,
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        { success: false, error: "Forbidden", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

/**
 * Middleware to check minimum role
 */
export async function withMinimumRole(
  minimumRole: UserRole,
  request: NextRequest,
  handler: (request: NextRequest, user: AuthPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (!checkMinimumRole(user.role, minimumRole)) {
      return NextResponse.json(
        { success: false, error: "Forbidden", errorCode: "ERR_AUTH_403" },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

// Legacy role hierarchy (kept for backward compatibility)
export const ROLE_HIERARCHY: Record<string, number> = {
  system_admin: 7,
  scoring_admin: 6,
  risk_manager: 5,
  committee_member: 4,
  risk_analyst: 3,
  auditor: 2,
  read_only: 1,
};

export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}
