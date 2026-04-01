import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import prisma from "@/lib/prisma-client";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0/me";

interface OAuthUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  avatar?: string;
}

async function exchangeCodeForToken(
  provider: string,
  code: string,
  redirectUri: string
): Promise<string> {
  if (provider === "google") {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) throw new Error("Failed to exchange Google code");
    const data = await response.json();
    return data.access_token;
  } else if (provider === "microsoft") {
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email",
      }),
    });

    if (!response.ok) throw new Error("Failed to exchange Microsoft code");
    const data = await response.json();
    return data.access_token;
  }

  throw new Error("Unsupported provider");
}

async function getUserInfo(
  provider: string,
  accessToken: string
): Promise<OAuthUser> {
  if (provider === "google") {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error("Failed to fetch Google user info");
    const data = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name || data.email,
      provider: "google",
      avatar: data.picture,
    };
  } else if (provider === "microsoft") {
    const response = await fetch(MICROSOFT_GRAPH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error("Failed to fetch Microsoft user info");
    const data = await response.json();

    return {
      id: data.id,
      email: data.userPrincipalName || data.mail,
      name: data.displayName,
      provider: "microsoft",
    };
  }

  throw new Error("Unsupported provider");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const { provider } = params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "No authorization code" },
        { status: 400 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/oauth/${provider}`;

    // Échange du code pour le token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    // Récupération des infos utilisateur
    const oauthUser = await getUserInfo(provider, accessToken);

    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: oauthUser.email },
    });

    if (!user) {
      const [prenom, ...nomParts] = oauthUser.name.split(" ");
      user = await prisma.user.create({
        data: {
          email: oauthUser.email,
          nom: nomParts.join(" ") || "Utilisateur",
          prenom: prenom,
          role: "analyste",
          password: "", // Pas de mot de passe pour OAuth
          oauthProvider: provider,
          oauthId: oauthUser.id,
          avatar: oauthUser.avatar,
        },
      });
    } else {
      // Mettre à jour les infos OAuth
      await prisma.user.update({
        where: { email: oauthUser.email },
        data: {
          oauthProvider: provider,
          oauthId: oauthUser.id,
          avatar: oauthUser.avatar,
        },
      });
    }

    // Créer le token JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Rediriger vers le dashboard avec le token
    const dashboardUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL!);
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.set("token", token);

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("OAuth error:", error);
    const errorUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL!);
    errorUrl.pathname = "/login";
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl);
  }
}
