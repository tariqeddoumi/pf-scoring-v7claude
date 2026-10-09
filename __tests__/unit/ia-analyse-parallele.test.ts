import { EventEmitter } from "events";

/**
 * Orchestration de l'analyse : un contrôle puis des lots de critères en parallèle,
 * résultats fusionnés ; un lot en échec rend l'analyse partielle, pas impossible.
 */

const demandes: Array<{ texte: string; debut: number }> = [];
let echecSur: string | null = null;

function reponse(texte: string) {
  const controle = texte.startsWith("VOLET : CONTRÔLE");
  const codes = [...texte.matchAll(/^- (C\d+) —/gm)].map((m) => m[1]);
  const json = {
    synthese: controle ? "Dossier complet." : "",
    documents: controle
      ? [{ nom: "a.pdf", typeIdentifie: "Term sheet", role: "Conditions", complet: true, elementsManquants: [], incoherences: [] }]
      : [],
    criteres: codes.map((code) => ({
      code,
      statut: "trouve",
      optionChoisie: null,
      valeurNombre: 1.35,
      valeurBooleen: null,
      valeurTexte: null,
      confiance: "elevee",
      justification: "lu",
      sources: [],
      documentAttendu: null,
    })),
    questions: [{ question: "Fournir le PPA signé", destinataire: "client", criteres: [], documentAttendu: null }],
  };
  return {
    model: "claude-opus-5-5",
    stop_reason: "end_turn",
    content: [{ type: "text", text: JSON.stringify(json) }],
    usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: controle ? 0 : 1000, cache_creation_input_tokens: controle ? 1000 : 0 },
  };
}

jest.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    static APIConnectionTimeoutError = class extends Error {};
    static RateLimitError = class extends Error {};
    beta = {
      messages: {
        stream: (params: { messages: Array<{ content: Array<{ type: string; text?: string }> }> }) => {
          const contenu = params.messages[0].content;
          const texte = contenu[contenu.length - 1].text ?? "";
          demandes.push({ texte, debut: Date.now() });
          const flux = new EventEmitter() as EventEmitter & { finalMessage: () => Promise<unknown> };
          setTimeout(() => flux.emit("streamEvent", {}), 5);
          const fin = new Promise((ok, ko) =>
            setTimeout(() => (echecSur && texte.includes(echecSur) ? ko(new Error("panne")) : ok(reponse(texte))), 20)
          );
          flux.finalMessage = () => fin;
          return flux;
        },
      },
    };
  }
  return { __esModule: true, default: Anthropic };
});

import { analyserPieces } from "@/lib/services/ia-documents/analyse";

const criteres = Array.from({ length: 30 }, (_, i) => ({
  id: `n${i}`,
  code: `C${i + 1}`,
  label: `Critère ${i + 1}`,
  answerType: "NUMERIC",
}));
const pieces = [
  { nom: "a.pdf", taille: 100, blocs: [{ type: "text" as const, text: "contenu" }] },
];

describe("analyse IA en parallèle", () => {
  const cle = process.env.ANTHROPIC_API_KEY;
  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = "test";
  });
  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = cle;
  });
  beforeEach(() => {
    demandes.length = 0;
    echecSur = null;
  });

  it("contrôle d'abord, puis tous les critères par lots, résultats fusionnés", async () => {
    const r = await analyserPieces({ pieces, criteres, contexte: "Projet : test" });
    expect(demandes[0].texte).toMatch(/^VOLET : CONTRÔLE/);
    expect(demandes).toHaveLength(1 + 3);
    expect(r.resultat.criteres.map((c) => c.code)).toEqual(criteres.map((c) => c.code));
    expect(r.resultat.documents).toHaveLength(1);
    expect(r.resultat.synthese).toBe("Dossier complet.");
    expect(r.resultat.questions).toHaveLength(1);
    expect(r.avertissements).toEqual([]);
    expect(r.usage.entree).toBe(4 * 10 + 4 * 1000);
  });

  it("un lot en échec rend l'analyse partielle et le signale", async () => {
    echecSur = "- C13 —";
    const r = await analyserPieces({ pieces, criteres, contexte: "" });
    expect(r.resultat.criteres).toHaveLength(18);
    expect(r.avertissements).toHaveLength(1);
    expect(r.avertissements[0]).toContain("C13 à C24");
  });

  it("tout en échec : erreur explicite", async () => {
    echecSur = "VOLET";
    await expect(analyserPieces({ pieces, criteres, contexte: "" })).rejects.toThrow("Analyse impossible");
  });
});
