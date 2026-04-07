import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * Debug endpoint - Check environment variables and database connection
 */
export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING",
      DIRECT_URL: process.env.DIRECT_URL ? "✅ SET" : "❌ MISSING",
      JWT_SECRET: process.env.JWT_SECRET ? "✅ SET" : "❌ MISSING",
    },
    database: {
      status: "checking...",
      error: null as any,
    },
  };

  try {
    // Try to connect to database
    const userCount = await prisma.user.count();
    debug.database = {
      status: "✅ CONNECTED",
      error: null,
    };
  } catch (error: any) {
    debug.database = {
      status: "❌ FAILED",
      error: {
        message: error.message,
        code: error.code,
        clientVersion: error.clientVersion,
      },
    };
  }

  // If DIRECT_URL is missing, show instructions
  if (!process.env.DIRECT_URL) {
    return NextResponse.json(
      {
        ...debug,
        warning: "⚠️ DIRECT_URL is not set on Vercel!",
        instructions: `
1. Go to Vercel Project Settings → Environment Variables
2. Add DIRECT_URL with your Supabase direct connection (port 5432, not 6543)
3. Format: postgresql://postgres.[PROJECT-REF]:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?schema=public
4. Redeploy the project
        `,
      },
      { status: 503 }
    );
  }

  return NextResponse.json(debug);
}
