/**
 * Choix de la valeur d'un critère entre la saisie et la donnée automatique (binding).
 *
 * Le moteur prenait la ligne de réponse dès qu'elle existait, même vide : une ligne
 * initialisée à la création masquait la donnée automatique (score 0 au lieu de 100),
 * et une saisie manuelle l'emportait sur une source déclarée AUTO_READONLY. La
 * priorité dépend désormais du mode de la donnée :
 * - AUTO_READONLY, CALCULATED_ONLY : la source fait foi, la saisie est ignorée ;
 * - MANUAL_ONLY : la saisie seule ;
 * - autres modes (AUTO_EDITABLE, AUTO_IF_EMPTY, sans binding) : la saisie si elle
 *   porte une valeur, sinon la donnée automatique.
 * Une valeur par défaut ou de repli est utilisable mais tracée comme telle : elle ne
 * vaut pas une donnée réelle pour un critère obligatoire.
 */

export type OrigineValeur = "SAISIE" | "SOURCE" | "DEFAUT" | "AUCUNE";

export interface ReponseBrute {
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
  valueDate?: Date | string | null;
  valueJson?: unknown;
}

export interface DonneeAuto {
  bindingMode: string;
  isAvailable: boolean;
  resolvedValue: unknown;
  /** "SOURCE" | "DEFAULT" | "FALLBACK" | "NONE" */
  valueOrigin?: string;
}

export const MODES_VERROUILLES = ["AUTO_READONLY", "CALCULATED_ONLY"];

export function valeurDeReponse(r: ReponseBrute | null | undefined): unknown {
  if (!r) return null;
  if (typeof r.valueString === "string" && r.valueString.trim() !== "") return r.valueString;
  if (r.valueNumber !== null && r.valueNumber !== undefined) return r.valueNumber;
  if (r.valueBoolean !== null && r.valueBoolean !== undefined) return r.valueBoolean;
  if (r.valueDate !== null && r.valueDate !== undefined) return r.valueDate;
  if (r.valueJson !== null && r.valueJson !== undefined && r.valueJson !== "") return r.valueJson;
  return null;
}

function valeurAuto(b: DonneeAuto | null | undefined): { valeur: unknown; origine: OrigineValeur } | null {
  if (!b) return null;
  if (b.isAvailable) return { valeur: b.resolvedValue, origine: "SOURCE" };
  if (b.resolvedValue !== null && b.resolvedValue !== undefined && b.resolvedValue !== "") {
    return { valeur: b.resolvedValue, origine: "DEFAUT" };
  }
  return null;
}

export function choisirValeur(
  reponse: ReponseBrute | null | undefined,
  auto: DonneeAuto | null | undefined
): { valeur: unknown; origine: OrigineValeur } {
  const saisie = valeurDeReponse(reponse);
  const mode = auto?.bindingMode;

  if (mode && MODES_VERROUILLES.includes(mode)) {
    return valeurAuto(auto) ?? { valeur: null, origine: "AUCUNE" };
  }
  if (saisie !== null) return { valeur: saisie, origine: "SAISIE" };
  if (mode === "MANUAL_ONLY") return { valeur: null, origine: "AUCUNE" };
  return valeurAuto(auto) ?? { valeur: null, origine: "AUCUNE" };
}
