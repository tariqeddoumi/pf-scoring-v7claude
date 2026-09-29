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
  /** Dossier noté, pour relier les chiffres aux évaluations qui les produisent. */
  projectId?: string | null;
  projectName?: string | null;
  montant?: number | null;
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
  /** Évaluations calculées mais rejetées : hors portefeuille, donc hors moyennes. */
  rejetees: number;
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

/** Un dossier noté, tel qu'il figure sous les agrégats. */
export interface DossierNote {
  evaluationId: string;
  projectId: string | null;
  projectName: string;
  score: number;
  note: string | null;
  date: string;
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
  /** Encours des dossiers notés, hors rejetés. */
  encoursNote: number;
  /** Part des dossiers notés BBB ou mieux, en pourcentage. */
  partInvestissement: number | null;
  dossiers: DossierNote[];
  tendance: PointTendance[];
  distributionNotes: PartNote[];
  moyennesParDomaine: MoyenneDomaine[];
}

/** Une évaluation ne compte que si le moteur lui a réellement attribué un score. */
function estCalculee(ev: EvaluationCalculee): boolean {
  return ev.finalScore !== null && Number.isFinite(ev.finalScore);
}

/**
 * Un dossier rejeté n'est pas au portefeuille : le compter tirait la moyenne vers le
 * bas et faisait figurer sa note dans la répartition, comme s'il avait été octroyé.
 */
function estAuPortefeuille(ev: EvaluationCalculee): boolean {
  return estCalculee(ev) && ev.status !== "rejete" && ev.status !== "rejetee";
}

/**
 * Ordre du barème de crédit. La répartition était triée par effectif puis par ordre
 * alphabétique, ce qui plaçait B avant BB — une échelle de notation ne se lit pas
 * dans cet ordre.
 */
const ORDRE_NOTES = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "CC", "C", "D"];

function rangNote(note: string): number {
  const i = ORDRE_NOTES.indexOf(note.toUpperCase());
  return i === -1 ? ORDRE_NOTES.length : i;
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
  // « calculees » désigne désormais les dossiers au portefeuille : les évaluations
  // rejetées restent comptées à part, elles ne nourrissent plus les moyennes.
  const calculees = evaluations.filter(estAuPortefeuille);

  const effectif: EffectifPortefeuille = {
    total: evaluations.length,
    calculees: calculees.length,
    brouillons: evaluations.filter((e) => e.status === "brouillon").length,
    rejetees: evaluations.filter((e) => estCalculee(e) && !estAuPortefeuille(e)).length,
  };

  if (calculees.length === 0) {
    return {
      effectif,
      sansDonnees: true,
      scoreMoyen: null,
      encoursNote: 0,
      partInvestissement: null,
      dossiers: [],
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
    .sort((a, b) => rangNote(a.note) - rangNote(b.note) || a.note.localeCompare(b.note));

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

  const notees2 = calculees.filter((e) => e.rating);
  const partInvestissement =
    notees2.length > 0
      ? (notees2.filter((e) => rangNote(e.rating as string) <= rangNote("BBB")).length /
          notees2.length) *
        100
      : null;

  const dossiers: DossierNote[] = calculees
    .map((e) => ({
      evaluationId: e.id,
      projectId: e.projectId ?? null,
      projectName: e.projectName ?? "Dossier sans nom",
      score: e.finalScore as number,
      note: e.rating,
      date: new Date(e.updatedAt).toISOString(),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    effectif,
    sansDonnees: false,
    scoreMoyen: moyenne(calculees.map((e) => e.finalScore as number)),
    encoursNote: calculees.reduce((s, e) => s + (e.montant ?? 0), 0),
    partInvestissement,
    dossiers,
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
