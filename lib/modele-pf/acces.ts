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

/** Actions du journal qui font d'un utilisateur un contributeur de la saisie. */
const ACTIONS_CONTRIBUTION = ["SCORING_PF_CREE", "SCORING_PF_CONTRIBUTION", "SCORING_PF_PROPOSITIONS_IA", "SCORING_PF_ANALYSE_IA", "SCORING_PF_SOUMETTRE"];

/**
 * Tous ceux qui ont contribué au scoring (créateur, rédacteurs successifs, auteur de la
 * soumission, créateur du projet), écartés de la décision : modifiePar ne garde que le
 * dernier rédacteur.
 */
export async function intervenantsScoring(e: { id: string; creePar: string; modifiePar: string | null; project: { creePar: string } }): Promise<string[]> {
  const journal = await prisma.auditLog.findMany({
    where: { action: { in: ACTIONS_CONTRIBUTION }, details: { contains: `"evaluationId":"${e.id}"` } },
    select: { utilisateurId: true },
  });
  return [...new Set([e.creePar, e.modifiePar, e.project.creePar, ...journal.map((j) => j.utilisateurId)].filter((x): x is string => !!x))];
}

/** Motif du dernier rejet par le comité, consigné au journal. */
export async function dernierRejet(id: string): Promise<{ motif: string | null; le: Date } | null> {
  const r = await prisma.auditLog.findFirst({
    where: { action: "SCORING_PF_REJETER", details: { contains: `"evaluationId":"${id}"` } },
    orderBy: { dateAction: "desc" },
    select: { details: true, dateAction: true },
  });
  if (!r) return null;
  try {
    const d = JSON.parse(r.details) as { motif?: string | null };
    return { motif: d.motif ?? null, le: r.dateAction };
  } catch {
    return { motif: null, le: r.dateAction };
  }
}
