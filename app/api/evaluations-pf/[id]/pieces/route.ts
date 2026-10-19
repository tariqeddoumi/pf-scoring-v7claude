import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { messagePublic } from "@/lib/erreur-publique";
import { extensionAcceptee, EXTENSIONS_ACCEPTEES } from "@/lib/services/ia-documents/conversion";
import { cheminPiece, lienDepot, stockageConfigure, TAILLE_MAX_FICHIER } from "@/lib/services/ia-documents/stockage";
import { configIA, configurationIncomplete } from "@/lib/services/ia-documents/fournisseurs";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { evaluationModifiable, piecesDe, refus, type PiecePF } from "@/lib/modele-pf/acces";

type Ctx = { params: Promise<{ id: string }> };

/** GET — pièces du scoring et état de la configuration (stockage, IA). */
async function lister(_req: NextRequest, user: AuthPayload, id: string) {
  if (!hasPermission(user.role as UserRole, "evaluation", "read")) return refus(403, "Vos droits ne permettent pas cette consultation");
  const e = await prisma.evaluationPF.findUnique({ where: { id }, select: { pieces: true } });
  if (!e) return refus(404, "Scoring introuvable");
  const ia = configurationIncomplete(await configIA());
  return NextResponse.json({
    // Le chemin de stockage reste côté serveur.
    pieces: piecesDe(e.pieces).map((p) => ({ id: p.id, nom: p.nom, taille: p.taille, type: p.type, deposeLe: p.deposeLe })),
    configuration: { stockage: stockageConfigure(), ia: ia === null, iaManque: ia, extensions: EXTENSIONS_ACCEPTEES, tailleMax: TAILLE_MAX_FICHIER },
  });
}

/** POST — déclare une pièce et renvoie un lien de dépôt signé (le fichier part directement au stockage privé). */
async function declarer(req: NextRequest, user: AuthPayload, id: string) {
  const corps = await req.json().catch(() => ({}));
  const nom = typeof corps.fileName === "string" ? corps.fileName.trim().slice(0, 250) : "";
  const taille = Number(corps.fileSize);
  const type = typeof corps.fileType === "string" ? corps.fileType.slice(0, 120) : "";
  if (!nom || !extensionAcceptee(nom)) return refus(400, `Format non accepté. Formats acceptés : ${EXTENSIONS_ACCEPTEES.join(", ")}.`);
  if (!Number.isFinite(taille) || taille <= 0 || taille > TAILLE_MAX_FICHIER) return refus(400, "Fichier vide ou trop volumineux (50 Mo au plus).");
  if (!stockageConfigure()) return refus(503, "Stockage des pièces non configuré sur le serveur.");
  const a = await evaluationModifiable(id, user);
  if (!a.ok) return a.refus;
  const pieces = piecesDe(a.e.pieces);
  if (pieces.length >= 30) return refus(400, "30 pièces au plus par scoring.");

  const piece: PiecePF = { id: randomUUID(), nom, taille: Math.round(taille), type, chemin: "", deposePar: user.userId, deposeLe: new Date().toISOString() };
  piece.chemin = cheminPiece(`pf-${id}`, piece.id, nom);
  try {
    const lien = await lienDepot(piece.chemin, type || undefined);
    // Écrit sur la version lue : deux dépôts simultanés ne s'écrasent pas la liste.
    const n = await prisma.evaluationPF.updateMany({ where: { id, statut: "brouillon", updatedAt: a.e.updatedAt }, data: { pieces: [...pieces, piece] as unknown as Prisma.InputJsonValue } });
    if (n.count !== 1) return refus(409, "Le scoring a changé pendant le dépôt : réessayez.");
    return NextResponse.json({ pieceId: piece.id, url: lien.url, methode: lien.methode, entetes: lien.entetes });
  } catch (err) {
    return refus(502, messagePublic(err, "Lien de dépôt impossible"));
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAuth(req, (r, u) => lister(r, u, id));
}
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAuth(req, (r, u) => declarer(r, u, id));
}
