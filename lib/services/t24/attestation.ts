/**
 * Attestation d'une lecture T24.
 *
 * La provenance « T24 » d'une fiche (champs marqués, date de synchronisation) ne peut
 * pas être déclarée par le navigateur : n'importe quel appelant pourrait présenter une
 * saisie manuelle comme reprise du système central. Chaque lecture T24 renvoie donc
 * une attestation signée par le serveur (HMAC-SHA256) des valeurs lues, liée à
 * l'utilisateur et valable deux heures. À l'enregistrement, seuls les champs dont la
 * valeur saisie est identique à la valeur attestée sont marqués comme repris de T24.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { FicheGroupeT24 } from "./normalisation";

const DUREE_MS = 2 * 60 * 60 * 1000;

export interface AttestationClient {
  t: "client";
  /** Utilisateur qui a fait la lecture. */
  u: string;
  /** Code client T24 lu. */
  c: string;
  /** Valeurs lues, sous forme de texte normalisé. */
  v: Record<string, string>;
  g: { code: string | null; nom: string | null } | null;
  exp: number;
}

export interface AttestationGroupe {
  t: "groupe";
  u: string;
  c: string;
  g: FicheGroupeT24;
  exp: number;
}

type Attestation = AttestationClient | AttestationGroupe;

/** Texte de comparaison d'une valeur (nombre, date, texte). */
export function texteAtteste(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function secret(): string | null {
  const s = process.env.JWT_SECRET;
  return s && s.length >= 16 ? s : null;
}

function signature(corps: string, cle: string): string {
  return createHmac("sha256", `t24-attestation:${cle}`)
    .update(corps)
    .digest("base64url");
}

/** Attestation signée, ou null si le serveur n'a pas de secret (provenance non attestée). */
export function signerAttestation<T extends Attestation>(
  contenu: Omit<T, "exp">
): string | null {
  const cle = secret();
  if (!cle) return null;
  const corps = Buffer.from(
    JSON.stringify({ ...contenu, exp: Date.now() + DUREE_MS })
  ).toString("base64url");
  return `${corps}.${signature(corps, cle)}`;
}

/** Contenu d'une attestation valide pour cet utilisateur, sinon null. */
export function lireAttestation<T extends Attestation["t"]>(
  jeton: string | null | undefined,
  type: T,
  utilisateur: string
): Extract<Attestation, { t: T }> | null {
  const cle = secret();
  if (!jeton || !cle) return null;
  const [corps, sig] = jeton.split(".");
  if (!corps || !sig) return null;
  const attendue = Buffer.from(signature(corps, cle));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue))
    return null;
  try {
    const a = JSON.parse(
      Buffer.from(corps, "base64url").toString("utf8")
    ) as Attestation;
    if (
      a.t !== type ||
      a.u !== utilisateur ||
      typeof a.exp !== "number" ||
      a.exp < Date.now()
    )
      return null;
    return a as Extract<Attestation, { t: T }>;
  } catch {
    return null;
  }
}
