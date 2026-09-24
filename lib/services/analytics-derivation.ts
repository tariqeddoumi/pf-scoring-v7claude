/**
 * Dérivation des analyses de portefeuille.
 *
 * L'écran d'analytique affichait trois tableaux codés en dur sous un commentaire
 * « Calculate analytics data » qui ne calculait rien : une distribution de notes
 * répartissant cinq dossiers entre AA, A, BBB et BB, des scores moyens par domaine, et
 * une carte de chaleur dont les valeurs portaient la mention « Mock domain scores ».
 * Aucune évaluation n'était calculée en base. Un comité de crédit pouvait lire ces
 * chiffres comme des faits.
 *
 * Tout se dérive désormais des évaluations réellement calculées. Quand il n'y en a
 * pas, le module le dit au lieu de produire des courbes.
 *
 * Module sans accès base, pour que les règles d'agrégation se testent isolément.
 */

export interface EvaluationCalculee {
  id: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  updatedAt: Date | string;
}

/** Résultat d'un domaine (nœud de profondeur 0) pour une évaluation. */
export interface ResultatDomaine {
  evaluationId: string;
  domainCode: string;
  domainLabel: string;
  rawScore: number;
  weight: number | null;
}

export interface EffectifPortefeuille {
  total: number;
  calculees: number;
  brouillons: number;
}

export interface PointTendance {
  /** Mois au format AAAA-MM. */
  mois: string;
  effectif: number;
  scoreMoyen: number;
}

export interface PartNote {
  note: string;
  effectif: number;
  part: number;
}

export interface MoyenneDomaine {
  code: string;
  label: string;
  scoreMoyen: number;
  effectif: number;
  poids: number | null;
}

export interface Analyses {
  effectif: EffectifPortefeuille;
  /** Vrai lorsqu'aucune évaluation calculée ne permet de conclure quoi que ce soit. */
  sansDonnees: boolean;
  scoreMoyen: number | null;
  tendance: PointTendance[];
  distributionNotes: PartNote[];
  moyennesParDomaine: MoyenneDomaine[];
}

/** Une évaluation ne compte que si le moteur lui a réellement attribué un score. */
function estCalculee(ev: EvaluationCalculee): boolean {
  return ev.finalScore !== null && Number.isFinite(ev.finalScore);
}

function moyenne(valeurs: number[]): number {
  return valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
}

function mois(date: Date | string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function deriverAnalyses(
  evaluations: EvaluationCalculee[],
  resultatsDomaines: ResultatDomaine[]
): Analyses {
  const calculees = evaluations.filter(estCalculee);

  const effectif: EffectifPortefeuille = {
    total: evaluations.length,
    calculees: calculees.length,
    brouillons: evaluations.filter((e) => e.status === "brouillon").length,
  };

  if (calculees.length === 0) {
    return {
      effectif,
      sansDonnees: true,
      scoreMoyen: null,
      tendance: [],
      distributionNotes: [],
      moyennesParDomaine: [],
    };
  }

  const parMois = new Map<string, number[]>();
  for (const ev of calculees) {
    const cle = mois(ev.updatedAt);
    parMois.set(cle, [...(parMois.get(cle) ?? []), ev.finalScore as number]);
  }
  const tendance: PointTendance[] = Array.from(parMois.entries())
    .map(([m, scores]) => ({
      mois: m,
      effectif: scores.length,
      scoreMoyen: moyenne(scores),
    }))
    .sort((a, b) => a.mois.localeCompare(b.mois));

  // Seules les notes effectivement attribuées figurent : afficher toute l'échelle
  // AAA…D avec des zéros laisserait croire à un portefeuille couvrant l'échelle.
  const parNote = new Map<string, number>();
  for (const ev of calculees) {
    if (!ev.rating) continue;
    parNote.set(ev.rating, (parNote.get(ev.rating) ?? 0) + 1);
  }
  const notees = Array.from(parNote.values()).reduce((s, n) => s + n, 0);
  const distributionNotes: PartNote[] = Array.from(parNote.entries())
    .map(([note, n]) => ({
      note,
      effectif: n,
      part: notees > 0 ? (n / notees) * 100 : 0,
    }))
    .sort((a, b) => b.effectif - a.effectif || a.note.localeCompare(b.note));

  const idsCalculees = new Set(calculees.map((e) => e.id));
  const parDomaine = new Map<string, ResultatDomaine[]>();
  for (const r of resultatsDomaines) {
    if (!idsCalculees.has(r.evaluationId)) continue;
    parDomaine.set(r.domainCode, [...(parDomaine.get(r.domainCode) ?? []), r]);
  }
  const moyennesParDomaine: MoyenneDomaine[] = Array.from(parDomaine.entries())
    .map(([code, lignes]) => ({
      code,
      label: lignes[0].domainLabel,
      scoreMoyen: moyenne(lignes.map((l) => l.rawScore)),
      effectif: lignes.length,
      poids: lignes[0].weight,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));

  return {
    effectif,
    sansDonnees: false,
    scoreMoyen: moyenne(calculees.map((e) => e.finalScore as number)),
    tendance,
    distributionNotes,
    moyennesParDomaine,
  };
}

/** Libellé du mois en français, à partir d'une clé AAAA-MM. */
export function libelleMois(cle: string): string {
  const [annee, m] = cle.split("-");
  const noms = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  const index = Number(m) - 1;
  return index >= 0 && index < 12 ? `${noms[index]} ${annee}` : cle;
}
