import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "./auth";

export async function withAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: { userId: string; email: string; role: string }
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = getTokenFromCookie(request.headers.get("cookie"));

  if (!token) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  const user = await verifyToken(token);

  if (!user) {
    return NextResponse.json(
      { error: "Token invalide" },
      { status: 401 }
    );
  }

  return handler(request, user);
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: { userId: string; email: string; role: string }
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (user.role !== "admin" && user.role !== "manager") {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      );
    }

    return handler(req, user);
  });
}
