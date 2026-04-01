import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider || !["google", "microsoft"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const redirectUri = `${baseUrl}/api/auth/oauth/${provider}`;
    const state = generateRandomState();

    if (provider === "google") {
      const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state,
      });

      return NextResponse.json({
        authUrl: `${GOOGLE_AUTH_URL}?${params}`,
      });
    } else if (provider === "microsoft") {
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state,
      });

      return NextResponse.json({
        authUrl: `${MICROSOFT_AUTH_URL}?${params}`,
      });
    }

    return NextResponse.json(
      { error: "Unknown error" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("OAuth init error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
