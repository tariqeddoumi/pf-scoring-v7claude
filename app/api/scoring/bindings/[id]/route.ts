import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";

/**
 * GET /api/scoring/bindings/[id]
 * Fetch a single binding.
 */
async function handleGET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const binding = await prisma.scoringNodeDataBinding.findUnique({
      where: { id: id },
    });

    if (!binding) {
      return NextResponse.json(
        { success: false, error: "Binding not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    console.error("GET /api/scoring/bindings/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scoring/bindings/[id]
 * Update a binding.
 */
async function handlePUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const binding = await prisma.scoringNodeDataBinding.update({
      where: { id: id },
      data: {
        ...body,
        transformConfigJson: body.transformConfigJson
          ? JSON.stringify(body.transformConfigJson)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: binding,
    });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Binding not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("PUT /api/scoring/bindings/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scoring/bindings/[id]
 * Soft-delete a binding (set isActive = false).
 */
async function handleDELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  user: AuthPayload
) {
  try {
    const { id } = await params;
    const binding = await prisma.scoringNodeDataBinding.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: { id: binding.id, isActive: binding.isActive },
    });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Binding not found", errorCode: "NOT_FOUND" },
        { status: 404 }
      );
    }
    console.error("DELETE /api/scoring/bindings/[id] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handleGET(r, ctx, user));
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handlePUT(r, ctx, user));
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return withAuth(req, (r, user) => handleDELETE(r, ctx, user));
}
