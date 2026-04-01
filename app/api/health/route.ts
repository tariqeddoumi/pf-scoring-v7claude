import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    return NextResponse.json({
      status: "ok",
      database: "connected",
      userCount,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: getErrorMessage(error),
    }, { status: 500 });
  }
}
