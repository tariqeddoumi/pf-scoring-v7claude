import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Cache control
  if (request.nextUrl.pathname.startsWith("/_next/static")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
  } else if (request.nextUrl.pathname.startsWith("/api/")) {
    // Les réponses d'API ne se mettent pas en cache : elles portent l'état du
    // portefeuille, qui change à chaque saisie. Avec « private, max-age=300 », le
    // navigateur servait pendant cinq minutes une liste périmée — un projet créé
    // n'apparaissait pas — et gardait aussi bien une réponse d'erreur, si bien
    // qu'une panne corrigée continuait de s'afficher.
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
