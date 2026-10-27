import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { relireSaisie } from "@/lib/modele-pf/saisie";
import { FORMAT_PROPOSITIONS, estChampWebSeul, libelleChamp, valeursDeLaSaisie, type ValeurChamp } from "@/lib/modele-pf/champs-ia";
import type { AnalysePF } from "@/lib/modele-pf/ia";
import { piecesDe, refus } from "@/lib/modele-pf/acces";

type Ctx = { params: Promise<{ id: string }> };

const CONFIANCE: Record<string, string> = { elevee: "Élevée", moyenne: "Moyenne", faible: "Faible" };

/**
 * GET — fichier « PF-PROPOSITIONS-IA v1 » pour l'outil Excel (macro « Importer les
 * propositions IA »), identifié par le code client, le radical et le code projet.
 *   ?contenu=propositions (défaut) : propositions de l'IA non rejetées ;
 *   ?contenu=saisie : toute la saisie web, pour reprendre le dossier dans l'Excel.
 */
async function exporter(req: NextRequest, user: AuthPayload, id: string) {
  if (!hasPermission(user.role as UserRole, "evaluation", "read")) return refus(403, "Vos droits ne permettent pas cette consultation");
  const e = await prisma.evaluationPF.findUnique({
    where: { id },
    include: { project: { select: { nom: true, codeProjet: true, client: { select: { codeClientT24: true, radical: true } } } } },
  });
  if (!e) return refus(404, "Scoring introuvable");
  const contenu = req.nextUrl.searchParams.get("contenu") === "saisie" ? "saisie" : "propositions";
  const saisie = relireSaisie(e.saisie);
  const analyse = e.analyseIa as unknown as AnalysePF | null;

  let lignes: { cle: string; valeur: ValeurChamp; source: string; confiance: string }[];
  let documents: string;
  if (contenu === "saisie") {
    lignes = valeursDeLaSaisie(saisie).map((l) => ({ ...l, source: "Saisie web", confiance: "Élevée" }));
    documents = "Saisie de l'outil web";
  } else {
    if (!analyse?.propositions?.length) return refus(409, "Aucune proposition de l'IA : lancez d'abord l'analyse des pièces.");
    // La fiche climat n'existe que dans l'outil web : l'outil Excel refuserait ses clés.
    lignes = analyse.propositions.filter((p) => p.decision !== "rejetee" && !estChampWebSeul(p.cle)).map((p) => ({
      cle: p.cle, valeur: p.cle === "n3_llcr" && /^\d+$/.test(String(p.valeur)) ? Number(p.valeur) : p.valeur,
      source: p.source, confiance: CONFIANCE[p.confiance] ?? "Faible",
    }));
    documents = (analyse.pieces?.length ? analyse.pieces : piecesDe(e.pieces)).map((p) => p.nom).join(", ");
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Outil web — modèle Project Finance";
  const ws = wb.addWorksheet("Propositions");
  ws.columns = [{ width: 24 }, { width: 60 }, { width: 40 }, { width: 12 }, { width: 50 }];
  const entete: [string, string][] = [
    ["Format", FORMAT_PROPOSITIONS],
    ["Code client T24", e.project.client?.codeClientT24 ?? ""],
    ["Radical", e.project.client?.radical ?? ""],
    ["Code projet", e.project.codeProjet ?? ""],
    ["Généré le", new Date().toISOString().slice(0, 10)],
    ["Documents analysés", documents.slice(0, 2000)],
  ];
  entete.forEach(([a, b], i) => {
    ws.getCell(i + 1, 1).value = a;
    ws.getCell(i + 1, 1).font = { bold: true };
    const c = ws.getCell(i + 1, 2);
    c.value = b;
    c.numFmt = "@"; // radical et codes en texte : les zéros de tête restent
  });
  ["Clé", "Valeur proposée", "Source (document, page)", "Confiance", "Libellé"].forEach((h, i) => {
    const c = ws.getCell(8, i + 1);
    c.value = h;
    c.font = { bold: true };
  });
  lignes.forEach((l, i) => {
    const r = 9 + i;
    ws.getCell(r, 1).value = l.cle;
    ws.getCell(r, 2).value = typeof l.valeur === "number" ? l.valeur : String(l.valeur);
    ws.getCell(r, 3).value = l.source;
    ws.getCell(r, 4).value = l.confiance;
    ws.getCell(r, 5).value = libelleChamp(l.cle, saisie);
  });

  const tampon = Buffer.from(await wb.xlsx.writeBuffer());
  const nom = `Propositions_${e.project.codeProjet ?? "projet"}_${contenu}.xlsx`.replace(/[^A-Za-z0-9._-]/g, "_");
  return new NextResponse(tampon, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nom}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAuth(req, (r, u) => exporter(r, u, id));
}
