/**
 * Bibliothèque des scénarios défavorables de référence, par secteur, et passage d'un scénario
 * exprimé en hypothèses (recettes, charges) au choc sur les CFADS saisi au bloc 6.
 *
 * Valeurs candidates, à valider par le comité de validation du modèle. L'analyste peut s'en
 * écarter en le justifiant dans la description du scénario.
 */
import type { CodeSecteur } from "./parametres";

export interface ScenarioReference {
  /** Variable qui fait le plus bouger les flux du secteur. */
  risque: string;
  /** Description proposée pour la saisie. */
  description: string;
  /** Baisse des recettes (0,08 = − 8 %). */
  baisseRecettes: number;
  /** Hausse des charges d'exploitation (0,10 = + 10 %). */
  hausseCharges: number;
  /** D'où viennent les chiffres. */
  source: string;
}

export const SCENARIOS_REFERENCE: Record<CodeSecteur, ScenarioReference> = {
  ENR: {
    risque: "Ressource (ensoleillement, vent)",
    description: "Production P90 à un an (− 8 %) et charges d'exploitation + 10 %",
    baisseRecettes: 0.08, hausseCharges: 0.1,
    source: "Écart P50/P90 à un an de l'étude de productible du conseiller technique indépendant (souvent 6 à 9 % en solaire, 10 à 15 % en éolien) ; + 10 % sur les charges : sensibilité usuelle des prêteurs.",
  },
  EAU: {
    risque: "Disponibilité et coût de l'énergie",
    description: "Disponibilité ramenée à 93 % (− 5 % de redevance) et coût de l'énergie non répercuté (charges + 15 %)",
    baisseRecettes: 0.05, hausseCharges: 0.15,
    source: "Disponibilité garantie aux contrats EPC et O&M (on se place en dessous) ; formule de redevance (part du coût de l'énergie non répercutée à l'acheteur).",
  },
  TEL: {
    risque: "Commercialisation et départ de clients",
    description: "Commercialisation plafonnée et départ d'un client clé (recettes − 20 %), charges + 5 %",
    baisseRecettes: 0.2, hausseCharges: 0.05,
    source: "Étude de marché ; échéancier et clauses de sortie des contrats clients ; poids du premier client.",
  },
  TRA: {
    risque: "Trafic",
    description: "Trafic − 15 % (récession, report modal) et charges + 10 %",
    baisseRecettes: 0.15, hausseCharges: 0.1,
    source: "Cas bas de l'étude de trafic indépendante ; baisses observées lors des récessions passées.",
  },
  POR: {
    risque: "Volumes traités",
    description: "Trafic ramené au volume minimum garanti (− 15 %) et charges + 5 %",
    baisseRecettes: 0.15, hausseCharges: 0.05,
    source: "Étude de trafic ; volume minimum garanti par les contrats des armateurs ou de l'autorité portuaire.",
  },
  SAN: {
    risque: "Performance contractuelle",
    description: "Pénalités de performance au plafond contractuel (− 5 % de redevance) et charges + 10 %",
    baisseRecettes: 0.05, hausseCharges: 0.1,
    source: "Plafond des pénalités prévu au contrat de partenariat public-privé ; historique de performance de l'exploitant.",
  },
  ETH: {
    risque: "Disponibilité technique",
    description: "Indisponibilité prolongée d'une unité (recettes − 10 %) et charges + 10 %",
    baisseRecettes: 0.1, hausseCharges: 0.1,
    source: "Historique de disponibilité du constructeur ; franchise de l'assurance perte d'exploitation ; contrat de maintenance.",
  },
  "IMMO-REND": {
    risque: "Vacance et loyers",
    description: "Vacance portée à 20 % et loyers de relocation − 5 % (recettes − 15 %), charges + 5 %",
    baisseRecettes: 0.15, hausseCharges: 0.05,
    source: "Historique de vacance du marché local ; échéancier des baux et options de sortie des locataires.",
  },
  IND: {
    risque: "Volumes et coût des intrants",
    description: "Volumes − 15 % et prix des intrants non répercutés (charges + 15 %)",
    baisseRecettes: 0.15, hausseCharges: 0.15,
    source: "Étude de marché ; historique des prix de l'énergie et des matières premières ; clauses d'indexation des contrats de vente.",
  },
  AGR: {
    risque: "Récolte et climat",
    description: "Récolte − 20 % (sécheresse) et charges + 5 %",
    baisseRecettes: 0.2, hausseCharges: 0.05,
    source: "Historique des campagnes agricoles de la région (années de sécheresse).",
  },
  TOU: {
    risque: "Fréquentation et prix",
    description: "Occupation − 10 points et prix − 5 % (recettes − 15 %), charges + 5 %",
    baisseRecettes: 0.15, hausseCharges: 0.05,
    source: "Historique de fréquentation de la destination lors des crises (2008, 2011, 2020).",
  },
  MIN: {
    risque: "Prix des métaux",
    description: "Prix du métal − 25 % et coûts + 8 %",
    baisseRecettes: 0.25, hausseCharges: 0.08,
    source: "Prix bas observés sur 10 à 20 ans ; cas bas du consensus des analystes.",
  },
};

export interface CalculChoc {
  cfadsCentral: number;
  cfadsStresse: number;
  /** Baisse relative des CFADS (0,14 = 14 %), plafonnée à 95 % comme la saisie. */
  choc: number;
}

/**
 * Choc sur les CFADS = (recettes perdues + charges supplémentaires) ÷ CFADS central.
 * Renvoie null si les recettes ne couvrent pas les charges (CFADS central nul ou négatif).
 */
export function calculerChoc(recettes: number, charges: number, baisseRecettes: number, hausseCharges: number): CalculChoc | null {
  if (![recettes, charges, baisseRecettes, hausseCharges].every(Number.isFinite)) return null;
  if (recettes <= 0 || charges < 0) return null;
  const cfadsCentral = recettes - charges;
  if (cfadsCentral <= 0) return null;
  const cfadsStresse = recettes * (1 - baisseRecettes) - charges * (1 + hausseCharges);
  const choc = Math.min(0.95, Math.max(0, (cfadsCentral - cfadsStresse) / cfadsCentral));
  return { cfadsCentral, cfadsStresse, choc };
}
