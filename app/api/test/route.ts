import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/error-handler";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "API est fonctionnelle",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: "success",
      message: "POST reçu",
      received: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return NextResponse.json({
      status: "error",
      message: getErrorMessage(error),
    }, { status: 400 });
  }
}
