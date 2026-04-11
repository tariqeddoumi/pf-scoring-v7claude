import { NextRequest, NextResponse } from "next/server";
import { webhookService } from "@/lib/webhook-service";

export async function POST(req: NextRequest) {
  try {
    const { type, severity, project_name, manager_email, description } =
      await req.json();

    await webhookService.emit("alert.created", {
      type,
      severity,
      project_name,
      manager_email,
      description,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Alert created and notifications sent",
      severity,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}
