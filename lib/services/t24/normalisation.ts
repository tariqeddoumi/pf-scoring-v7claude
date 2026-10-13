/**
 * Lecture d'une réponse T24 (Temenos T24 / Transact) en signalétique de l'outil.
 *
 * Les banques exposent T24 de plusieurs façons : API Transact (IRIS, champs en
 * camelCase : shortName, customerSince, accountOfficer…), messages OFS ou bus de
 * services reprenant les noms de l'application CUSTOMER (SHORT.NAME, NAME.1,
 * LEGAL.ID, CUSTOMER.LIABILITY…). Les clés sont comparées sans casse ni ponctuation,
 * ce qui reconnaît les deux écritures. Une correspondance explicite
 * (paramètre T24_CORRESPONDANCE) l'emporte pour les champs propres à la banque
 * (champs locaux, tables maison).
 *
 * Ne sont repris que des champs reconnus et lisibles : une valeur codée (SECTOR = 1001)
 * ou hors référentiel (KYC « 3 ») n'est pas recopiée, la saisie manuelle prend le
 * relais.
 */

import {
  CLASSIFICATIONS_BAM,
  NIVEAUX_RISQUE_LBC,
  RATINGS_INTERNES,
  STATUTS_KYC,
  type OptionReferentiel,
} from "@/lib/referentiels";

/** Champs de la fiche client qu'un rapatriement T24 peut remplir. */
export const CHAMPS_IMPORTABLES = [
  "nom",
  "raisonSociale",
  "formeJuridique",
  "ice",
  "registreCommerce",
  "identifiantFiscal",
  "dateCreationSociete",
  "pays",
  "ville",
  "adresse",
  "telephone",
  "email",
  "secteur",
  "gestionnaire",
  "centreAffaires",
  "dateRelation",
  "ratingInterne",
  "classificationBAM",
  "exposition",
  "statusKYC",
  "niveauRisqueLBC",
  "capitalSocial",
  "chiffreAffaires",
  "fondsPropres",
] as const;

export type ChampImportable = (typeof CHAMPS_IMPORTABLES)[number];
export type ValeurImportee = string | number;

export interface FicheClientT24 {
  codeClientT24: string;
  champs: Partial<Record<ChampImportable, ValeurImportee>>;
  groupe: { code: string | null; nom: string | null } | null;
}

export interface FicheGroupeT24 {
  code: string;
  nom: string | null;
  paysSiege: string | null;
  secteurPrincipal: string | null;
  ratingGroupe: string | null;
}

/** Correspondance explicite : champ de l'outil → chemin dans la réponse (a.b.0.c). */
export type Correspondance = Record<string, string>;

const cle = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

type Brut = unknown;

/** Le corps utile : enveloppe { header, body } et tableau d'un élément retirés. */
export function deballer(reponse: Brut): Record<string, unknown> | null {
  let r = reponse;
  for (let i = 0; i < 3; i++) {
    if (Array.isArray(r)) r = r[0];
    else if (r && typeof r === "object" && "body" in r)
      r = (r as { body: unknown }).body;
    else break;
  }
  return r && typeof r === "object" && !Array.isArray(r)
    ? (r as Record<string, unknown>)
    : null;
}

/** Index des valeurs simples par clé normalisée (la première rencontrée l'emporte). */
function indexer(racine: Record<string, unknown>): Map<string, unknown> {
  const index = new Map<string, unknown>();
  const parcourir = (v: unknown, k: string | null, profondeur: number) => {
    if (profondeur > 6 || v === null || v === undefined) return;
    if (Array.isArray(v)) {
      // Champ multivalué (STREET, PHONE.1…) : valeurs simples jointes ; objets parcourus.
      const simples = v.filter(
        (x) => typeof x === "string" || typeof x === "number"
      );
      if (k && simples.length > 0 && !index.has(k))
        index.set(k, simples.join(" "));
      v.filter((x) => x && typeof x === "object").forEach((x) =>
        parcourir(x, null, profondeur + 1)
      );
      return;
    }
    if (typeof v === "object") {
      for (const [sous, val] of Object.entries(v as Record<string, unknown>)) {
        parcourir(val, cle(sous), profondeur + 1);
      }
      return;
    }
    if (k && !index.has(k)) index.set(k, v);
  };
  parcourir(racine, null, 0);
  return index;
}

function premier(index: Map<string, unknown>, alias: string[]): unknown {
  for (const a of alias) {
    const v = index.get(cle(a));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function texte(v: unknown, max = 200): string | undefined {
  if (v === undefined || v === null) return undefined;
  const t = String(v).replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : undefined;
}

function nombre(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

/** Dates T24 (AAAAMMJJ) ou ISO, rendues en AAAA-MM-JJ. */
export function dateT24(v: unknown): string | undefined {
  const t = texte(v, 40);
  if (!t) return undefined;
  const compacte = t.match(/^(\d{4})(\d{2})(\d{2})$/);
  const iso = compacte
    ? `${compacte[1]}-${compacte[2]}-${compacte[3]}`
    : t.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso))
    ? iso
    : undefined;
}

let nomsPays: Intl.DisplayNames | null = null;
/** Code pays ISO (MA) en nom français (Maroc) ; un nom déjà lisible est gardé. */
export function paysLisible(v: unknown): string | undefined {
  const t = texte(v, 100);
  if (!t) return undefined;
  if (/^[A-Za-z]{2}$/.test(t)) {
    try {
      nomsPays ??= new Intl.DisplayNames(["fr"], { type: "region" });
      const nom = nomsPays.of(t.toUpperCase());
      if (nom && nom.toUpperCase() !== t.toUpperCase()) return nom;
    } catch {
      /* code inconnu : gardé tel quel */
    }
  }
  return t;
}

/** Une valeur n'est reprise que si elle appartient au référentiel de l'outil. */
function dansReferentiel(
  v: unknown,
  liste: OptionReferentiel[],
  synonymes: Record<string, string> = {}
) {
  const t = texte(v, 60);
  if (!t) return undefined;
  const n = cle(t);
  const syn = synonymes[n];
  if (syn) return syn;
  return liste.find((o) => cle(o.valeur) === n || cle(o.libelle) === n)?.valeur;
}

/** Valeurs lisibles seulement : un code numérique (SECTOR = 1001) n'apprend rien. */
const lisible = (v: unknown) => {
  const t = texte(v);
  return t && /[A-Za-zÀ-ÿ]/.test(t) ? t : undefined;
};

/** Identifiants légaux : paires (type de pièce, numéro) de LEGAL.DOC.NAME / LEGAL.ID. */
function identifiantsLegaux(
  racine: Record<string, unknown>
): Record<"ice" | "rc" | "if", string> {
  const trouves: Partial<Record<"ice" | "rc" | "if", string>> = {};
  const classer = (type: unknown, numero: unknown) => {
    const t = cle(String(type ?? ""));
    const n = texte(numero, 60);
    if (!n) return;
    if (t.includes("ice")) trouves.ice ??= n.replace(/\s/g, "");
    else if (
      t === "rc" ||
      t.includes("registre") ||
      t.includes("commerc") ||
      t.includes("tradereg")
    )
      trouves.rc ??= n;
    else if (t === "if" || t.includes("fiscal") || t.includes("tax"))
      trouves.if ??= n.replace(/\s/g, "");
  };
  const parcourir = (v: unknown, profondeur: number) => {
    if (profondeur > 6 || !v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach((x) => parcourir(x, profondeur + 1));
    const o = v as Record<string, unknown>;
    const parCle = new Map(Object.entries(o).map(([k, val]) => [cle(k), val]));
    const types =
      parCle.get("legaldocname") ??
      parCle.get("legaldocumentname") ??
      parCle.get("legaliddocumentname");
    const numeros = parCle.get("legalid") ?? parCle.get("legalidentifier");
    if (types !== undefined && numeros !== undefined) {
      const ts = Array.isArray(types) ? types : [types];
      const ns = Array.isArray(numeros) ? numeros : [numeros];
      ts.forEach((t, i) => classer(t, ns[i]));
    }
    Object.values(o).forEach((x) => parcourir(x, profondeur + 1));
  };
  parcourir(racine, 0);
  return trouves as Record<"ice" | "rc" | "if", string>;
}

/** Valeur au chemin a.b.0.c (correspondance explicite). */
export function aChemin(racine: unknown, chemin: string): unknown {
  return chemin.split(".").reduce<unknown>((v, morceau) => {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v) && /^\d+$/.test(morceau)) return v[Number(morceau)];
    if (typeof v === "object") return (v as Record<string, unknown>)[morceau];
    return undefined;
  }, racine);
}

const NIVEAUX_LBC_ANGLAIS: Record<string, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
};

/** Mise en forme d'une valeur brute selon le champ (date, nombre, référentiel…). */
function formater(
  champ: ChampImportable,
  v: unknown
): ValeurImportee | undefined {
  switch (champ) {
    case "dateCreationSociete":
    case "dateRelation":
      return dateT24(v);
    case "exposition":
    case "capitalSocial":
    case "chiffreAffaires":
    case "fondsPropres":
      return nombre(v);
    case "pays":
      return paysLisible(v);
    case "ratingInterne":
      return dansReferentiel(v, RATINGS_INTERNES);
    case "classificationBAM":
      return dansReferentiel(v, CLASSIFICATIONS_BAM);
    case "statusKYC":
      return dansReferentiel(v, STATUTS_KYC);
    case "niveauRisqueLBC":
      return dansReferentiel(v, NIVEAUX_RISQUE_LBC, NIVEAUX_LBC_ANGLAIS);
    case "ice": {
      const t = texte(v, 30)?.replace(/\s/g, "");
      return t && /^\d{15}$/.test(t) ? t : undefined;
    }
    case "identifiantFiscal": {
      const t = texte(v, 30)?.replace(/\s/g, "");
      return t && /^\d{1,15}$/.test(t) ? t : undefined;
    }
    case "secteur":
    case "formeJuridique":
    case "gestionnaire":
    case "centreAffaires":
      return lisible(v);
    case "email": {
      const t = texte(v, 200);
      return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : undefined;
    }
    default:
      return texte(v, champ === "adresse" ? 500 : 200);
  }
}

/** Noms usuels de chaque champ dans T24 (CUSTOMER) et dans l'API Transact. */
const ALIAS: Record<ChampImportable, string[]> = {
  nom: ["SHORT.NAME", "shortName", "customerName", "mnemonic"],
  raisonSociale: [
    "NAME.1",
    "name1",
    "legalName",
    "customerFullName",
    "fullName",
    "name",
  ],
  formeJuridique: ["legalForm", "LEGAL.FORM", "legalEntityType", "companyType"],
  ice: ["ice", "identifiantCommunEntreprise"],
  registreCommerce: ["registreCommerce", "tradeRegisterNumber", "rcNumber"],
  identifiantFiscal: ["identifiantFiscal", "taxId", "taxIdentificationNumber"],
  dateCreationSociete: [
    "BIRTH.INCORP.DATE",
    "birthIncorpDate",
    "dateOfIncorporation",
    "incorporationDate",
  ],
  pays: [
    "RESIDENCE",
    "residence",
    "residenceCountry",
    "country",
    "NATIONALITY",
    "nationality",
  ],
  ville: ["TOWN.COUNTRY", "townCountry", "town", "city"],
  adresse: ["STREET", "street", "address", "addressLine1"],
  telephone: [
    "PHONE.1",
    "phone1",
    "phoneNumber",
    "phone",
    "telephone",
    "SMS.1",
    "mobile",
  ],
  email: ["EMAIL.1", "email1", "email", "emailAddress"],
  secteur: [
    "industryName",
    "industryDescription",
    "industry",
    "sectorName",
    "sectorDescription",
  ],
  gestionnaire: [
    "accountOfficerName",
    "relationshipManagerName",
    "accountOfficer",
    "ACCOUNT.OFFICER",
  ],
  centreAffaires: ["branchName", "companyName", "branch"],
  dateRelation: ["CUSTOMER.SINCE", "customerSince", "relationshipStartDate"],
  ratingInterne: [
    "internalRating",
    "CUSTOMER.RATING",
    "customerRating",
    "creditRating",
  ],
  classificationBAM: [
    "classificationBam",
    "loanClassification",
    "classification",
  ],
  exposition: ["totalExposure", "exposure", "totalLiability", "utilisedAmount"],
  statusKYC: ["kycStatus", "KYC.STATUS", "kycComplete"],
  niveauRisqueLBC: ["amlRisk", "amlRiskRating", "AML.RISK", "riskClass"],
  capitalSocial: ["shareCapital", "capital"],
  chiffreAffaires: ["annualTurnover", "turnover", "netSales"],
  fondsPropres: ["netWorth", "equity", "shareholdersEquity"],
};

const ALIAS_GROUPE_CODE = [
  "CUSTOMER.LIABILITY",
  "customerLiability",
  "liabilityNumber",
  "groupId",
  "groupCode",
  "customerGroup",
];
const ALIAS_GROUPE_NOM = ["groupName", "liabilityName", "customerGroupName"];

/** Signalétique client à partir d'une réponse T24. */
export function normaliserClient(
  codeDemande: string,
  reponse: Brut,
  correspondance: Correspondance = {}
): FicheClientT24 | null {
  const racine = deballer(reponse);
  if (!racine) return null;
  const index = indexer(racine);
  const champs: FicheClientT24["champs"] = {};

  for (const champ of CHAMPS_IMPORTABLES) {
    const brut = premier(index, ALIAS[champ]);
    const v = formater(champ, brut);
    if (v !== undefined) champs[champ] = v;
  }

  // NAME.1 + NAME.2 : la raison sociale longue est coupée en deux lignes dans T24.
  const nom2 = texte(premier(index, ["NAME.2", "name2"]));
  if (
    nom2 &&
    typeof champs.raisonSociale === "string" &&
    !champs.raisonSociale.includes(nom2)
  ) {
    champs.raisonSociale = `${champs.raisonSociale} ${nom2}`.slice(0, 200);
  }

  const legaux = identifiantsLegaux(racine);
  if (!champs.ice && legaux.ice) {
    const v = formater("ice", legaux.ice);
    if (v !== undefined) champs.ice = v;
  }
  if (!champs.registreCommerce && legaux.rc)
    champs.registreCommerce = legaux.rc.slice(0, 100);
  if (!champs.identifiantFiscal && legaux.if) {
    const v = formater("identifiantFiscal", legaux.if);
    if (v !== undefined) champs.identifiantFiscal = v;
  }

  let groupe: FicheClientT24["groupe"] = null;
  const codeGroupe = texte(premier(index, ALIAS_GROUPE_CODE), 35);
  const nomGroupe = texte(premier(index, ALIAS_GROUPE_NOM));

  // Correspondance explicite de la banque : elle prime sur la reconnaissance usuelle.
  let codeGroupeExplicite: string | undefined;
  let nomGroupeExplicite: string | undefined;
  for (const [champ, chemin] of Object.entries(correspondance)) {
    const brut = aChemin(reponse, chemin) ?? aChemin(racine, chemin);
    if (champ === "groupeCode") codeGroupeExplicite = texte(brut, 35);
    else if (champ === "groupeNom") nomGroupeExplicite = texte(brut);
    else if ((CHAMPS_IMPORTABLES as readonly string[]).includes(champ)) {
      const v = formater(champ as ChampImportable, brut);
      if (v !== undefined) champs[champ as ChampImportable] = v;
    }
  }

  const code = codeGroupeExplicite ?? codeGroupe;
  const nom = nomGroupeExplicite ?? nomGroupe;
  // Dans T24, CUSTOMER.LIABILITY vaut le code client lui-même pour un client isolé.
  if ((code && code !== codeDemande) || nom) {
    groupe = {
      code:
        code && /^[A-Za-z0-9._-]{1,35}$/.test(code) && code !== codeDemande
          ? code
          : null,
      nom: nom ?? null,
    };
  }

  // Le code demandé fait foi : un « id » de la réponse peut désigner autre chose.
  return { codeClientT24: codeDemande, champs, groupe };
}

/** Groupe d'affaires à partir d'une réponse T24. */
export function normaliserGroupe(
  codeDemande: string,
  reponse: Brut,
  correspondance: Correspondance = {}
): FicheGroupeT24 | null {
  const racine = deballer(reponse);
  if (!racine) return null;
  const index = indexer(racine);
  const explicite = (c: string) =>
    correspondance[c]
      ? (aChemin(reponse, correspondance[c]) ??
        aChemin(racine, correspondance[c]))
      : undefined;
  const nom = texte(
    explicite("groupeNom") ??
      premier(index, [
        "groupName",
        "SHORT.NAME",
        "shortName",
        "NAME.1",
        "name",
        "description",
      ])
  );
  return {
    code: codeDemande,
    nom: nom ?? null,
    paysSiege:
      paysLisible(premier(index, ["RESIDENCE", "residence", "country"])) ??
      null,
    secteurPrincipal:
      lisible(
        premier(index, ["industryName", "industryDescription", "sectorName"])
      ) ?? null,
    ratingGroupe:
      dansReferentiel(
        premier(index, ["groupRating", "internalRating", "rating"]),
        RATINGS_INTERNES
      ) ?? null,
  };
}
