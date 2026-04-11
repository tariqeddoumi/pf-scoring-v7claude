import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";
import { ZodError } from "zod";

async function handleGET(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    console.error("[CLIENT GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate input
    let validated;
    try {
      validated = createClientSchema.parse(body);
    } catch (validationError: any) {
      console.error("[CLIENT PUT] Validation error:", validationError);
      if (validationError instanceof ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            errorCode: "VALIDATION_ERROR",
            errors: validationError.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { nom, email, telephone, secteur, pays, type, description } =
      validated;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if email is taken by another client
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            error: "Email already in use",
            errorCode: "EMAIL_IN_USE",
            errors: [
              {
                field: "email",
                message: "This email is already used by another client",
              },
            ],
          },
          { status: 400 }
        );
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        secteur: secteur || null,
        pays: pays || null,
        type: type || null,
        description: description || null,
      },
      include: {
        projects: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedClient,
    });
  } catch (error: any) {
    console.error("[CLIENT PUT]", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error: any) {
    console.error("[CLIENT DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: any) {
  return withAuth(request, (req, user) => handleGET(req, user, { params }));
}

export async function PUT(request: NextRequest, { params }: any) {
  return withAuth(request, (req, user) => handlePUT(req, user, { params }));
}

export async function DELETE(request: NextRequest, { params }: any) {
  return withAuth(request, (req, user) => handleDELETE(req, user, { params }));
}
