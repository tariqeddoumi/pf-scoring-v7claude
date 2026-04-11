import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringModelService } from "@/lib/services/scoring-model-service";

async function handler(request: NextRequest, user: any) {
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");

      const models = await ScoringModelService.listModels({
        status: status as any,
        isActive: true,
      });

      return NextResponse.json({
        success: true,
        data: models,
      });
    } catch (error) {
      console.error("[Models GET]", error);
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: 500 }
      );
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { code, label, description, versionNumber } = body;

      if (!code || !label || !versionNumber) {
        return NextResponse.json(
          {
            error: "Missing required fields",
            errors: {
              code: !code ? "Code is required" : null,
              label: !label ? "Label is required" : null,
              versionNumber: !versionNumber
                ? "Version number is required"
                : null,
            },
          },
          { status: 400 }
        );
      }

      const model = await ScoringModelService.createModel({
        code,
        label,
        description,
        versionNumber: parseInt(versionNumber),
        createdBy: user.userId,
      });

      return NextResponse.json(
        {
          success: true,
          data: model,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("[Models POST]", error);
      return NextResponse.json(
        { error: "Failed to create model" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET(request: NextRequest) {
  return withAuth(request, handler);
}

export async function POST(request: NextRequest) {
  return withAuth(request, handler);
}
