/**
 * Valeurs du formulaire de signalétique client et conversion vers la charge de
 * l'API (partagées par le formulaire, ses pages et les tests).
 */

export interface ValeursClient {
  // Identification
  codeClientT24: string;
  /** Radical client (7 chiffres) */
  radical: string;
  nom: string;
  raisonSociale: string;
  formeJuridique: string;
  typeClient: string;
  segmentClientele: string;
  ice: string;
  registreCommerce: string;
  identifiantFiscal: string;
  dateCreationSociete: string;
  pays: string;
  ville: string;
  adresse: string;
  /** Banque qui porte la relation ("" = celle de l'utilisateur). */
  entiteId: string;
  // Groupe d'affaires
  groupeCode: string;
  groupeNom: string;
  roleGroupe: string;
  // Activité, solidité financière, expérience
  secteur: string;
  description: string;
  exerciceReference: string;
  chiffreAffaires: string;
  fondsPropres: string;
  capitalSocial: string;
  experienceSecteurAnnees: string;
  projetsSimilaires: string;
  // Notation et risque
  ratingInterne: string;
  notationExterne: string;
  agenceNotation: string;
  classificationBAM: string;
  exposition: string;
  // Relation bancaire
  gestionnaire: string;
  centreAffaires: string;
  dateRelation: string;
  statutBancaire: string;
  status: string;
  // Conformité
  statusKYC: string;
  dateRevueKYC: string;
  niveauRisqueLBC: string;
  ppe: string;
  statusConformite: string;
  // Contact
  telephone: string;
  email: string;
}

export const VALEURS_CLIENT_VIDES: ValeursClient = {
  codeClientT24: "",
  radical: "",
  nom: "",
  raisonSociale: "",
  formeJuridique: "",
  typeClient: "",
  segmentClientele: "",
  ice: "",
  registreCommerce: "",
  identifiantFiscal: "",
  dateCreationSociete: "",
  pays: "Maroc",
  ville: "",
  adresse: "",
  entiteId: "",
  groupeCode: "",
  groupeNom: "",
  roleGroupe: "",
  secteur: "",
  description: "",
  exerciceReference: "",
  chiffreAffaires: "",
  fondsPropres: "",
  capitalSocial: "",
  experienceSecteurAnnees: "",
  projetsSimilaires: "",
  ratingInterne: "",
  notationExterne: "",
  agenceNotation: "",
  classificationBAM: "",
  exposition: "",
  gestionnaire: "",
  centreAffaires: "",
  dateRelation: "",
  statutBancaire: "",
  status: "Actif",
  statusKYC: "",
  dateRevueKYC: "",
  niveauRisqueLBC: "",
  ppe: "",
  statusConformite: "",
  telephone: "",
  email: "",
};

export type Cle = keyof ValeursClient;

const MONTANTS: Cle[] = [
  "chiffreAffaires",
  "fondsPropres",
  "capitalSocial",
  "exposition",
];
const ENTIERS: Cle[] = [
  "exerciceReference",
  "experienceSecteurAnnees",
  "projetsSimilaires",
];
const DATES: Cle[] = ["dateCreationSociete", "dateRelation", "dateRevueKYC"];
export const GROUPE: Cle[] = ["groupeCode", "groupeNom"];

/** Fiche renvoyée par l'API → valeurs de formulaire. */
export function versValeursClient(c: Record<string, unknown>): ValeursClient {
  const texte = (v: unknown) =>
    v === null || v === undefined ? "" : String(v);
  const v = Object.fromEntries(
    (Object.keys(VALEURS_CLIENT_VIDES) as Cle[]).map((k) => [k, texte(c[k])])
  ) as unknown as ValeursClient;
  for (const d of DATES) v[d] = c[d] ? String(c[d]).slice(0, 10) : "";
  const groupe = c.groupeAffaires as
    | { code?: string | null; nom?: string }
    | null
    | undefined;
  v.groupeCode = groupe?.code ?? "";
  v.groupeNom = groupe?.nom ?? "";
  v.ppe = c.ppe === true ? "oui" : c.ppe === false ? "non" : "";
  if (!v.status) v.status = "Actif";
  return v;
}

/** Champs repris de T24 enregistrés sur la fiche. */
export function champsT24De(c: Record<string, unknown>): string[] {
  return Array.isArray(c.champsT24)
    ? c.champsT24.filter((x): x is string => typeof x === "string")
    : [];
}

/**
 * Ce que l'API attend pour les champs donnés : chaînes vides en null, nombres en
 * nombres, PPE en booléen, groupe en objet { code, nom } (ou null pour le détacher).
 */
export function versPayloadClient(
  v: Partial<ValeursClient>
): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  for (const [cle, brute] of Object.entries(v) as [Cle, string][]) {
    if (GROUPE.includes(cle)) continue;
    const valeur = (brute ?? "").trim();
    if (MONTANTS.includes(cle) || ENTIERS.includes(cle)) {
      sortie[cle] = valeur === "" ? null : Number(valeur);
    } else if (cle === "ppe") {
      sortie.ppe = valeur === "oui" ? true : valeur === "non" ? false : null;
    } else {
      sortie[cle] = valeur === "" ? null : valeur;
    }
  }
  if ("nom" in v) sortie.nom = (v.nom ?? "").trim();
  if ("groupeCode" in v || "groupeNom" in v) {
    const nom = (v.groupeNom ?? "").trim();
    const code = (v.groupeCode ?? "").trim();
    sortie.groupe = nom ? { code: code || null, nom } : null;
  }
  return sortie;
}

// ─── Actionnariat et bénéficiaires effectifs ───

export interface LigneActionnaire {
  /** Clé locale de la ligne (React), sans valeur métier. */
  cle: string;
  typePersonne: "Personne physique" | "Personne morale";
  nom: string;
  qualite: "Actionnaire" | "Dirigeant" | "Actionnaire et dirigeant";
  pays: string;
  identifiant: string;
  pourcentage: string;
  beneficiaireEffectif: boolean;
  ppe: boolean;
}

let compteurLignes = 0;
export function nouvelleLigneActionnaire(): LigneActionnaire {
  compteurLignes += 1;
  return {
    cle: `l${compteurLignes}`,
    typePersonne: "Personne physique",
    nom: "",
    qualite: "Actionnaire",
    pays: "",
    identifiant: "",
    pourcentage: "",
    beneficiaireEffectif: false,
    ppe: false,
  };
}

/** Actionnaires renvoyés par l'API → lignes du formulaire. */
export function versLignesActionnaires(liste: unknown): LigneActionnaire[] {
  if (!Array.isArray(liste)) return [];
  return liste.map((a: Record<string, unknown>) => ({
    ...nouvelleLigneActionnaire(),
    typePersonne:
      a.typePersonne === "Personne morale"
        ? "Personne morale"
        : "Personne physique",
    nom: String(a.nom ?? ""),
    qualite:
      a.qualite === "Dirigeant" || a.qualite === "Actionnaire et dirigeant"
        ? a.qualite
        : "Actionnaire",
    pays: String(a.pays ?? ""),
    identifiant: String(a.identifiant ?? ""),
    pourcentage:
      a.pourcentageDetention == null ? "" : String(a.pourcentageDetention),
    beneficiaireEffectif: a.beneficiaireEffectif === true,
    ppe: a.ppe === true,
  }));
}

const ligneVide = (l: LigneActionnaire) =>
  !l.nom.trim() &&
  !l.pays.trim() &&
  !l.identifiant.trim() &&
  !l.pourcentage.trim() &&
  !l.beneficiaireEffectif &&
  !l.ppe;

/** Lignes → charge de l'API (les lignes laissées vides sont ignorées). */
export function versPayloadActionnaires(
  lignes: LigneActionnaire[]
): Record<string, unknown>[] {
  return lignes
    .filter((l) => !ligneVide(l))
    .map((l) => ({
      typePersonne: l.typePersonne,
      nom: l.nom.trim(),
      qualite: l.qualite,
      pays: l.pays.trim() || null,
      identifiant: l.identifiant.trim() || null,
      pourcentageDetention:
        l.pourcentage.trim() === ""
          ? null
          : Number(l.pourcentage.replace(",", ".")),
      beneficiaireEffectif: l.beneficiaireEffectif,
      ppe: l.ppe,
    }));
}

/** Contrôles de cohérence de l'actionnariat, affichés pendant la saisie. */
export function controlesActionnariat(
  lignes: LigneActionnaire[],
  seuil: number
) {
  const remplies = lignes.filter((l) => !ligneVide(l));
  const total = remplies.reduce(
    (s, l) => s + (Number(l.pourcentage.replace(",", ".")) || 0),
    0
  );
  return {
    nombre: remplies.length,
    total,
    depasse: total > 100.0001,
    aucunBeneficiaire:
      remplies.length > 0 && !remplies.some((l) => l.beneficiaireEffectif),
    /** Personnes physiques au-delà du seuil non déclarées bénéficiaires effectifs. */
    aDeclarer: remplies
      .filter(
        (l) =>
          l.typePersonne === "Personne physique" &&
          !l.beneficiaireEffectif &&
          (Number(l.pourcentage.replace(",", ".")) || 0) >= seuil
      )
      .map((l) => l.nom.trim() || "(sans nom)"),
    ppe: remplies.some((l) => l.ppe),
  };
}
