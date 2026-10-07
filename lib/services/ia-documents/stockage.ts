/**
 * Stockage privé des pièces du dossier, indépendant de la base de données.
 *
 * Deux fournisseurs, choisis par STOCKAGE_PIECES :
 * - « supabase » : Supabase Storage (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) ;
 * - « s3 »       : tout stockage compatible S3 — AWS S3, MinIO ou Ceph hébergés par la
 *                  banque… (S3_ENDPOINT facultatif, S3_REGION, S3_ACCESS_KEY_ID,
 *                  S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE pour MinIO).
 * Sans STOCKAGE_PIECES, Supabase est retenu s'il est configuré (comportement antérieur).
 *
 * Les fichiers ne transitent pas par l'API de l'application (limite de 4,5 Mo des
 * requêtes sur Vercel) : le serveur délivre un lien signé à usage limité et le
 * navigateur y dépose le fichier par une requête PUT ; le serveur le relit ensuite
 * avec ses propres identifiants, qui ne quittent jamais le serveur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { S3Client } from "@aws-sdk/client-s3";

export const COMPARTIMENT = process.env.DOCUMENTS_BUCKET || "pieces-dossiers";
export const TAILLE_MAX_FICHIER = 50 * 1024 * 1024;
const DUREE_LIEN_S = 15 * 60;

export type Fournisseur = "supabase" | "s3";

export function fournisseurStockage(env: NodeJS.ProcessEnv = process.env): Fournisseur | null {
  const choisi = (env.STOCKAGE_PIECES || "").toLowerCase();
  if (choisi === "s3") return env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY ? "s3" : null;
  if (choisi === "supabase" || !choisi) {
    return env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : null;
  }
  return null;
}

export function stockageConfigure(): boolean {
  return fournisseurStockage() !== null;
}

function exigerFournisseur(): Fournisseur {
  const f = fournisseurStockage();
  if (!f) {
    throw new Error(
      "Stockage des pièces non configuré : STOCKAGE_PIECES=s3 avec S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY, " +
        "ou Supabase (NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY)."
    );
  }
  return f;
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

export interface LienDepot {
  url: string;
  methode: "PUT";
  entetes: Record<string, string>;
}

// ---------------------------------------------------------------- Supabase Storage
let clientSupabase: SupabaseClient | null = null;
let compartimentVerifie = false;

async function supabase(): Promise<SupabaseClient> {
  if (!clientSupabase) {
    const { createClient } = await import("@supabase/supabase-js");
    clientSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  if (!compartimentVerifie) {
    const { data } = await clientSupabase.storage.getBucket(COMPARTIMENT);
    if (!data) {
      const { error } = await clientSupabase.storage.createBucket(COMPARTIMENT, {
        public: false,
        fileSizeLimit: TAILLE_MAX_FICHIER,
      });
      if (error && !/already exists/i.test(error.message)) throw new Error(`Création du stockage impossible : ${error.message}`);
    }
    compartimentVerifie = true;
  }
  return clientSupabase;
}

// ---------------------------------------------------------------- S3 compatible
let clientS3: S3Client | null = null;

async function s3(): Promise<S3Client> {
  if (!clientS3) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    clientS3 = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return clientS3;
}

// ---------------------------------------------------------------- opérations
export async function lienDepot(chemin: string, typeContenu = "application/octet-stream"): Promise<LienDepot> {
  if (exigerFournisseur() === "s3") {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const url = await getSignedUrl(
      await s3(),
      new PutObjectCommand({ Bucket: COMPARTIMENT, Key: chemin, ContentType: typeContenu }),
      { expiresIn: DUREE_LIEN_S }
    );
    return { url, methode: "PUT", entetes: { "content-type": typeContenu } };
  }
  const c = await supabase();
  const { data, error } = await c.storage.from(COMPARTIMENT).createSignedUploadUrl(chemin);
  if (error || !data) throw new Error(`Lien de dépôt impossible : ${error?.message ?? "inconnu"}`);
  // Même URL que celle qu'utilise supabase-js (uploadToSignedUrl) : un PUT suffit.
  return { url: data.signedUrl, methode: "PUT", entetes: { "content-type": typeContenu, "x-upsert": "false" } };
}

export async function lirePiece(chemin: string): Promise<Buffer> {
  if (exigerFournisseur() === "s3") {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    try {
      const r = await (await s3()).send(new GetObjectCommand({ Bucket: COMPARTIMENT, Key: chemin }));
      return Buffer.from(await r.Body!.transformToByteArray());
    } catch {
      throw new Error(`Pièce introuvable dans le stockage : ${chemin}`);
    }
  }
  const { data, error } = await (await supabase()).storage.from(COMPARTIMENT).download(chemin);
  if (error || !data) throw new Error(`Pièce introuvable dans le stockage : ${chemin}`);
  return Buffer.from(await data.arrayBuffer());
}

export async function supprimerPiece(chemin: string): Promise<void> {
  if (exigerFournisseur() === "s3") {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await s3()).send(new DeleteObjectCommand({ Bucket: COMPARTIMENT, Key: chemin }));
    return;
  }
  await (await supabase()).storage.from(COMPARTIMENT).remove([chemin]);
}
