import type Anthropic from "@anthropic-ai/sdk";

/**
 * Conversion des pièces du dossier en contenu lisible par Claude.
 *
 * - PDF et images : transmis tels quels (Claude lit les PDF page par page, tableaux
 *   et graphiques compris, et peut citer la page).
 * - Word (.docx) : texte extrait (mammoth).
 * - Excel (.xlsx) : chaque feuille rendue en lignes « A1: valeur | B1: valeur », en
 *   reprenant le RÉSULTAT des formules, pour que l'IA lise les chiffres du modèle
 *   financier et puisse indiquer la feuille et la cellule.
 * - CSV, TXT : texte brut.
 * Les anciens formats binaires (.doc, .xls) et les autres types sont refusés avec un
 * motif : mieux vaut demander une conversion qu'analyser un document illisible.
 */

export type BlocContenu = Anthropic.Beta.Messages.BetaContentBlockParam;

export interface PieceConvertie {
  nom: string;
  blocs: BlocContenu[];
  /** Taille utile envoyée (octets), pour respecter la limite de la requête. */
  taille: number;
  avertissement?: string;
}

export const EXTENSIONS_ACCEPTEES = ["pdf", "png", "jpg", "jpeg", "webp", "gif", "docx", "xlsx", "csv", "txt"] as const;

const IMAGES: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

/** Plafond du texte extrait d'une feuille Excel (au-delà, la feuille est tronquée et signalée). */
export const MAX_CELLULES_PAR_FEUILLE = 20_000;

export function extensionDe(nom: string): string {
  const i = nom.lastIndexOf(".");
  return i >= 0 ? nom.slice(i + 1).toLowerCase() : "";
}

export function extensionAcceptee(nom: string): boolean {
  return (EXTENSIONS_ACCEPTEES as readonly string[]).includes(extensionDe(nom));
}

function blocTexte(nom: string, texte: string, contexte: string): BlocContenu {
  return {
    type: "document",
    source: { type: "text", media_type: "text/plain", data: texte || "(document vide)" },
    title: nom,
    context: contexte,
  };
}

/** Valeur affichable d'une cellule ExcelJS (résultat des formules, dates ISO). */
export function valeurCellule(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("result" in o) return valeurCellule(o.result);
    if ("richText" in o && Array.isArray(o.richText)) {
      return (o.richText as Array<{ text?: string }>).map((r) => r.text ?? "").join("");
    }
    if ("text" in o) return String(o.text);
    if ("error" in o) return String(o.error);
    return "";
  }
  return String(v);
}

async function excelEnTexte(contenu: Buffer): Promise<{ texte: string; tronque: boolean }> {
  const ExcelJS = (await import("exceljs")).default;
  const classeur = new ExcelJS.Workbook();
  await classeur.xlsx.load(contenu as unknown as ArrayBuffer);
  const parties: string[] = [];
  let tronque = false;
  classeur.eachSheet((feuille) => {
    const lignes: string[] = [`=== Feuille « ${feuille.name} » ===`];
    let n = 0;
    feuille.eachRow({ includeEmpty: false }, (ligne) => {
      if (n >= MAX_CELLULES_PAR_FEUILLE) {
        tronque = true;
        return;
      }
      const cellules: string[] = [];
      ligne.eachCell({ includeEmpty: false }, (cellule) => {
        const v = valeurCellule(cellule.value).trim();
        if (v) {
          cellules.push(`${cellule.address}: ${v}`);
          n++;
        }
      });
      if (cellules.length) lignes.push(cellules.join(" | "));
    });
    parties.push(lignes.join("\n"));
  });
  return { texte: parties.join("\n\n"), tronque };
}

export async function convertirPiece(nom: string, contenu: Buffer): Promise<PieceConvertie> {
  const ext = extensionDe(nom);

  if (ext === "pdf") {
    const data = contenu.toString("base64");
    return {
      nom,
      taille: data.length,
      blocs: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data },
          title: nom,
        },
      ],
    };
  }

  if (ext in IMAGES) {
    const data = contenu.toString("base64");
    return {
      nom,
      taille: data.length,
      blocs: [
        { type: "text", text: `Image jointe : « ${nom} »` },
        { type: "image", source: { type: "base64", media_type: IMAGES[ext], data } },
      ],
    };
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: contenu });
    return { nom, taille: value.length, blocs: [blocTexte(nom, value, "Document Word converti en texte.")] };
  }

  if (ext === "xlsx") {
    const { texte, tronque } = await excelEnTexte(contenu);
    return {
      nom,
      taille: texte.length,
      blocs: [blocTexte(nom, texte, "Classeur Excel : une ligne par rangée, chaque cellule sous la forme ADRESSE: valeur (résultat des formules).")],
      avertissement: tronque ? `Classeur « ${nom} » tronqué à ${MAX_CELLULES_PAR_FEUILLE} cellules par feuille.` : undefined,
    };
  }

  if (ext === "csv" || ext === "txt") {
    const texte = contenu.toString("utf-8");
    return { nom, taille: texte.length, blocs: [blocTexte(nom, texte, "Fichier texte.")] };
  }

  throw new Error(
    `Format non pris en charge pour « ${nom} » : convertissez-le en PDF, DOCX ou XLSX (formats acceptés : ${EXTENSIONS_ACCEPTEES.join(", ")}).`
  );
}
