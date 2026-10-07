import { cheminPiece, fournisseurStockage } from "@/lib/services/ia-documents/stockage";

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe("stockage des pièces — choix du fournisseur", () => {
  const supa = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" };
  const s3 = { S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b" };
  it("Supabase par défaut s'il est configuré", () => {
    expect(fournisseurStockage(env({ ...supa }))).toBe("supabase");
  });
  it("S3 lorsqu'il est demandé et configuré, même si Supabase l'est aussi", () => {
    expect(fournisseurStockage(env({ ...supa, ...s3, STOCKAGE_PIECES: "s3" }))).toBe("s3");
  });
  it("non configuré : aucun fournisseur", () => {
    expect(fournisseurStockage(env({ STOCKAGE_PIECES: "s3" }))).toBeNull();
    expect(fournisseurStockage(env({}))).toBeNull();
    expect(fournisseurStockage(env({ ...supa, STOCKAGE_PIECES: "disque" }))).toBeNull();
  });
  it("chemin de stockage assaini", () => {
    expect(cheminPiece("e1", "p1", "Étude d'impact (v2).pdf")).toBe("e1/p1-Etude_d_impact_v2_.pdf");
  });
});
