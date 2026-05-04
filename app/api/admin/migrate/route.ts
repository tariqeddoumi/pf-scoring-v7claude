import { NextRequest, NextResponse } from "next/server";

/**
 * Migration endpoint - Manually trigger database migrations
 * Only accessible with proper admin token
 * Usage: POST /api/admin/migrate
 */
export async function POST(request: NextRequest) {
  // Security: Check if this is called with admin credentials
  const adminToken = request.headers.get("x-admin-token");
  const expectedToken = process.env.ADMIN_MIGRATE_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "Migration endpoint not configured" },
      { status: 500 }
    );
  }

  if (adminToken !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only allow in production/staging environments
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { error: "Migrations can only be run in production" },
      { status: 400 }
    );
  }

  try {
    const { execSync } = require("child_process");

    // Run prisma migrate deploy
    const output = execSync("npx prisma migrate deploy", {
      encoding: "utf-8",
      stdio: "pipe",
    });

    return NextResponse.json({
      success: true,
      message: "Database migrations completed successfully",
      output: output,
    });
  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Migration failed",
        output: error.stderr || error.stdout,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check migration status
 */
export async function GET(request: NextRequest) {
  const adminToken = request.headers.get("x-admin-token");
  const expectedToken = process.env.ADMIN_MIGRATE_TOKEN;

  if (adminToken !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    message: "To run migrations, send POST request with x-admin-token header",
    example: 'curl -X POST /api/admin/migrate -H "x-admin-token: YOUR_TOKEN"',
  });
}
