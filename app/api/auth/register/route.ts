import { NextResponse } from "next/server";

/**
 * Ancienne création de compte, retirée : le rôle était libre et aucune politique de mot de
 * passe ne s'appliquait. Les comptes se créent dans l'administration (/api/admin/users),
 * avec mot de passe provisoire, périmètre et rôle contrôlés.
 */
export function POST() {
  return NextResponse.json({ error: "Route retirée : utilisez /api/admin/users." }, { status: 410 });
}
