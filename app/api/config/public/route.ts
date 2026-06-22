import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/services/app-config-service";

export async function GET() {
  try {
    const config = await getPublicConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error("[PUBLIC CONFIG GET]", error);
    return NextResponse.json({}, { status: 500 });
  }
}
