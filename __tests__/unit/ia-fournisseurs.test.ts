jest.mock("@/lib/services/app-config-service", () => ({ getAppConfig: jest.fn(async () => ({})) }));

import { getAppConfig } from "@/lib/services/app-config-service";
import {
  blocsVersOpenAI,
  clientIA,
  configIA,
  configurationIncomplete,
  urlChatCompletions,
} from "@/lib/services/ia-documents/fournisseurs";
import { analyserPieces } from "@/lib/services/ia-documents/analyse";

const config = getAppConfig as jest.Mock;
const env = { ...process.env };

afterEach(() => {
  process.env = { ...env };
  config.mockResolvedValue({});
  jest.restoreAllMocks();
});

describe("fournisseur d'IA paramétrable", () => {
  it("Anthropic par défaut, modèle par défaut", async () => {
    expect(await configIA()).toEqual({ fournisseur: "anthropic", modele: "claude-opus-5-5", urlBase: null });
  });

  it("lit fournisseur, modèle et adresse dans le paramétrage ; valeur inconnue → Anthropic", async () => {
    config.mockResolvedValue({ IA_FOURNISSEUR: "azure_openai", IA_MODELE: "gpt-dossiers", IA_URL_BASE: "https://banque.openai.azure.com/openai/v1/" });
    expect(await configIA()).toEqual({ fournisseur: "azure_openai", modele: "gpt-dossiers", urlBase: "https://banque.openai.azure.com/openai/v1/" });
    config.mockResolvedValue({ IA_FOURNISSEUR: "inconnu" });
    expect((await configIA()).fournisseur).toBe("anthropic");
  });

  it("signale ce qui manque : clé, modèle, adresse", () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.IA_CLE_API;
    delete process.env.OPENAI_API_KEY;
    expect(configurationIncomplete({ fournisseur: "anthropic", modele: "m", urlBase: null })).toContain("ANTHROPIC_API_KEY");
    process.env.IA_CLE_API = "x";
    expect(configurationIncomplete({ fournisseur: "openai", modele: "", urlBase: null })).toContain("IA_MODELE");
    expect(configurationIncomplete({ fournisseur: "compatible_openai", modele: "m", urlBase: null })).toContain("IA_URL_BASE");
    expect(configurationIncomplete({ fournisseur: "openai", modele: "m", urlBase: null })).toBeNull();
  });

  it("adresse de l'API : OpenAI par défaut, chemin complété sinon", () => {
    expect(urlChatCompletions({ fournisseur: "openai", modele: "m", urlBase: null })).toBe("https://api.openai.com/v1/chat/completions");
    expect(urlChatCompletions({ fournisseur: "compatible_openai", modele: "m", urlBase: "http://llm.interne:8000/v1/" })).toBe(
      "http://llm.interne:8000/v1/chat/completions"
    );
  });

  it("convertit les pièces : texte, image en data URL, document texte avec son titre", async () => {
    const parties = await blocsVersOpenAI([
      { type: "text", text: "Image jointe" },
      { type: "image", source: { type: "base64", media_type: "image/png", data: "AAA" } },
      { type: "document", source: { type: "text", media_type: "text/plain", data: "A1: 12" }, title: "modele.xlsx" },
    ]);
    expect(parties).toEqual([
      { type: "text", text: "Image jointe" },
      { type: "image_url", image_url: { url: "data:image/png;base64,AAA" } },
      { type: "text", text: "=== Document « modele.xlsx » ===\nA1: 12" },
    ]);
  });

  it("Azure : en-tête api-key, sortie JSON imposée par le schéma", async () => {
    process.env.IA_CLE_API = "secret-azure";
    config.mockResolvedValue({ IA_FOURNISSEUR: "azure_openai", IA_MODELE: "gpt-dossiers", IA_URL_BASE: "https://b.openai.azure.com/openai/v1" });
    const appels: Array<{ url: string; init: RequestInit }> = [];
    jest.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      appels.push({ url: String(url), init: init as RequestInit });
      return new Response(
        JSON.stringify({ model: "gpt-dossiers", choices: [{ finish_reason: "stop", message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 7, completion_tokens: 3 } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    });
    const ia = await clientIA();
    const r = await ia.lancer({ systeme: "S", blocs: [{ type: "text", text: "pièce" }], consigne: "C", schema: { type: "object" } }, 1000).fin;
    expect(r).toEqual({ texte: '{"ok":true}', modele: "gpt-dossiers", usage: { entree: 7, sortie: 3 }, arret: "fin" });
    const { url, init } = appels[0];
    expect(url).toBe("https://b.openai.azure.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>)["api-key"]).toBe("secret-azure");
    const corps = JSON.parse(String(init.body));
    expect(corps.response_format.type).toBe("json_schema");
    expect(corps.messages[0]).toEqual({ role: "system", content: "S" });
  });

  it("erreur HTTP du fournisseur : message lisible", async () => {
    process.env.IA_CLE_API = "k";
    config.mockResolvedValue({ IA_FOURNISSEUR: "openai", IA_MODELE: "gpt" });
    jest.spyOn(global, "fetch").mockResolvedValue(new Response("quota dépassé", { status: 429 }));
    const ia = await clientIA();
    await expect(ia.lancer({ systeme: "", blocs: [], consigne: "", schema: {} }, 1000).fin).rejects.toThrow("429");
  });

  it("l'analyse fonctionne avec n'importe quel fournisseur", async () => {
    const reponse = (consigne: string) =>
      JSON.stringify({
        synthese: consigne.startsWith("VOLET : CONTRÔLE") ? "ok" : "",
        documents: [],
        criteres: [...consigne.matchAll(/^- (C\d+) —/gm)].map((m) => ({
          code: m[1], statut: "trouve", optionChoisie: null, valeurNombre: 1, valeurBooleen: null, valeurTexte: null,
          confiance: "moyenne", justification: "", sources: [], documentAttendu: null,
        })),
        questions: [],
      });
    const client = {
      config: { fournisseur: "compatible_openai" as const, modele: "interne", urlBase: "http://x" },
      manque: null,
      lancer: (d: { consigne: string }) => {
        const fin = Promise.resolve({ texte: reponse(d.consigne), modele: "interne", usage: { entree: 1, sortie: 1 }, arret: "fin" as const });
        return { premiereReponse: fin.then(() => undefined), fin };
      },
    };
    const criteres = Array.from({ length: 5 }, (_, i) => ({ id: `n${i}`, code: `C${i + 1}`, label: "x", answerType: "NUMERIC" }));
    const r = await analyserPieces({ pieces: [{ nom: "a", taille: 1, blocs: [] }], criteres, contexte: "", client });
    expect(r.modele).toBe("interne");
    expect(r.resultat.criteres).toHaveLength(5);
    expect(r.resultat.synthese).toBe("ok");
  });
});
