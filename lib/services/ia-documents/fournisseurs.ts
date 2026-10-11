import Anthropic from "@anthropic-ai/sdk";
import { getAppConfig } from "@/lib/services/app-config-service";
import type { BlocContenu } from "./conversion";

/**
 * Fournisseur de l'IA documentaire, choisi dans le paramétrage.
 *
 * - « anthropic » (par défaut) : API Claude. Lit les PDF page par page (tableaux et
 *   graphiques compris), sortie JSON garantie par le schéma, pièces mises en cache
 *   entre les demandes parallèles.
 * - « openai », « azure_openai », « compatible_openai » : toute API au format
 *   « chat completions » d'OpenAI — OpenAI, Azure OpenAI, Mistral, ou un modèle
 *   hébergé par la banque (vLLM, Ollama, LiteLLM…). Les PDF y sont transmis sous
 *   forme de texte extrait page par page : les graphiques et tableaux scannés ne
 *   sont pas lus.
 *
 * Seuls le fournisseur, le modèle et l'adresse de l'API se paramètrent à l'écran. La
 * clé d'API reste une variable d'environnement (ANTHROPIC_API_KEY, ou IA_CLE_API pour
 * les autres) : un secret ne s'enregistre pas en base, où il serait lisible par
 * quiconque y accède et recopié dans les sauvegardes.
 */

export const FOURNISSEURS = ["anthropic", "openai", "azure_openai", "compatible_openai"] as const;
export type FournisseurIA = (typeof FOURNISSEURS)[number];

export const MODELE_PAR_DEFAUT: Record<FournisseurIA, string> = {
  anthropic: "claude-opus-5-5",
  openai: "",
  azure_openai: "",
  compatible_openai: "",
};

export interface ConfigIA {
  fournisseur: FournisseurIA;
  modele: string;
  /** Adresse de l'API (obligatoire pour Azure et les API compatibles). */
  urlBase: string | null;
}

export interface DemandeIA {
  systeme: string;
  /** Pièces du dossier, communes à toutes les demandes d'une analyse. */
  blocs: BlocContenu[];
  /** Consigne propre à la demande (volet contrôle, ou lot de critères). */
  consigne: string;
  schema: Record<string, unknown>;
}

export interface ReponseIA {
  texte: string;
  modele: string;
  usage: { entree: number; sortie: number };
  arret: "fin" | "refus" | "tronque";
}

export interface AppelIA {
  /** Résolue quand le fournisseur commence à répondre (pièces en cache côté Anthropic). */
  premiereReponse: Promise<void>;
  fin: Promise<ReponseIA>;
}

export interface ClientIA {
  config: ConfigIA;
  /** Message d'erreur si la configuration est incomplète, null sinon. */
  manque: string | null;
  lancer(demande: DemandeIA, delaiMs: number): AppelIA;
}

const estFournisseur = (v: string | undefined): v is FournisseurIA =>
  (FOURNISSEURS as readonly string[]).includes(v ?? "");

export async function configIA(): Promise<ConfigIA> {
  const c = await getAppConfig();
  const fournisseur = estFournisseur(c.IA_FOURNISSEUR) ? c.IA_FOURNISSEUR : "anthropic";
  return {
    fournisseur,
    modele: (c.IA_MODELE ?? "").trim() || MODELE_PAR_DEFAUT[fournisseur],
    urlBase: (c.IA_URL_BASE ?? "").trim() || null,
  };
}

export function cleApi(fournisseur: FournisseurIA): string | undefined {
  if (fournisseur === "anthropic") return process.env.ANTHROPIC_API_KEY;
  return process.env.IA_CLE_API || (fournisseur === "azure_openai" ? process.env.AZURE_OPENAI_API_KEY : process.env.OPENAI_API_KEY);
}

/** Ce qui manque pour appeler le fournisseur, ou null si tout est en place. */
export function configurationIncomplete(config: ConfigIA): string | null {
  const nomCle = config.fournisseur === "anthropic" ? "ANTHROPIC_API_KEY" : "IA_CLE_API";
  if (!cleApi(config.fournisseur)) {
    return `Analyse par IA non configurée : la clé ${nomCle} est absente des variables d'environnement.`;
  }
  if (!config.modele) return "Analyse par IA non configurée : renseignez le modèle (paramètre IA_MODELE).";
  if ((config.fournisseur === "azure_openai" || config.fournisseur === "compatible_openai") && !config.urlBase) {
    return "Analyse par IA non configurée : renseignez l'adresse de l'API (paramètre IA_URL_BASE).";
  }
  return null;
}

export async function clientIA(config?: ConfigIA): Promise<ClientIA> {
  const c = config ?? (await configIA());
  const manque = configurationIncomplete(c);
  return {
    config: c,
    manque,
    lancer: c.fournisseur === "anthropic" ? lancerAnthropic(c) : lancerCompatibleOpenAI(c),
  };
}

// ─── Anthropic ──────────────────────────────────────────────────────────────

function lancerAnthropic(config: ConfigIA) {
  return (demande: DemandeIA, delaiMs: number): AppelIA => {
    const client = new Anthropic({ apiKey: cleApi("anthropic"), ...(config.urlBase ? { baseURL: config.urlBase } : {}) });
    // Les pièces sont mises en cache : seule la première demande les paie en entier.
    const blocs = demande.blocs.map((b, i) =>
      i === demande.blocs.length - 1 ? ({ ...b, cache_control: { type: "ephemeral" } } as BlocContenu) : b
    );
    const flux = client.beta.messages.stream(
      {
        model: config.modele,
        max_tokens: 32000,
        // Repli serveur : si le modèle décline la requête, l'API la rejoue sur un
        // modèle de secours dans le même appel.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort: "medium", format: { type: "json_schema", schema: demande.schema } },
        system: demande.systeme,
        messages: [{ role: "user", content: [...blocs, { type: "text", text: demande.consigne }] }],
      },
      { timeout: delaiMs, maxRetries: 1 }
    );
    const fin = flux.finalMessage().then((m): ReponseIA => {
      const u = m.usage;
      return {
        texte: m.content
          .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join(""),
        modele: m.model,
        usage: {
          entree: u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
          sortie: u.output_tokens,
        },
        arret: m.stop_reason === "refusal" ? "refus" : m.stop_reason === "max_tokens" ? "tronque" : "fin",
      };
    });
    const premiereReponse = new Promise<void>((ok) => {
      flux.once("streamEvent", () => ok());
      fin.then(() => ok(), () => ok());
    });
    return { premiereReponse, fin };
  };
}

// ─── API au format OpenAI (OpenAI, Azure OpenAI, Mistral, modèles internes) ──

type PartieOpenAI = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

/** Texte d'un PDF, page par page, pour les fournisseurs qui ne lisent pas les PDF. */
export async function pdfEnTexte(base64: string): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(Buffer.from(base64, "base64")));
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return pages.map((t, i) => `[Page ${i + 1}]\n${t.trim()}`).join("\n\n");
}

export async function blocsVersOpenAI(blocs: BlocContenu[]): Promise<PartieOpenAI[]> {
  const parties: PartieOpenAI[] = [];
  for (const b of blocs) {
    if (b.type === "text") {
      parties.push({ type: "text", text: b.text });
    } else if (b.type === "image" && b.source.type === "base64") {
      parties.push({ type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } });
    } else if (b.type === "document") {
      const titre = b.title ?? "Document";
      let texte = "";
      if (b.source.type === "base64" && b.source.media_type === "application/pdf") {
        try {
          texte = await pdfEnTexte(b.source.data);
        } catch {
          texte = "(texte du PDF illisible : document scanné ou protégé)";
        }
      } else if (b.source.type === "text") {
        texte = b.source.data;
      }
      parties.push({ type: "text", text: `=== Document « ${titre} » ===\n${texte || "(document vide)"}` });
    }
  }
  return parties;
}

export function urlChatCompletions(config: ConfigIA): string {
  const base = (config.urlBase ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

function lancerCompatibleOpenAI(config: ConfigIA) {
  return (demande: DemandeIA, delaiMs: number): AppelIA => {
    const fin = (async (): Promise<ReponseIA> => {
      const cle = cleApi(config.fournisseur) ?? "";
      const entetes: Record<string, string> = { "content-type": "application/json" };
      // Azure OpenAI s'authentifie par l'en-tête « api-key », les autres par Bearer.
      if (config.fournisseur === "azure_openai") entetes["api-key"] = cle;
      else entetes.authorization = `Bearer ${cle}`;

      const contenu = [...(await blocsVersOpenAI(demande.blocs)), { type: "text" as const, text: demande.consigne }];
      const rep = await fetch(urlChatCompletions(config), {
        method: "POST",
        headers: entetes,
        signal: AbortSignal.timeout(delaiMs),
        body: JSON.stringify({
          model: config.modele,
          messages: [
            { role: "system", content: demande.systeme },
            { role: "user", content: contenu },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "analyse_dossier", strict: true, schema: demande.schema },
          },
        }),
      });
      if (!rep.ok) {
        const detail = (await rep.text().catch(() => "")).slice(0, 300);
        throw new Error(`L'API d'IA a répondu ${rep.status}${detail ? ` : ${detail}` : ""}`);
      }
      const corps = (await rep.json()) as {
        model?: string;
        choices?: Array<{ finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const choix = corps.choices?.[0];
      return {
        texte: choix?.message?.content ?? "",
        modele: corps.model ?? config.modele,
        usage: { entree: corps.usage?.prompt_tokens ?? 0, sortie: corps.usage?.completion_tokens ?? 0 },
        arret: choix?.message?.refusal ? "refus" : choix?.finish_reason === "length" ? "tronque" : "fin",
      };
    })();
    return { premiereReponse: fin.then(() => undefined, () => undefined), fin };
  };
}
