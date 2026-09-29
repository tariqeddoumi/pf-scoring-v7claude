import { NextRequest, NextResponse } from "next/server";

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["read", "create", "update", "delete", "configure"],
  manager: ["read", "create", "update", "validate"],
  analyst: ["read", "create", "update"],
  viewer: ["read"],
};

/** Le gestionnaire reçoit aussi le rôle lu du jeton. */
type GestionnaireRoute = (
  req: NextRequest,
  context: unknown,
  userRole: string
) => Promise<NextResponse> | NextResponse;

export function withAuth(handler: GestionnaireRoute) {
  return async (req: NextRequest, context: unknown) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Extract Bearer token from Authorization header
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

      // Decode JWT payload (without verification for now - should use Supabase JWT secret)
      const parts = token.split(".");
      if (parts.length !== 3) {
        return NextResponse.json(
          { error: "Invalid token format" },
          { status: 401 }
        );
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString("utf-8")
      );

      // Extract user role from JWT payload - use 'read_only' as default if not specified
      const userRole = payload.role || payload.user_role || "read_only";

      return handler(req, context, userRole);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  };
}

export function checkPermission(
  userRole: string,
  requiredAction: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredAction);
}
