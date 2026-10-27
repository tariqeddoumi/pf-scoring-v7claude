/**
 * Fonctions serveur du modèle Project Finance : paramètres de la banque, calcul de
 * référence, visibilité des notes et droits sur une évaluation.
 */
import { z } from "zod";
import { getAppConfigKey, setAppConfig } from "@/lib/services/app-config-service";
import { peutVoirScores } from "@/lib/score-visibility";
import { hasMinimumRole, type UserRole } from "@/lib/permissions";
import { hasPermission } from "@/lib/services/permission-service";
import { anomaliesParametres, fusionnerParametres, GRADES, PARAMETRES_DEFAUT, type ParametresModele } from "./parametres";

export { anomaliesParametres };
import { calculer, relireSaisie, type SaisiePF } from "./saisie";
import type { ResultatPF } from "./moteur";

export const CLE_PARAMETRES = "MODELE_PF_PARAMETRES";

/** Paramètres en vigueur : valeurs candidates, surchargées par l'écran Paramétrage. */
export async function chargerParametres(): Promise<ParametresModele> {
  const brut = await getAppConfigKey(CLE_PARAMETRES);
  if (!brut) return PARAMETRES_DEFAUT;
  try {
    const v = surchargeSchema.safeParse(JSON.parse(brut));
    return v.success ? fusionnerParametres(v.data as never) : PARAMETRES_DEFAUT;
  } catch {
    return PARAMETRES_DEFAUT;
  }
}

const seuil = z.number().min(0).max(10);
const poids = z.number().min(0).max(1);
/** Surcharge admise : seuils, écarts, poids, plafonds, seuils des règles (les libellés restent ceux du modèle). */
export const surchargeSchema = z.object({
  regimes: z.partialRecord(z.enum(["R1", "R2", "R3", "R4"]), z.object({ seuils: z.tuple([seuil, seuil, seuil]) })).optional(),
  secteurs: z.partialRecord(z.enum(["ENR", "EAU", "TEL", "TRA", "POR", "SAN", "ETH", "IMMO-REND", "IND", "AGR", "TOU", "MIN"]),
    z.object({ delta: z.number().min(-1).max(1) })).optional(),
  phases: z.partialRecord(z.enum(["P1", "P2", "P3"]), z.object({ majoration: z.number().min(0).max(1) })).optional(),
  poidsDomaines: z.partialRecord(z.enum(["P1", "P2", "P3"]), z.partialRecord(z.enum(["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]), poids)).optional(),
  poidsNoyau: z.tuple([poids, poids, poids, poids, poids, poids]).optional(),
  ancres: z.object({ tresFavorable: z.number(), favorable: z.number(), vigilance: z.number(), critique: z.number(), infoInsuffisante: z.number() })
    .partial().optional(),
  correspondanceGrades: z.partialRecord(z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]), z.enum(GRADES)).optional(),
  plafonds: z.partialRecord(z.string().regex(/^C(1[0-7]|[1-9])$/), z.object({ niveau: z.number().int().min(1).max(10) })).optional(),
  climat: z.object({ lot2Actif: z.boolean(), poidsD9: z.tuple([poids, poids, poids, poids]), poidsTransition: poids }).partial().optional(),
  seuils: z.object({
    sCapex: z.number(), sExpo: z.number(), sDuree: z.number(), lCapex: z.number(), lExpo: z.number(), lNbContreparties: z.number(),
    n3TresFavorable: z.number(), n3Favorable: z.number(), n3Vigilance: z.number(),
    c1: z.number(), c3: z.number(), c4: z.number(), c6: z.number(), c7: z.number(), c8: z.number(), c9: z.number(), c10: z.number(), c13: z.number(),
    couvertureGrille: z.number(),
  }).partial().optional(),
}).strict();

export async function enregistrerParametres(surcharge: unknown, userId: string): Promise<{ parametres: ParametresModele; anomalies: string[] }> {
  const v = surchargeSchema.parse(surcharge);
  const parametres = fusionnerParametres(v as never);
  const anomalies = anomaliesParametres(parametres);
  if (anomalies.length) return { parametres, anomalies };
  await setAppConfig(CLE_PARAMETRES, JSON.stringify(v), userId);
  return { parametres, anomalies };
}

/** Clés du résultat qui révèlent la note : retirées pour les rôles qui ne voient pas les scores. */
const CLES_NOTE: (keyof ResultatPF)[] = ["score", "noteCalculee", "noteApprouvee", "plafond", "noyau", "d7", "domaines", "contributions", "libelle", "orientation"];

export function resultatVisible(r: ResultatPF | null, role: string): Partial<ResultatPF> | null {
  if (!r || peutVoirScores(role)) return r;
  const copie: Partial<ResultatPF> = { ...r };
  for (const k of CLES_NOTE) delete copie[k];
  // Note calculée du sous-critère D9.5 (volet climatique, lot 2) : masquée comme les autres notes.
  if (r.climat) copie.climat = { ...r.climat, noteTransition: null };
  return copie;
}

/** Calcul de référence, côté serveur, à chaque enregistrement. */
export function calculerEvaluation(saisie: SaisiePF, P: ParametresModele, codes: { codeClientT24?: string | null; radical?: string | null; codeProjet?: string | null }) {
  const { resultat, controles } = calculer(saisie, P, codes);
  return {
    resultat, controles,
    resume: {
      scoreGlobal: resultat.score,
      noteCalculee: resultat.noteCalculee,
      noteApprouvee: resultat.noteApprouvee === null ? null : String(resultat.noteApprouvee),
      regimeRetenu: resultat.regimeRetenu,
      statutNote: resultat.statut,
    },
  };
}

/** Saisir et modifier : le créateur du projet ou de l'évaluation, ou à partir du responsable des risques. */
export function peutSaisir(role: string, userId: string, auteurs: (string | null | undefined)[]): boolean {
  return hasPermission(role as UserRole, "evaluation", "update")
    && (auteurs.includes(userId) || hasMinimumRole(role as UserRole, "risk_manager"));
}

/**
 * Valider ou rejeter : un rôle qui approuve les évaluations, et jamais un intervenant du
 * dossier — auteur du scoring, dernier à l'avoir modifié ou soumis, créateur du projet
 * (séparation des fonctions).
 */
export function peutDecider(role: string, userId: string, intervenants: (string | null | undefined)[]): boolean {
  return !intervenants.includes(userId) && hasPermission(role as UserRole, "evaluation", "approve");
}

/**
 * Résultat d'un scoring pour les synthèses (alertes, analyses) : celui enregistré, ou à
 * défaut recalculé depuis la saisie — les scorings installés par script n'en ont pas.
 */
export function resultatCourant(
  e: { resultat: unknown; saisie: unknown; project?: { codeProjet?: string | null; client?: { codeClientT24?: string | null; radical?: string | null } | null } | null },
  P: ParametresModele
): Partial<ResultatPF> {
  if (e.resultat && typeof e.resultat === "object") return e.resultat as Partial<ResultatPF>;
  try {
    return calculerEvaluation(relireSaisie(e.saisie), P, {
      codeClientT24: e.project?.client?.codeClientT24, radical: e.project?.client?.radical, codeProjet: e.project?.codeProjet,
    }).resultat;
  } catch {
    return {};
  }
}
