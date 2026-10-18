import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { messagePublic } from "@/lib/erreur-publique";
import { convertirPiece, type PieceConvertie } from "@/lib/services/ia-documents/conversion";
import { lirePiece } from "@/lib/services/ia-documents/stockage";
import { analyserPieces } from "@/lib/services/ia-documents/analyse";
import { saisieSchema } from "@/lib/modele-pf/saisie";
import { criteresIA, construirePropositionsPF, contexteDossier, type AnalysePF } from "@/lib/modele-pf/ia";
import { evaluationModifiable, piecesDe, refus } from "@/lib/modele-pf/acces";

// L'analyse de plusieurs pièces peut prendre quelques minutes.
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST — fait lire les pièces par l'IA pour les treize blocs : contrôle des pièces et
 * propositions de saisie avec leur source. Rien n'est écrit dans la saisie : l'analyste
 * accepte ou rejette chaque proposition.
 */
async function analyser(_req: NextRequest, user: AuthPayload, id: string) {
  const a = await evaluationModifiable(id, user);
  if (!a.ok) return a.refus;
  const e = a.e;
  const fichiers = piecesDe(e.pieces);
  if (!fichiers.length) return refus(400, "Ajoutez d'abord les pièces du dossier.");

  const avertissements: string[] = [];
  const pieces: PieceConvertie[] = [];
  const lues: { id: string; nom: string }[] = [];
  for (const f of fichiers) {
    try {
      const convertie = await convertirPiece(f.nom, await lirePiece(f.chemin));
      if (convertie.avertissement) avertissements.push(convertie.avertissement);
      pieces.push(convertie);
      lues.push({ id: f.id, nom: f.nom });
    } catch (err) {
      avertissements.push(`« ${f.nom} » non analysée : ${messagePublic(err, "lecture impossible")}`);
    }
  }
  if (!pieces.length) return NextResponse.json({ error: "Aucune pièce lisible.", details: avertissements }, { status: 400 });

  try {
    const saisie = saisieSchema.parse(e.saisie);
    const criteres = criteresIA(saisie);
    const appel = await analyserPieces({ pieces, criteres, contexte: contexteDossier(e.project as unknown as Record<string, unknown>, saisie) });
    const { propositions, manquants } = construirePropositionsPF(appel.resultat, saisie, criteres);
    const analyse: AnalysePF = {
      date: new Date().toISOString(), auteur: user.userId, modele: appel.modele, usage: appel.usage, pieces: lues,
      avertissements: [...avertissements, ...appel.avertissements],
      synthese: appel.resultat.synthese, documents: appel.resultat.documents, questions: appel.resultat.questions,
      propositions, manquants,
    };
    await prisma.$transaction([
      prisma.evaluationPF.update({ where: { id }, data: { analyseIa: analyse as unknown as Prisma.InputJsonValue } }),
      prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: "SCORING_PF_ANALYSE_IA",
        details: JSON.stringify({ evaluationId: id, pieces: lues.length, propositions: propositions.length, manquants: manquants.length, modele: appel.modele }) } }),
    ]);
    return NextResponse.json({ analyse });
  } catch (err) {
    console.error("[ANALYSE IA PF]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: messagePublic(err, "Analyse impossible"), details: avertissements }, { status: 502 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAuth(req, (r, u) => analyser(r, u, id));
}
