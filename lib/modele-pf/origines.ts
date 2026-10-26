/**
 * Origine des valeurs de la saisie : quand une valeur n'est pas tapée par l'analyste
 * (proposition de l'IA acceptée, calcul d'aide, scénario de référence, collage depuis
 * Excel), la saisie garde d'où elle vient, par clé du fichier d'échange (champs-ia.ts).
 *
 * L'écran compare la valeur actuelle à la valeur d'origine : si l'analyste l'a modifiée
 * depuis, l'origine reste affichée comme « valeur initiale ». Les origines « ia » ne
 * s'écrivent que côté serveur, à l'acceptation d'une proposition : une saisie envoyée
 * par le navigateur ne peut ni en créer ni en effacer.
 */
import { z } from "zod";

export const TYPES_ORIGINE = ["ia", "calcul", "reference", "collage"] as const;
export type TypeOrigine = (typeof TYPES_ORIGINE)[number];

export const origineSchema = z.object({
  type: z.enum(TYPES_ORIGINE),
  /** Valeur écrite à l'origine (forme canonique du fichier d'échange). */
  valeur: z.union([z.string().max(5000), z.number().finite()]).nullable().default(null),
  /** Pièce et emplacement (« Rapport technique.pdf, p. 12 »), ou description du calcul. */
  source: z.string().max(500).default(""),
  /** Justification de l'IA ou détail du calcul. */
  detail: z.string().max(2000).default(""),
  confiance: z.enum(["elevee", "moyenne", "faible"]).nullable().default(null),
  /** Date ISO de l'écriture et auteur de l'acceptation. */
  le: z.string().max(40).default(""),
  par: z.string().max(80).default(""),
});

export type OrigineChamp = z.infer<typeof origineSchema>;

export const originesSchema = z.record(z.string().max(80), origineSchema).default({});
export type Origines = z.infer<typeof originesSchema>;

/**
 * Origines à conserver à l'enregistrement d'une saisie : celles de l'IA viennent de la
 * version en base (le navigateur ne peut pas en forger) ; une origine non IA envoyée
 * (calcul, référence, collage) remplace celle de la même clé, car elle est plus récente.
 */
export function fusionnerOrigines(envoyees: Origines | undefined, enBase: Origines | undefined): Origines {
  const out: Origines = {};
  for (const [cle, o] of Object.entries(enBase ?? {})) if (o.type === "ia") out[cle] = o;
  for (const [cle, o] of Object.entries(envoyees ?? {})) if (o.type !== "ia") out[cle] = o;
  return out;
}

/** Les deux valeurs sont-elles les mêmes (la valeur d'origine est toujours en place) ? */
export function memeValeur(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
  return norm(a) === norm(b);
}

export const LIBELLES_ORIGINE: Record<TypeOrigine, string> = {
  ia: "Proposé par l'IA",
  calcul: "Calculé par l'aide de l'outil",
  reference: "Repris de la bibliothèque de référence",
  collage: "Collé depuis Excel",
};

export const LIBELLES_CONFIANCE = { elevee: "confiance élevée", moyenne: "confiance moyenne", faible: "confiance faible" } as const;

/**
 * Cible d'un champ de l'écran (nom de la saisie) → clé du fichier d'échange, quand elles
 * diffèrent. Les autres cibles portent déjà le nom de la clé.
 */
export const CLE_DE_LA_CIBLE: Record<string, string> = {
  exposition: "expo", toutEnMad: "mad", technologieEprouvee: "techno", epcCleEnMain: "epc18", acheteurUnique: "unique",
  premiereReference: "premiere", contratPlus20Ans: "plus20", climatEleve: "climat", nbContreparties: "nbcp",
  planRemediation: "remediation", descriptionStress: "choc.description", n3Llcr: "n3_llcr", dsraMois: "dsra",
  expositionDevises: "fx", detteARefinancer: "refi", strategieRefinancement: "strat", partAcheteur: "part_ach",
  qualiteAcheteur: "qual", dureeContrat: "duree_contrat", dureeDette: "duree_dette", solutionContrat: "solution",
  planClimat: "plan_adapt", capaciteSponsor: "sponsor", operateurRemplacable: "operateur", ecartOm: "ecart_om",
  expositionGroupe: "facteur", synthese: "bloc13.synthese", forces: "bloc13.forces", faiblesses: "bloc13.faiblesses",
  conditions: "bloc13.conditions", justification: "bloc13.justif", avis: "bloc13.avis", avisMotif: "bloc13.avis.motif",
};

export const cleDeLaCible = (cible: string) => CLE_DE_LA_CIBLE[cible] ?? cible;
