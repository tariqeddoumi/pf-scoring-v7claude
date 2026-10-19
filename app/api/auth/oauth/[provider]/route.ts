import { NextRequest, NextResponse } from "next/server";
import { messagePublic } from "@/lib/erreur-publique";
import { createToken } from "@/lib/auth";
import prisma from "@/lib/prisma-client";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const MICROSOFT_TOKEN_URL =
  "https://login.microsoftonline.com/common/oauth2/v2.0/token";
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
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const retourLogin = (message: string) => {
      const u = new URL(base);
      u.pathname = "/login";
      u.searchParams.set("error", message);
      const r = NextResponse.redirect(u);
      r.cookies.delete({ name: "oauth_state", path: "/api/auth/oauth" });
      return r;
    };

    // Anti-CSRF : l'état renvoyé par le fournisseur doit être celui émis par oauth-init.
    const attendu = request.cookies.get("oauth_state")?.value;
    if (!state || !attendu || state !== attendu) return retourLogin("Connexion expirée ou invalide : recommencez.");
    if (!code) return retourLogin("Connexion annulée.");

    const redirectUri = `${base}/api/auth/oauth/${provider}`;

    // Échange du code pour le token
    const accessToken = await exchangeCodeForToken(provider, code, redirectUri);

    // Récupération des infos utilisateur
    const oauthUser = await getUserInfo(provider, accessToken);

    // Seuls les comptes déjà ouverts par un administrateur se connectent ainsi. La route
    // créait un compte « analyste » pour toute adresse Google ou Microsoft, sans banque
    // de rattachement — donc avec accès à toutes les banques.
    const user = await prisma.user.findUnique({ where: { email: oauthUser.email } });
    if (!user) return retourLogin("Aucun compte n'est ouvert pour cette adresse : contactez l'administrateur.");
    if (!user.isActive || user.deletedAt) return retourLogin("Ce compte est désactivé. Contactez l'administrateur.");

    await prisma.user.update({
      where: { id: user.id },
      data: { oauthProvider: provider, oauthId: oauthUser.id, avatar: oauthUser.avatar, lastLoginAt: new Date() },
    });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    // Le jeton passe par le fragment d'URL : il n'est ni envoyé au serveur, ni écrit dans
    // les journaux, ni transmis dans l'en-tête Referer. La page de connexion le range.
    const u = new URL(base);
    u.pathname = "/login";
    u.hash = `jeton=${encodeURIComponent(token)}${user.mustChangePassword ? "&changer=1" : ""}`;
    const response = NextResponse.redirect(u);
    response.cookies.delete({ name: "oauth_state", path: "/api/auth/oauth" });
    return response;
  } catch (error: unknown) {
    console.error("OAuth error:", error);
    const errorUrl = new URL(process.env.NEXT_PUBLIC_BASE_URL!);
    errorUrl.pathname = "/login";
    errorUrl.searchParams.set("error", messagePublic(error, "Connexion externe impossible"));
    return NextResponse.redirect(errorUrl);
  }
}
