import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { initializeFieldConfigurationsFromCode } from "@/lib/services/field-config-service";

export async function POST(request: NextRequest) {
  return withAuth(request, async (user: any) => {
    try {
      if (user?.role !== "system_admin") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      await initializeFieldConfigurationsFromCode();

      return NextResponse.json({
        success: true,
        message: "Field configurations initialized successfully",
      });
    } catch (error) {
      console.error("[FORMS INITIALIZE]", error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Initialization failed",
        },
        { status: 500 }
      );
    }
  });
}
