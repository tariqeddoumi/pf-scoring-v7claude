import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      },
    });
    return NextResponse.json({ users });
  } catch (error: unknown) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}
