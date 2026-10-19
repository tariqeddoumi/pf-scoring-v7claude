import { NextResponse } from "next/server";

/**
 * Ancienne gestion des comptes, retirée : la lecture ne vérifiait pas le périmètre et la
 * modification changeait mot de passe et rôle sans l'ancien mot de passe, sans politique
 * de mot de passe ni contrôle du rôle attribuable. Aucun écran ne l'appelait plus.
 */
const retiree = () =>
  NextResponse.json(
    { error: "Route retirée : utilisez /api/admin/users (administration) ou /api/auth/changer-mot-de-passe." },
    { status: 410 }
  );

export const GET = retiree;
export const PUT = retiree;
