/** Chargement d'une évaluation PF pour une action de saisie (pièces, analyse IA, propositions). */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";
import type { AuthPayload } from "@/lib/auth-middleware";
import { peutSaisir } from "./serveur";

export interface PiecePF { id: string; nom: string; taille: number; type: string; chemin: string; deposePar: string; deposeLe: string }

export const refus = (status: number, error: string) => NextResponse.json({ error }, { status });

export function piecesDe(v: unknown): PiecePF[] {
  return Array.isArray(v) ? (v as PiecePF[]).filter((p) => p && typeof p.id === "string") : [];
}

/**
 * Évaluation au brouillon que l'utilisateur peut modifier, avec son projet ; sinon la
 * réponse de refus à renvoyer telle quelle.
 */
export async function evaluationModifiable(id: string, user: AuthPayload) {
  const e = await prisma.evaluationPF.findUnique({
    where: { id },
    include: { project: { include: { client: { select: { codeClientT24: true, radical: true } } } } },
  });
  if (!e) return { ok: false, refus: refus(404, "Scoring introuvable") } as const;
  if (!peutSaisir(user.role, user.userId, [e.creePar, e.project.creePar])) {
    return { ok: false, refus: refus(403, "Vos droits ne permettent pas de modifier ce scoring") } as const;
  }
  if (e.statut !== "brouillon") return { ok: false, refus: refus(409, "Ce scoring n'est plus modifiable : rouvrez-le d'abord.") } as const;
  return { ok: true, e } as const;
}
