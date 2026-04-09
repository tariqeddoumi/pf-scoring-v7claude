import { NextResponse, NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error: any) {
      console.error("[ADMIN/USERS] GET error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des utilisateurs", errorCode: "SRV_001" },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: Request) {
  try {
    const { email, nom, prenom, role } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        nom: nom || email.split("@")[0],
        prenom: prenom || "",
        role: role || "analyst",
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
