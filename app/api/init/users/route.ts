import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  try {
    // Check if admin user exists
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@pf-scoring.ma" },
    });

    if (adminExists) {
      return NextResponse.json(
        { message: "Admin user already exists" },
        { status: 200 }
      );
    }

    // Create default users
    const users = [
      {
        email: "admin@pf-scoring.ma",
        password: "Admin123!",
        nom: "Admin",
        prenom: "Utilisateur",
        role: "admin",
      },
      {
        email: "analyste@pf-scoring.ma",
        password: "Analyste123!",
        nom: "Analyste",
        prenom: "Test",
        role: "analyste",
      },
    ];

    for (const user of users) {
      const hashedPassword = await hashPassword(user.password);
      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          nom: user.nom,
          prenom: user.prenom,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          role: user.role as any,
        },
      });
    }

    return NextResponse.json(
      {
        message: "Default users created successfully",
        users: users.map((u) => ({
          email: u.email,
          role: u.role,
          password: u.password,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error initializing users:", error);
    return NextResponse.json(
      { error: "Failed to initialize users" },
      { status: 500 }
    );
  }
}
