import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { UserService } from "@/lib/services/user-service";
import { paginationSchema } from "@/lib/validation-schemas";

/**
 * GET /api/users - List all users (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const validated = paginationSchema.parse({ page, limit });
    const result = await UserService.getAllUsers(
      validated.page,
      validated.limit
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/users - Create new user (admin only)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const newUser = await UserService.createUser(body, user.userId);

    return NextResponse.json(
      {
        id: newUser.id,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
