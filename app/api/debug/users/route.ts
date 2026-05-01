import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Route désactivée en production" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nom: true, prenom: true, role: true },
    });
    return NextResponse.json({ users });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
