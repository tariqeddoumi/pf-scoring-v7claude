import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Stockage privé des pièces du dossier (Supabase Storage).
 *
 * Les fichiers ne transitent pas par l'API de l'application : Vercel limite le corps
 * d'une requête à 4,5 Mo, en deçà d'un rapport annuel ou d'un modèle financier. Le
 * navigateur dépose le fichier directement dans un compartiment PRIVÉ grâce à un lien
 * signé à usage unique ; le serveur le relit avec la clé de service pour l'analyse.
 * La clé de service ne quitte jamais le serveur.
 */
export const COMPARTIMENT = process.env.DOCUMENTS_BUCKET || "pieces-dossiers";
export const TAILLE_MAX_FICHIER = 50 * 1024 * 1024;

let client: SupabaseClient | null = null;
let compartimentVerifie = false;

export function stockageConfigure(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function clientService(): SupabaseClient {
  if (!stockageConfigure()) {
    throw new Error("Stockage des pièces non configuré (NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/** Crée le compartiment privé à la première utilisation (sans effet s'il existe). */
async function assurerCompartiment(c: SupabaseClient) {
  if (compartimentVerifie) return;
  const { data } = await c.storage.getBucket(COMPARTIMENT);
  if (!data) {
    const { error } = await c.storage.createBucket(COMPARTIMENT, {
      public: false,
      fileSizeLimit: TAILLE_MAX_FICHIER,
    });
    if (error && !/already exists/i.test(error.message)) throw new Error(`Création du stockage impossible : ${error.message}`);
  }
  compartimentVerifie = true;
}

/** Chemin de stockage : un dossier par évaluation, nom de fichier assaini. */
export function cheminPiece(evaluationId: string, pieceId: string, nom: string): string {
  const propre = nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(-120);
  return `${evaluationId}/${pieceId}-${propre}`;
}

export async function lienDepot(chemin: string): Promise<{ url: string; token: string }> {
  const c = clientService();
  await assurerCompartiment(c);
  const { data, error } = await c.storage.from(COMPARTIMENT).createSignedUploadUrl(chemin);
  if (error || !data) throw new Error(`Lien de dépôt impossible : ${error?.message ?? "inconnu"}`);
  return { url: data.signedUrl, token: data.token };
}

export async function lirePiece(chemin: string): Promise<Buffer> {
  const c = clientService();
  const { data, error } = await c.storage.from(COMPARTIMENT).download(chemin);
  if (error || !data) throw new Error(`Pièce introuvable dans le stockage : ${chemin}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function supprimerPiece(chemin: string): Promise<void> {
  const c = clientService();
  await c.storage.from(COMPARTIMENT).remove([chemin]);
}
