import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        status: "error",
        message: "User not found",
        email,
      });
    }

    // Vérifier le mot de passe
    const passwordValid = await verifyPassword(password, user.password || "");

    return NextResponse.json({
      status: passwordValid ? "success" : "error",
      message: passwordValid ? "Password is correct" : "Password is incorrect",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
    }, { status: 500 });
  }
}
