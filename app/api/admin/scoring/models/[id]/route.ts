import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { ScoringModelService } from "@/lib/services/scoring-model-service";

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (request.method === "GET") {
    try {
      const model = await ScoringModelService.getModelById(id);

      if (!model) {
        return NextResponse.json({ error: "Model not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: model,
      });
    } catch (error) {
      console.error("[Model GET]", error);
      return NextResponse.json(
        { error: "Failed to fetch model" },
        { status: 500 }
      );
    }
  }

  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const { label, description } = body;

      const model = await ScoringModelService.updateModel(id, {
        label,
        description,
        updatedBy: user.userId,
      });

      return NextResponse.json({
        success: true,
        data: model,
      });
    } catch (error: any) {
      console.error("[Model PUT]", error);
      return NextResponse.json(
        { error: "Failed to update model" },
        { status: 500 }
      );
    }
  }

  if (request.method === "DELETE") {
    try {
      await ScoringModelService.archiveModel(id, user.userId);

      return NextResponse.json({
        success: true,
        message: "Model archived successfully",
      });
    } catch (error) {
      console.error("[Model DELETE]", error);
      return NextResponse.json(
        { error: "Failed to archive model" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, (req, user) => handler(req, user, { params }));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, (req, user) => handler(req, user, { params }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, (req, user) => handler(req, user, { params }));
}
