import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/scoring/bindings/[id]
 * Fetch a single binding.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const binding = await prisma.scoringNodeDataBinding.findUnique({
      where: { id: params.id },
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
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const binding = await prisma.scoringNodeDataBinding.update({
      where: { id: params.id },
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
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const binding = await prisma.scoringNodeDataBinding.update({
      where: { id: params.id },
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
