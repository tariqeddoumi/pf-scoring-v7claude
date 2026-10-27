/**
 * Fiches climat des dix-huit cas d'étude (données fictives), pour mesurer l'effet du lot 2
 * du volet climatique avant sa validation. Elles complètent les cas Excel, qui n'ont pas de
 * fiche climat : sans elles, le lot 2 ne verrait que la case du bloc 2.
 */
import type { ClimatPF } from "./climat";

type Fiche = Partial<Omit<ClimatPF, "aleas">> & { aleas: ClimatPF["aleas"] };

const a = (niveau: "Faible" | "Moyen" | "Élevé", source: string, adaptation: "Oui" | "Non" | null = null) => ({ niveau, source, adaptation });
const EIES = "Étude d'impact environnemental et social (fictive)";
const CT = "Rapport du conseiller technique des prêteurs (fictif)";

export const FICHES_CLIMAT_CAS: Record<string, Fiche> = {
  C1: {
    localisation: "Région de Drâa-Tafilalet",
    aleas: { chaleur: a("Élevé", `${CT}, § 4.2`, "Oui"), vents: a("Moyen", `${CT}, § 4.3`, "Oui"), feux: a("Faible", EIES) },
    emissions: 1_500, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.06, descriptionClimatique: "Canicule prolongée et vents de sable : production − 5 %, nettoyage + 5 %",
  },
  C2: {
    localisation: "Littoral de Souss-Massa",
    aleas: { submersion: a("Moyen", `${EIES}, ch. 6`, "Oui"), vents: a("Élevé", `${CT}, § 3.1`, "Oui"), chaleur: a("Moyen", EIES) },
    emissions: 90_000, exportMacf: 0, actifFossile: "Non", planTransition: "Oui",
    chocClimatique: 0.1, descriptionClimatique: "Tempête : prise d'eau indisponible un mois, réparations",
  },
  C3: {
    localisation: "Marrakech",
    aleas: { chaleur: a("Élevé", `${EIES}, ch. 5`, "Non"), secheresse: a("Élevé", `${EIES}, ch. 5`, "Non"), submersion: a("Faible", EIES), feux: a("Faible", EIES) },
    emissions: 3_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.25, descriptionClimatique: "Canicule et pénurie d'eau : fréquentation − 20 %, charges + 10 %",
  },
  C4A: {
    localisation: "Région de Doukkala-Abda",
    aleas: { secheresse: a("Élevé", `${EIES}, ch. 4`, "Non"), chaleur: a("Moyen", EIES) },
    emissions: 2_500, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.3, descriptionClimatique: "Sécheresse sur deux campagnes : récolte − 35 %",
  },
  C4B: {
    localisation: "Région de Doukkala-Abda",
    aleas: { secheresse: a("Élevé", `${EIES}, ch. 4`, "Non"), chaleur: a("Moyen", EIES) },
    emissions: 2_500, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.3, descriptionClimatique: "Sécheresse sur deux campagnes : récolte − 35 %",
  },
  C5: {
    localisation: "Zone industrielle de Kénitra",
    aleas: { chaleur: a("Moyen", CT), vents: a("Faible", CT), feux: a("Faible", EIES) },
    emissions: 200, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.05, descriptionClimatique: "Canicule : production − 4 %",
  },
  ENR: {
    localisation: "Province côtière du Nord",
    aleas: { vents: a("Moyen", `${CT}, classe IEC des turbines`, "Oui"), feux: a("Moyen", EIES, "Oui"), chaleur: a("Faible", CT) },
    emissions: 800, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.05, descriptionClimatique: "Tempête : arrêt de sécurité des turbines deux semaines",
  },
  EAU: {
    localisation: "Littoral du Sud",
    aleas: { submersion: a("Élevé", `${EIES}, ch. 6`, "Oui"), vents: a("Élevé", `${CT}, § 3.1`, "Oui"), chaleur: a("Moyen", EIES) },
    emissions: 110_000, exportMacf: 0, actifFossile: "Non", planTransition: "Oui",
    chocClimatique: 0.08, descriptionClimatique: "Tempête : prise d'eau indisponible trois semaines",
  },
  TEL: {
    localisation: "Zone industrielle périurbaine",
    aleas: { chaleur: a("Élevé", `${CT}, refroidissement dimensionné pour 48 °C`, "Oui"), inondation: a("Faible", EIES) },
    emissions: 140_000, exportMacf: 0, actifFossile: "Non", planTransition: "Non",
    chocClimatique: 0.08, descriptionClimatique: "Canicule : surcoût de refroidissement (charges + 15 %)",
  },
  TRA: {
    localisation: "Corridor interurbain",
    aleas: { inondation: a("Élevé", `${CT}, ouvrages hydrauliques centennaux`, "Oui"), feux: a("Moyen", EIES) },
    emissions: 1_500, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.12, descriptionClimatique: "Crue : section coupée deux mois, réparations",
  },
  POR: {
    localisation: "Port en eau profonde",
    aleas: { submersion: a("Moyen", `${CT}, cote des quais`, "Oui"), vents: a("Moyen", CT, "Oui") },
    emissions: 18_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.08, descriptionClimatique: "Tempête : quais arrêtés trois semaines",
  },
  SAN: {
    localisation: "Capitale régionale",
    aleas: { inondation: a("Faible", EIES), chaleur: a("Moyen", EIES, "Oui") },
    emissions: 9_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.06, descriptionClimatique: "Inondation : remise en état et pénalités",
  },
  ETH: {
    localisation: "Zone portuaire",
    aleas: { chaleur: a("Élevé", `${CT}, perte de puissance prise en compte`, "Oui"), secheresse: a("Moyen", `${CT}, refroidissement à l'eau de mer`, "Oui") },
    emissions: 1_100_000, exportMacf: 0, actifFossile: "Oui", planTransition: "Non",
    chocClimatique: 0.15, descriptionClimatique: "Canicule et prix du carbone : puissance − 8 %, charges + 15 %",
  },
  IMMO: {
    localisation: "Quartier d'affaires",
    aleas: { inondation: a("Moyen", EIES, "Oui"), chaleur: a("Moyen", EIES) },
    emissions: 4_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.1, descriptionClimatique: "Inondation : locaux indisponibles deux mois",
  },
  IND: {
    localisation: "Plateforme industrielle",
    aleas: { secheresse: a("Moyen", EIES, "Oui"), inondation: a("Faible", EIES) },
    emissions: 130_000, exportMacf: 0, actifFossile: "Oui", planTransition: "Non",
    chocClimatique: 0.12, descriptionClimatique: "Sécheresse et coût du carbone : volumes − 10 %, charges + 10 %",
  },
  AGR: {
    localisation: "Région oléicole de l'intérieur",
    aleas: { secheresse: a("Élevé", `${EIES}, ch. 4 ; historique des campagnes`, "Non"), chaleur: a("Moyen", EIES) },
    emissions: 2_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.2, descriptionClimatique: "Sécheresse sur deux campagnes : récolte − 35 %, en partie compensée par le prix et l'assurance récolte",
  },
  TOU: {
    localisation: "Littoral atlantique",
    aleas: { chaleur: a("Élevé", EIES, "Non"), secheresse: a("Élevé", EIES, "Non"), submersion: a("Élevé", `${EIES}, ch. 6`, "Non"), feux: a("Faible", EIES) },
    emissions: 6_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.25, descriptionClimatique: "Canicule et pénurie d'eau : fréquentation − 20 %, charges + 10 %",
  },
  MIN: {
    localisation: "Massif montagneux",
    aleas: { secheresse: a("Élevé", `${EIES}, bilan hydrique`, "Oui"), inondation: a("Moyen", EIES, "Oui") },
    emissions: 60_000, exportMacf: 0, actifFossile: "Non", planTransition: null,
    chocClimatique: 0.15, descriptionClimatique: "Sécheresse : restrictions d'eau (production − 15 %)",
  },
};
