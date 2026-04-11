import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

export async function GET() {
  try {
    // Test database connection with short timeout
    const userCount = await Promise.race([
      prisma.user.count(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 3000)
      ),
    ]);

    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
    });
  } catch (error: unknown) {
    // Return 503 Service Unavailable (temporary) instead of 500
    // This tells the client the server is temporarily unavailable
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "degraded",
        database: "checking",
        error: errorMsg,
        message:
          "La connexion à la base de données est en cours de vérification. Veuillez réessayer.",
      },
      { status: 503 }
    );
  }
}
