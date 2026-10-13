import { NextResponse } from "next/server";
import type { AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import prisma from "@/lib/prisma-client";
import { ErreurT24 } from "./connecteur";

/** Le rapatriement sert à saisir une fiche : réservé à qui peut créer ou modifier un client. */
export function refusSansDroitDeSaisie(user: AuthPayload): NextResponse | null {
  const role = user.role as UserRole;
  if (
    hasPermission(role, "client", "create") ||
    hasPermission(role, "client", "update")
  )
    return null;
  return NextResponse.json(
    {
      success: false,
      error: "Vos droits ne permettent pas de saisir la signalétique client.",
    },
    { status: 403 }
  );
}

/** Trace de chaque consultation de T24 (qui, quoi, quand) dans le journal d'audit. */
export async function tracer(
  user: AuthPayload,
  action: string,
  details: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { utilisateurId: user.userId, action, details },
    });
  } catch (e) {
    console.error("[T24 audit]", e);
  }
}

export function reponseErreurT24(e: unknown, contexte: string): NextResponse {
  if (e instanceof ErreurT24) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: e.statut }
    );
  }
  console.error(`[${contexte}]`, e);
  return NextResponse.json(
    { success: false, error: "Erreur lors de la lecture T24." },
    { status: 500 }
  );
}
