import prisma from "@/lib/prisma-client";
import { ModelLoader } from "@/lib/services/scoring";
import { MODES_VERROUILLES } from "@/lib/services/scoring/value-selection";
import type { CritereGrille, Manquant, Proposition, ResultatAnalyse } from "./resultat";

export const ACTION_ANALYSE = "ANALYSE_DOCUMENTAIRE_IA";

/**
 * Critères à renseigner : exactement les champs de l'écran de saisie, c'est-à-dire
 * les feuilles de l'arbre complet de la version (même chargement que la route
 * /form). L'ancienne version partait du questionnaire tronqué par la granularité
 * (niveau 1 par défaut) : l'IA répondait sur des intitulés de regroupement, que la
 * sauvegarde refusait (« nœud inconnu dans le référentiel »).
 */
export async function criteresDuDossier(modelVersionId: string): Promise<CritereGrille[]> {
  const arbre = await ModelLoader.loadVersion(modelVersionId);

  // Parcours dans l'ordre de l'écran, en gardant le libellé du parent pour le contexte.
  const feuilles: Array<{ id: string; parent: string | null }> = [];
  const parcourir = (id: string, parent: string | null) => {
    const enfants = arbre.childrenOf.get(id) ?? [];
    if (enfants.length === 0) {
      feuilles.push({ id, parent });
      return;
    }
    const libelle = arbre.nodesById.get(id)?.label ?? null;
    for (const e of enfants) parcourir(e, libelle);
  };
  arbre.rootNodeIds.forEach((r) => parcourir(r, null));

  const ids = feuilles.map((f) => f.id);
  const [options, plages, verrous] = await Promise.all([
    prisma.scoringNodeOption.findMany({
      where: { nodeId: { in: ids }, isActive: true },
      orderBy: { orderIndex: "asc" },
      select: { nodeId: true, value: true, code: true, label: true, metadataJson: true },
    }),
    prisma.scoringNodeRange.findMany({
      where: { nodeId: { in: ids }, isActive: true },
      orderBy: { minValue: "asc" },
      select: { nodeId: true, minValue: true, maxValue: true, label: true },
    }),
    prisma.scoringNodeDataBinding.findMany({
      where: { nodeId: { in: ids }, isActive: true, bindingMode: { in: MODES_VERROUILLES } },
      select: { nodeId: true },
    }),
  ]);
  const verrouille = new Set(verrous.map((v) => v.nodeId));
  const optionsPar = new Map<string, NonNullable<CritereGrille["options"]>>();
  for (const o of options) {
    let quandChoisir: string | undefined;
    try {
      quandChoisir = o.metadataJson ? JSON.parse(o.metadataJson)?.when_choose || undefined : undefined;
    } catch {
      /* métadonnée illisible : l'option reste décrite par son libellé */
    }
    const liste = optionsPar.get(o.nodeId) ?? [];
    liste.push({ value: o.value ?? o.code ?? o.label, label: o.label, quandChoisir });
    optionsPar.set(o.nodeId, liste);
  }
  const plagesPar = new Map<string, NonNullable<CritereGrille["ranges"]>>();
  for (const r of plages) {
    const liste = plagesPar.get(r.nodeId) ?? [];
    liste.push({ minValue: r.minValue, maxValue: r.maxValue, label: r.label ?? undefined });
    plagesPar.set(r.nodeId, liste);
  }

  return feuilles.map(({ id, parent }) => {
    const n = arbre.nodesById.get(id)!;
    return {
      id,
      code: n.code,
      label: parent ? `${parent} › ${n.label}` : n.label,
      description: n.description ?? undefined,
      answerType: n.answerType ?? undefined,
      isMandatory: n.isMandatory,
      options: optionsPar.get(id),
      ranges: plagesPar.get(id),
      verrouille: verrouille.has(id),
    };
  });
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
