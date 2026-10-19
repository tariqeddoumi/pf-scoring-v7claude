import { NextResponse } from "next/server";

/**
 * Ancienne fiche de compte, retirée : la lecture ne vérifiait que la présence d'un cookie,
 * sans en contrôler la signature, et exposait tout compte de toutes les banques.
 */
const retiree = () =>
  NextResponse.json({ error: "Route retirée : utilisez /api/admin/users/[id] ou /api/users/[id]." }, { status: 410 });

export const GET = retiree;
export const DELETE = retiree;
