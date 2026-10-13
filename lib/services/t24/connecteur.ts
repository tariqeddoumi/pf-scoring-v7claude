/**
 * Connecteur T24 : lecture d'un client ou d'un groupe d'affaires dans le système
 * central de la banque.
 *
 * Paramétrage (Paramétrage de l'outil › Système central T24) :
 * - T24_MODE : desactive (défaut : saisie manuelle seule), api, simulation ;
 * - T24_URL_BASE : adresse du service exposant T24 (API Transact ou bus de services) ;
 * - T24_CHEMIN_CLIENT / T24_CHEMIN_GROUPE : chemins, {code} remplacé par le code ;
 * - T24_CORRESPONDANCE : correspondance facultative des champs (JSON).
 * Identifiants dans les variables d'environnement, jamais en base : T24_JETON
 * (jeton porteur) ou T24_UTILISATEUR et T24_MOT_DE_PASSE (authentification de base).
 *
 * Lecture seule : l'outil n'écrit jamais dans T24.
 */

import { getAppConfig } from "@/lib/services/app-config-service";
import {
  normaliserClient,
  normaliserGroupe,
  type Correspondance,
  type FicheClientT24,
  type FicheGroupeT24,
} from "./normalisation";
import { clientDeDemonstration, groupeDeDemonstration } from "./simulation";

export const MODES_T24 = ["desactive", "api", "simulation"] as const;
export type ModeT24 = (typeof MODES_T24)[number];

export interface ConfigT24 {
  mode: ModeT24;
  urlBase: string | null;
  cheminClient: string;
  cheminGroupe: string;
  correspondance: Correspondance;
}

export const CODE_T24 = /^[A-Za-z0-9._-]{1,35}$/;
const DELAI_MS = 10_000;

export class ErreurT24 extends Error {
  constructor(
    message: string,
    /** Statut HTTP à renvoyer à l'écran. */
    readonly statut: number
  ) {
    super(message);
    this.name = "ErreurT24";
  }
}

function lireCorrespondance(brut: string | undefined): Correspondance {
  if (!brut?.trim()) return {};
  try {
    const o = JSON.parse(brut);
    if (!o || typeof o !== "object" || Array.isArray(o)) return {};
    return Object.fromEntries(
      Object.entries(o).filter(
        (e): e is [string, string] => typeof e[1] === "string"
      )
    );
  } catch {
    return {};
  }
}

export async function configT24(): Promise<ConfigT24> {
  const c = await getAppConfig();
  const mode = (MODES_T24 as readonly string[]).includes(c.T24_MODE ?? "")
    ? (c.T24_MODE as ModeT24)
    : "desactive";
  return {
    mode,
    urlBase: (c.T24_URL_BASE ?? "").trim().replace(/\/+$/, "") || null,
    cheminClient:
      (c.T24_CHEMIN_CLIENT ?? "").trim() || "/party/customers/{code}",
    cheminGroupe:
      (c.T24_CHEMIN_GROUPE ?? "").trim() || "/party/customerGroups/{code}",
    correspondance: lireCorrespondance(c.T24_CORRESPONDANCE),
  };
}

function enTetesAuthentification(): Record<string, string> | null {
  if (process.env.T24_JETON)
    return { Authorization: `Bearer ${process.env.T24_JETON}` };
  if (process.env.T24_UTILISATEUR && process.env.T24_MOT_DE_PASSE) {
    const b = Buffer.from(
      `${process.env.T24_UTILISATEUR}:${process.env.T24_MOT_DE_PASSE}`
    ).toString("base64");
    return { Authorization: `Basic ${b}` };
  }
  return null;
}

/** Ce qui empêche le rapatriement, ou null s'il est possible. */
export function configurationIncompleteT24(c: ConfigT24): string | null {
  if (c.mode === "desactive")
    return "Rapatriement T24 non activé : saisie manuelle.";
  if (c.mode === "simulation") return null;
  if (!c.urlBase)
    return "Rapatriement T24 non configuré : renseignez l'adresse du service (T24_URL_BASE).";
  if (!/^https?:\/\//.test(c.urlBase))
    return "Adresse du service T24 invalide (http:// ou https:// attendu).";
  if (!enTetesAuthentification()) {
    return "Rapatriement T24 non configuré : identifiants absents (variable T24_JETON, ou T24_UTILISATEUR et T24_MOT_DE_PASSE).";
  }
  return null;
}

export function urlT24(c: ConfigT24, chemin: string, code: string): string {
  const relatif = chemin.replace("{code}", encodeURIComponent(code));
  return `${c.urlBase}${relatif.startsWith("/") ? "" : "/"}${relatif}`;
}

async function lire(
  c: ConfigT24,
  chemin: string,
  code: string,
  objet: string
): Promise<unknown> {
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const res = await fetch(urlT24(c, chemin, code), {
      method: "GET",
      headers: { Accept: "application/json", ...enTetesAuthentification() },
      signal: controleur.signal,
      cache: "no-store",
    });
    if (res.status === 404)
      throw new ErreurT24(`${objet} ${code} introuvable dans T24.`, 404);
    if (res.status === 401 || res.status === 403) {
      throw new ErreurT24(
        "Accès à T24 refusé : vérifiez les identifiants du service.",
        502
      );
    }
    if (!res.ok)
      throw new ErreurT24(`T24 a répondu par une erreur (${res.status}).`, 502);
    try {
      return await res.json();
    } catch {
      throw new ErreurT24("Réponse T24 illisible (JSON attendu).", 502);
    }
  } catch (e) {
    if (e instanceof ErreurT24) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ErreurT24(
        "T24 ne répond pas (délai de 10 s dépassé). Réessayez ou saisissez la fiche.",
        504
      );
    }
    throw new ErreurT24(
      "Service T24 injoignable. Réessayez ou saisissez la fiche.",
      502
    );
  } finally {
    clearTimeout(minuterie);
  }
}

function verifierCode(code: string, objet: string) {
  if (!CODE_T24.test(code)) throw new ErreurT24(`Code ${objet} invalide.`, 400);
}

async function prete(): Promise<ConfigT24> {
  const c = await configT24();
  const manque = configurationIncompleteT24(c);
  if (manque) throw new ErreurT24(manque, 503);
  return c;
}

export async function lireClientT24(
  code: string
): Promise<{ fiche: FicheClientT24; simulation: boolean }> {
  verifierCode(code, "client");
  const c = await prete();
  if (c.mode === "simulation")
    return { fiche: clientDeDemonstration(code), simulation: true };
  const fiche = normaliserClient(
    code,
    await lire(c, c.cheminClient, code, "Client"),
    c.correspondance
  );
  if (!fiche || Object.keys(fiche.champs).length === 0) {
    throw new ErreurT24(
      `Aucune donnée exploitable pour le client ${code} : vérifiez la correspondance des champs (T24_CORRESPONDANCE).`,
      502
    );
  }
  return { fiche, simulation: false };
}

export async function lireGroupeT24(
  code: string
): Promise<{ fiche: FicheGroupeT24; simulation: boolean }> {
  verifierCode(code, "groupe");
  const c = await prete();
  if (c.mode === "simulation")
    return { fiche: groupeDeDemonstration(code), simulation: true };
  const fiche = normaliserGroupe(
    code,
    await lire(c, c.cheminGroupe, code, "Groupe"),
    c.correspondance
  );
  if (!fiche)
    throw new ErreurT24(
      `Aucune donnée exploitable pour le groupe ${code}.`,
      502
    );
  return { fiche, simulation: false };
}
