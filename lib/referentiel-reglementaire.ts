/**
 * Registre des textes de référence et de leur traduction en contrôles.
 *
 * L'application affichait un « cadre de référence » générique (« conforme BAM »).
 * Chaque texte porte ici son type, sa date, ses articles, sa date d'effet, son champ
 * et la conséquence attendue dans l'outil, pour éviter les confusions (la Circulaire
 * 1/W/2025 sur les créances n'est pas la Directive 1/W/2025 sur le climat) et ne pas
 * présenter comme applicable un texte qui ne l'est pas encore.
 *
 * Contenu repris du rapport de diagnostic du 5 octobre 2026 (sources officielles
 * consultées à cette date) : À VALIDER par la Conformité et le Juridique, qui sont
 * propriétaires du registre et de sa revue.
 */
export interface TexteReference {
  code: string;
  emetteur: string;
  type: "Directive" | "Circulaire" | "Instruction" | "Loi" | "Standard international";
  intitule: string;
  date: string | null;
  articles?: string;
  /** Date d'entrée en vigueur ; null si non renseignée (à vérifier). */
  dateEffet: string | null;
  /** Benchmark méthodologique : jamais « applicable » au sens réglementaire. */
  benchmark?: boolean;
  consequence: string;
  etatOutil: "en place" | "partiel" | "à faire";
}

export const REGISTRE_TEXTES: TexteReference[] = [
  {
    code: "BAM-D-3W-2025",
    emetteur: "Bank Al-Maghrib",
    type: "Directive",
    intitule: "Consortialisation des crédits",
    date: "2025-12-15",
    articles: "Articles 6, 17, 20 et 21",
    dateEffet: "2026-07-01",
    consequence:
      "Analyse propre de chaque banque participante, rôles du consortium, séparation des fonctions, données de reporting.",
    etatOutil: "partiel",
  },
  {
    code: "BAM-C-1W-2025",
    emetteur: "Bank Al-Maghrib",
    type: "Circulaire",
    intitule: "Classification des créances et couverture par provisions",
    date: "2025-12-15",
    articles: "Article 53",
    dateEffet: "2027-01-01",
    consequence:
      "Moteur de classification distinct du score ; calendrier d'application progressif à partir du 1er janvier 2027.",
    etatOutil: "à faire",
  },
  {
    code: "BAM-D-2W-2025",
    emetteur: "Bank Al-Maghrib",
    type: "Directive",
    intitule: "Informations relatives aux risques financiers climatiques des grands emprunteurs",
    date: "2025-01-24",
    dateEffet: null,
    consequence:
      "Données d'exposition des grands emprunteurs aux risques climatiques et leur qualité ; assujettissement et reporting à vérifier.",
    etatOutil: "partiel",
  },
  {
    code: "OC-IGOC-2026",
    emetteur: "Office des Changes",
    type: "Instruction",
    intitule: "Instruction générale des opérations de change 2026",
    date: null,
    dateEffet: "2026-01-01",
    consequence:
      "Règle de change applicable, justificatifs et validations pour dette externe, investissements et couverture.",
    etatOutil: "partiel",
  },
  {
    code: "CNDP-09-08",
    emetteur: "CNDP",
    type: "Loi",
    intitule: "Loi 09-08 — protection des données personnelles (traitements et transferts)",
    date: null,
    dateEffet: null,
    consequence:
      "Cartographie des traitements et des transferts ; formalités si des données sont hébergées à l'étranger.",
    etatOutil: "à faire",
  },
  {
    code: "BCBS-CRE33",
    emetteur: "Comité de Bâle",
    type: "Standard international",
    intitule: "CRE33.13 — critères du slotting du financement de projet",
    date: null,
    dateEffet: null,
    benchmark: true,
    consequence:
      "Benchmark de la grille (solidité financière, stress, juridique, contrats, sponsors, sûretés) ; n'autorise pas l'usage des pondérations prudentielles du slotting.",
    etatOutil: "en place",
  },
];

/** Statut d'un texte à une date donnée (par défaut aujourd'hui). */
export function statutTexte(t: TexteReference, aujourdhui = new Date()): string {
  if (t.benchmark) return "Référence méthodologique";
  if (!t.dateEffet) return "Date d'effet à vérifier";
  return new Date(t.dateEffet) <= aujourdhui ? "En vigueur" : `À venir (${t.dateEffet.split("-").reverse().join("/")})`;
}
