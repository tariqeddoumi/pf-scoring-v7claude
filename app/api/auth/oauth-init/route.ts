import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { messagePublic } from "@/lib/erreur-publique";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const MICROSOFT_AUTH_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

/** Valeur imprévisible, conservée dans un cookie httpOnly et vérifiée au retour (anti-CSRF). */
function generateRandomState(): string {
  return randomBytes(24).toString("hex");
}

function avecEtat(corps: { authUrl: string }, state: string) {
  const r = NextResponse.json(corps);
  r.cookies.set("oauth_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/api/auth/oauth",
  });
  return r;
}

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();

    if (!provider || !["google", "microsoft"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
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

      return avecEtat({ authUrl: `${GOOGLE_AUTH_URL}?${params}` }, state);
    } else if (provider === "microsoft") {
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state,
      });

      return avecEtat({ authUrl: `${MICROSOFT_AUTH_URL}?${params}` }, state);
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  } catch (error: unknown) {
    console.error("OAuth init error:", error);
    return NextResponse.json(
      { error: messagePublic(error, "Connexion externe impossible") },
      { status: 500 }
    );
  }
}
