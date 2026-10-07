import prisma from "@/lib/prisma-client";
import { ScoringQuestionnaireService, type QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";
import { MODES_VERROUILLES } from "@/lib/services/scoring/value-selection";
import type { CritereGrille, Manquant, Proposition, ResultatAnalyse } from "./resultat";

export const ACTION_ANALYSE = "ANALYSE_DOCUMENTAIRE_IA";

/** Critères à renseigner : les feuilles du questionnaire de la version du dossier. */
export async function criteresDuDossier(modelVersionId: string): Promise<CritereGrille[]> {
  const arbre = await ScoringQuestionnaireService.getQuestionnaire(modelVersionId);
  const feuilles: QuestionnaireNode[] = [];
  const parcourir = (n: QuestionnaireNode) => {
    if (!n.children || n.children.length === 0) feuilles.push(n);
    else n.children.forEach(parcourir);
  };
  arbre.forEach(parcourir);

  const ids = feuilles.map((f) => f.id);
  const [noeuds, verrous] = await Promise.all([
    prisma.scoringNode.findMany({ where: { id: { in: ids } }, select: { id: true, isMandatory: true } }),
    prisma.scoringNodeDataBinding.findMany({
      where: { nodeId: { in: ids }, isActive: true, bindingMode: { in: MODES_VERROUILLES } },
      select: { nodeId: true },
    }),
  ]);
  const obligatoire = new Map(noeuds.map((n) => [n.id, n.isMandatory]));
  const verrouille = new Set(verrous.map((v) => v.nodeId));

  return feuilles.map((f) => ({
    id: f.id,
    code: f.code,
    label: f.label,
    description: f.description,
    answerType: f.answerType,
    isMandatory: obligatoire.get(f.id) ?? false,
    options: f.options?.map((o) => ({ value: o.value, label: o.label, quandChoisir: o.quandChoisir })),
    ranges: f.ranges?.map((r) => ({ minValue: r.minValue, maxValue: r.maxValue, label: r.label })),
    verrouille: verrouille.has(f.id),
  }));
}

/** Contexte du projet transmis à l'IA (identité, montant, secteur). */
export function contexteProjet(p: Record<string, unknown> | null | undefined): string {
  if (!p) return "(projet non renseigné)";
  const champs: Array<[string, unknown]> = [
    ["Projet", p.nom],
    ["Secteur", p.secteur],
    ["Pays", p.pays],
    ["Montant demandé", p.montant ? `${p.montant} ${p.devise ?? "MAD"}` : null],
    ["Coût total", p.coutTotal],
    ["SPV", p.nomSPV],
    ["Sponsor principal", p.sponsorPrincipal],
    ["Constructeur EPC", p.constructeurEPC],
    ["Opérateur O&M", p.operateurOM],
    ["Technologie", p.technologie],
    ["Description", p.description],
  ];
  return champs
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `${k} : ${String(v).slice(0, 800)}`)
    .join("\n");
}

export interface AnalyseEnregistree {
  date: string;
  auteur: string | null;
  modele: string;
  usage: { entree: number; sortie: number };
  pieces: Array<{ id: string; nom: string }>;
  avertissements: string[];
  resultat: ResultatAnalyse;
  propositions: Proposition[];
  manquants: Manquant[];
}

/** Dernière analyse du dossier (journalisée, jamais écrasée). */
export async function derniereAnalyse(evaluationId: string): Promise<AnalyseEnregistree | null> {
  const ligne = await prisma.scoringChangeLog.findFirst({
    where: { evaluationId, action: ACTION_ANALYSE },
    orderBy: { changedAt: "desc" },
    select: { newValueJson: true },
  });
  if (!ligne?.newValueJson) return null;
  try {
    return JSON.parse(ligne.newValueJson) as AnalyseEnregistree;
  } catch {
    return null;
  }
}
