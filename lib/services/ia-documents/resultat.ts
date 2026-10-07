import { z } from "zod";

/**
 * Résultat attendu de l'analyse documentaire : schéma JSON imposé à Claude (sortie
 * structurée) et schéma zod qui le revalide côté serveur. Les deux décrivent la même
 * forme ; toute réponse qui ne la respecte pas est rejetée, jamais « devinée ».
 */

const nullable = (type: string) => ({ type: [type, "null"] });

export const SCHEMA_SORTIE = {
  type: "object",
  additionalProperties: false,
  required: ["synthese", "documents", "criteres", "questions"],
  properties: {
    synthese: { type: "string" },
    documents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nom", "typeIdentifie", "role", "complet", "elementsManquants", "incoherences"],
        properties: {
          nom: { type: "string" },
          typeIdentifie: { type: "string" },
          role: { type: "string" },
          complet: { type: "boolean" },
          elementsManquants: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["element", "importance", "demandeClient"],
              properties: {
                element: { type: "string" },
                importance: { type: "string", enum: ["bloquant", "important", "secondaire"] },
                demandeClient: { type: "string" },
              },
            },
          },
          incoherences: { type: "array", items: { type: "string" } },
        },
      },
    },
    criteres: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "code",
          "statut",
          "optionChoisie",
          "valeurNombre",
          "valeurBooleen",
          "valeurTexte",
          "confiance",
          "justification",
          "sources",
          "documentAttendu",
        ],
        properties: {
          code: { type: "string" },
          statut: { type: "string", enum: ["trouve", "partiel", "absent"] },
          optionChoisie: nullable("string"),
          valeurNombre: nullable("number"),
          valeurBooleen: nullable("boolean"),
          valeurTexte: nullable("string"),
          confiance: { type: "string", enum: ["elevee", "moyenne", "faible"] },
          justification: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["document", "localisation", "extrait"],
              properties: {
                document: { type: "string" },
                localisation: { type: "string" },
                extrait: { type: "string" },
              },
            },
          },
          documentAttendu: nullable("string"),
        },
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "destinataire", "criteres", "documentAttendu"],
        properties: {
          question: { type: "string" },
          destinataire: { type: "string", enum: ["charge_etudes", "client"] },
          criteres: { type: "array", items: { type: "string" } },
          documentAttendu: nullable("string"),
        },
      },
    },
  },
} as const;

const source = z.object({ document: z.string(), localisation: z.string(), extrait: z.string() });

export const resultatSchema = z.object({
  synthese: z.string(),
  documents: z.array(
    z.object({
      nom: z.string(),
      typeIdentifie: z.string(),
      role: z.string(),
      complet: z.boolean(),
      elementsManquants: z.array(
        z.object({
          element: z.string(),
          importance: z.enum(["bloquant", "important", "secondaire"]),
          demandeClient: z.string(),
        })
      ),
      incoherences: z.array(z.string()),
    })
  ),
  criteres: z.array(
    z.object({
      code: z.string(),
      statut: z.enum(["trouve", "partiel", "absent"]),
      optionChoisie: z.string().nullable(),
      valeurNombre: z.number().nullable(),
      valeurBooleen: z.boolean().nullable(),
      valeurTexte: z.string().nullable(),
      confiance: z.enum(["elevee", "moyenne", "faible"]),
      justification: z.string(),
      sources: z.array(source),
      documentAttendu: z.string().nullable(),
    })
  ),
  questions: z.array(
    z.object({
      question: z.string(),
      destinataire: z.enum(["charge_etudes", "client"]),
      criteres: z.array(z.string()),
      documentAttendu: z.string().nullable(),
    })
  ),
});

export type ResultatAnalyse = z.infer<typeof resultatSchema>;
export type CritereExtrait = ResultatAnalyse["criteres"][number];

/** Critère de la grille tel que l'analyste le saisit (feuille du questionnaire). */
export interface CritereGrille {
  id: string;
  code: string;
  label: string;
  description?: string;
  answerType?: string;
  isMandatory?: boolean;
  options?: { value: string; label: string; quandChoisir?: string }[];
  ranges?: { minValue: number; maxValue: number; label?: string }[];
  /** Donnée alimentée par une source verrouillée : l'IA ne la propose pas. */
  verrouille?: boolean;
}

export type NatureReponse = "option" | "nombre" | "booleen" | "texte";

/** Même règle que l'écran de saisie : options, sinon plages, sinon oui/non, sinon texte. */
export function natureReponse(c: CritereGrille): NatureReponse {
  if (c.options && c.options.length > 0) return "option";
  if (c.ranges && c.ranges.length > 0) return "nombre";
  if (c.answerType === "BOOLEAN") return "booleen";
  if (["NUMERIC", "NUMERIC_RANGE", "PERCENTAGE", "CURRENCY"].includes(c.answerType ?? "")) return "nombre";
  return "texte";
}

export interface Proposition {
  nodeId: string;
  code: string;
  label: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  /** Libellé lisible de la valeur proposée. */
  affichage: string;
  confiance: CritereExtrait["confiance"];
  statut: CritereExtrait["statut"];
  justification: string;
  sources: CritereExtrait["sources"];
}

export interface Manquant {
  nodeId: string;
  code: string;
  label: string;
  obligatoire: boolean;
  documentAttendu: string | null;
  motif: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Traduit les extractions de l'IA en propositions de réponse VÉRIFIÉES contre la
 * grille : code connu, option existante, nombre fini, critère non verrouillé. Ce qui
 * ne passe pas ces contrôles devient un « manquant » avec son motif — l'IA ne peut
 * pas introduire une valeur que l'écran de saisie refuserait.
 */
export function construirePropositions(
  resultat: ResultatAnalyse,
  criteres: CritereGrille[]
): { propositions: Proposition[]; manquants: Manquant[] } {
  const parCode = new Map(resultat.criteres.map((c) => [norm(c.code), c]));
  const propositions: Proposition[] = [];
  const manquants: Manquant[] = [];

  for (const g of criteres) {
    if (g.verrouille) continue;
    const e = parCode.get(norm(g.code));
    const manque = (motif: string) =>
      manquants.push({
        nodeId: g.id,
        code: g.code,
        label: g.label,
        obligatoire: Boolean(g.isMandatory),
        documentAttendu: e?.documentAttendu ?? null,
        motif,
      });

    if (!e || e.statut === "absent") {
      manque(e?.justification || "Information non trouvée dans les pièces fournies.");
      continue;
    }

    const base = {
      nodeId: g.id,
      code: g.code,
      label: g.label,
      confiance: e.confiance,
      statut: e.statut,
      justification: e.justification,
      sources: e.sources,
    };

    switch (natureReponse(g)) {
      case "option": {
        const voulu = e.optionChoisie ?? e.valeurTexte;
        const opt = voulu
          ? g.options!.find((o) => norm(o.value) === norm(voulu) || norm(o.label) === norm(voulu))
          : undefined;
        if (!opt) {
          manque(`Réponse « ${voulu ?? "—"} » hors des options de la grille. ${e.justification}`);
          continue;
        }
        propositions.push({ ...base, valueString: opt.value, affichage: opt.label });
        break;
      }
      case "nombre": {
        const n = e.valeurNombre;
        if (n === null || !Number.isFinite(n)) {
          manque(`Aucune valeur numérique exploitable. ${e.justification}`);
          continue;
        }
        propositions.push({ ...base, valueNumber: n, affichage: n.toLocaleString("fr-FR") });
        break;
      }
      case "booleen": {
        if (e.valeurBooleen === null) {
          manque(`Réponse oui/non non établie. ${e.justification}`);
          continue;
        }
        propositions.push({ ...base, valueBoolean: e.valeurBooleen, affichage: e.valeurBooleen ? "Oui" : "Non" });
        break;
      }
      default: {
        const t = (e.valeurTexte ?? "").trim();
        if (!t) {
          manque(`Aucun texte extrait. ${e.justification}`);
          continue;
        }
        propositions.push({ ...base, valueString: t.slice(0, 2000), affichage: t.slice(0, 200) });
      }
    }
  }
  return { propositions, manquants };
}

/** Commentaire de traçabilité enregistré avec une réponse issue d'une proposition. */
export function commentaireSource(p: Proposition, validePar: string): string {
  const src = p.sources
    .slice(0, 3)
    .map((s) => `${s.document}${s.localisation ? ` (${s.localisation})` : ""}`)
    .join(" ; ");
  return `Extrait par l'IA, validé par ${validePar} — source : ${src || "non précisée"} — confiance ${p.confiance}.`;
}
