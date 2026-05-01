import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";
import prisma from "@/lib/prisma-client";
import { verifyPassword } from "@/lib/auth";

const PROD_BLOCKED = NextResponse.json(
  { error: "Route désactivée en production" },
  { status: 403 }
);

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return PROD_BLOCKED;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const password = searchParams.get("password");

    if (!email || !password) {
      return NextResponse.json({
        status: "error",
        message: "Email et mot de passe requis en query parameters",
        example: "?email=admin@pf-scoring.ma&password=Admin123!",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found", email });
    }

    const passwordValid = await verifyPassword(password, user.password || "");

    return NextResponse.json({
      status: passwordValid ? "success" : "error",
      message: passwordValid ? "Password is correct" : "Password is incorrect",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: "error", message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return PROD_BLOCKED;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ status: "error", message: "Email et mot de passe requis" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found", email });
    }

    const passwordValid = await verifyPassword(password, user.password || "");

    return NextResponse.json({
      status: passwordValid ? "success" : "error",
      message: passwordValid ? "Password is correct" : "Password is incorrect",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: unknown) {
    return NextResponse.json({ status: "error", message: getErrorMessage(error) }, { status: 500 });
  }
}
