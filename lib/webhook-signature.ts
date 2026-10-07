import { createHmac, timingSafeEqual } from "crypto";

/**
 * Vérification cryptographique des webhooks entrants.
 *
 * La route acceptait tout appel portant un en-tête `x-supabase-signature`, quelle
 * que soit sa valeur. Elle exige désormais :
 * - `x-webhook-timestamp` : horodatage Unix (secondes), à moins de 5 minutes ;
 * - `x-webhook-id` : identifiant unique de l'envoi (protection contre le rejeu) ;
 * - `x-webhook-signature` : `sha256=` + HMAC-SHA256 hexadécimal, calculé avec
 *   WEBHOOK_SECRET sur `${timestamp}.${id}.${corps brut}`.
 * La comparaison est à temps constant.
 */
export const TOLERANCE_HORODATAGE_S = 300;

export function signerWebhook(secret: string, timestamp: string, id: string, corps: string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${id}.${corps}`).digest("hex");
}

export type ResultatSignature =
  | { ok: true }
  | { ok: false; motif: "non_configure" | "entetes_manquants" | "horodatage" | "signature" | "rejeu" };

export function verifierSignatureWebhook(params: {
  secret: string | undefined;
  signature: string | null;
  timestamp: string | null;
  id: string | null;
  corps: string;
  maintenantS?: number;
  dejaVu?: (id: string) => boolean;
}): ResultatSignature {
  const { secret, signature, timestamp, id, corps } = params;
  if (!secret) return { ok: false, motif: "non_configure" };
  if (!signature || !timestamp || !id) return { ok: false, motif: "entetes_manquants" };

  const ts = Number(timestamp);
  const maintenant = params.maintenantS ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(maintenant - ts) > TOLERANCE_HORODATAGE_S) {
    return { ok: false, motif: "horodatage" };
  }

  const attendue = Buffer.from(signerWebhook(secret, timestamp, id, corps));
  const recue = Buffer.from(signature);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) {
    return { ok: false, motif: "signature" };
  }
  if (params.dejaVu?.(id)) return { ok: false, motif: "rejeu" };
  return { ok: true };
}

/**
 * Mémoire des identifiants déjà traités, le temps de la fenêtre d'horodatage.
 * Elle est locale à l'instance : sur un hébergement à plusieurs instances, la
 * fenêtre de 5 minutes et l'idempotence des gestionnaires restent la protection
 * principale.
 */
const vus = new Map<string, number>();

export function marquerVu(id: string, maintenantMs = Date.now()): boolean {
  for (const [cle, expire] of vus) if (expire < maintenantMs) vus.delete(cle);
  if (vus.has(id)) return true;
  vus.set(id, maintenantMs + TOLERANCE_HORODATAGE_S * 1000);
  return false;
}
