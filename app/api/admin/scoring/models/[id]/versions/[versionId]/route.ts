import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { ScoringVersionService } from "@/lib/services/scoring-version-service";

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  if (request.method === "GET") {
    try {
      const version = await ScoringVersionService.getVersionById(
        versionId
      );

      if (!version) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: version,
      });
    } catch (error) {
      console.error("[Version GET]", error);
      return NextResponse.json(
        { error: "Failed to fetch version" },
        { status: 500 }
      );
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { action, targetStatus } = body;

      if (action === "transition" && targetStatus) {
        const version = await ScoringVersionService.transitionStatus(
          versionId,
          targetStatus,
          user.userId
        );

        return NextResponse.json({
          success: true,
          data: version,
        });
      }

      if (action === "publish") {
        const version = await ScoringVersionService.publishVersion(
          versionId,
          user.userId
        );

        return NextResponse.json({
          success: true,
          data: version,
        });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
      console.error("[Version POST]", error);
      if (
        error.message.includes("not found") ||
        error.message.includes("Cannot transition")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Failed to process version action" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function GET(request: NextRequest, { params }: any) {
  return withAuth(request, (req, user) => handler(req, user, { params }));
}

export async function POST(request: NextRequest, { params }: any) {
  return withAuth(request, (req, user) => handler(req, user, { params }));
}
