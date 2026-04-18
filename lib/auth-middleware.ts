import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export type UserRole =
  | "system_admin"      // Full system access
  | "scoring_admin"     // Manage scoring models
  | "risk_analyst"      // Create/edit evaluations
  | "risk_manager"      // Review evaluations
  | "committee_member"  // View evaluations, make decisions
  | "auditor"           // Read-only audit trail
  | "read_only";        // Read-only viewer

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = (() => {
  const secret =
    process.env.SUPABASE_JWT_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "CRITICAL: JWT_SECRET or SUPABASE_JWT_SECRET environment variable is required. " +
      "Never use default secrets in production."
    );
  }

  if (secret === "your-secret-key" || secret === "your-secret-key-change-in-production") {
    throw new Error(
      "CRITICAL: Using default JWT_SECRET is not allowed. " +
      "Set a strong, unique secret in environment variables."
    );
  }

  return secret;
})();

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
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please provide a valid JWT token in Authorization header.",
        },
      },
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
    if (user.role !== "system_admin" && user.role !== "scoring_admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin access required. User role does not have sufficient permissions.",
          },
        },
        { status: 403 }
      );
    }
    return handler(req, user);
  });
}

export const ROLE_HIERARCHY: Record<string, number> = {
  system_admin: 7,      // Highest privilege
  scoring_admin: 6,     // Manage scoring models
  risk_manager: 5,      // Review and approve
  committee_member: 4,  // Make decisions
  risk_analyst: 3,      // Create and edit
  auditor: 2,           // Read audit trail
  read_only: 1,         // Lowest privilege
};

export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}
