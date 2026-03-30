import { NextResponse } from "next/server";
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
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: error.message,
    }, { status: 500 });
  }
}
