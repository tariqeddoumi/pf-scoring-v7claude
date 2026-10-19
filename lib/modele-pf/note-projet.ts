/**
 * Note affichée d'un projet.
 *
 * Le grade et le score du projet ne s'écrivent qu'à la validation d'un scoring : tant
 * qu'aucun n'est validé, les listes de projets, la fiche projet et la fiche client
 * montraient « — » alors que le scoring du dossier avait déjà une note. Faute de note
 * validée, on retient celle du dernier scoring non rejeté, signalée comme proposée.
 */
import prisma from "@/lib/prisma-client";
import { chargerParametres } from "./serveur";
import { fusionnerParametres, gradeDeLaNote, type ParametresModele } from "./parametres";

export interface NoteProjet {
  grade: string | null;
  scoreGlobal: number | null;
  /** Vrai quand la note vient d'un scoring non encore validé par le comité. */
  noteProposee: boolean;
}

export async function completerNotesProjets<T extends { id: string; grade?: string | null; scoreGlobal?: number | null }>(
  projets: T[]
): Promise<(T & NoteProjet)[]> {
  const sansNote = projets.filter((p) => !p.grade).map((p) => p.id);
  const dernieres = new Map<string, { noteApprouvee: string | null; scoreGlobal: number | null; statut: string; parametres: unknown }>();
  let P: ParametresModele | null = null;
  if (sansNote.length) {
    const [scorings, Pc] = await Promise.all([
      prisma.evaluationPF.findMany({
        where: { projectId: { in: sansNote }, statut: { not: "rejete" } },
        orderBy: { updatedAt: "desc" },
        select: { projectId: true, noteApprouvee: true, scoreGlobal: true, statut: true, parametres: true },
      }),
      chargerParametres(),
    ]);
    P = Pc;
    for (const s of scorings) if (!dernieres.has(s.projectId)) dernieres.set(s.projectId, s);
  }
  return projets.map((p) => {
    if (p.grade) return { ...p, grade: p.grade, scoreGlobal: p.scoreGlobal ?? null, noteProposee: false };
    const s = dernieres.get(p.id);
    if (!s || !P) return { ...p, grade: null, scoreGlobal: p.scoreGlobal ?? null, noteProposee: false };
    const Ps = s.statut !== "brouillon" && s.parametres ? fusionnerParametres(s.parametres as never) : P;
    const note = s.noteApprouvee === "—" ? "—" : s.noteApprouvee ? Number(s.noteApprouvee) : null;
    return { ...p, grade: gradeDeLaNote(note, Ps), scoreGlobal: s.scoreGlobal, noteProposee: true };
  });
}
