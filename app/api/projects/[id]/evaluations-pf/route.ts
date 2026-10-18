import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { messagePublic } from "@/lib/erreur-publique";
import { peutVoirScores } from "@/lib/score-visibility";
import { saisieSchema, saisieVide, type SaisiePF } from "@/lib/modele-pf/saisie";
import { secteurDepuisCodeBase, saisieDepuisCasExcel } from "@/lib/modele-pf/conversion";
import { chargerParametres, calculerEvaluation, peutSaisir } from "@/lib/modele-pf/serveur";
import casEtude from "@/lib/modele-pf/cas-etude.json";

interface RouteParams { params: Promise<{ id: string }> }

/** GET — scorings Project Finance du projet (résumé). */
async function lister(_req: NextRequest, user: AuthPayload, id: string) {
  const projet = await prisma.project.findUnique({ where: { id }, select: { id: true } });
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  const liste = await prisma.evaluationPF.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, titre: true, statut: true, scoreGlobal: true, noteCalculee: true, noteApprouvee: true, regimeRetenu: true,
      statutNote: true, createdAt: true, updatedAt: true, creePar: true },
  });
  const voir = peutVoirScores(user.role);
  return NextResponse.json({
    evaluations: liste.map((e) => (voir ? e : { ...e, scoreGlobal: undefined, noteCalculee: undefined, noteApprouvee: undefined })),
  });
}

const creationSchema = z.object({
  titre: z.string().trim().max(200).optional(),
  /** Copie d'un scoring existant du même projet (variante de montage) */
  dupliquerDe: z.string().uuid().optional(),
  /** Reprise d'un des 18 cas d'étude de l'outil Excel (formation, essais) */
  casEtude: z.string().max(20).optional(),
});

/** POST — nouveau scoring : vide (prérempli depuis le projet), copie d'un scoring, ou cas d'étude. */
async function creer(req: NextRequest, user: AuthPayload, id: string) {
  try {
    const projet = await prisma.project.findUnique({
      where: { id },
      select: { id: true, creePar: true, secteur: true, dureeCredit: true, codeProjet: true,
        client: { select: { codeClientT24: true, radical: true } }, credits: { select: { montant: true } } },
    });
    if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    if (!peutSaisir(user.role, user.userId, [projet.creePar])) {
      return NextResponse.json({ error: "Vos droits ne permettent pas de créer un scoring sur ce projet" }, { status: 403 });
    }
    const v = creationSchema.safeParse(await req.json().catch(() => ({})));
    if (!v.success) return NextResponse.json({ error: v.error.issues[0]?.message ?? "Demande invalide" }, { status: 400 });

    let saisie: SaisiePF;
    let origine = "vide";
    if (v.data.dupliquerDe) {
      const source = await prisma.evaluationPF.findFirst({ where: { id: v.data.dupliquerDe, projectId: id }, select: { saisie: true } });
      if (!source) return NextResponse.json({ error: "Scoring à dupliquer introuvable" }, { status: 404 });
      saisie = saisieSchema.parse(source.saisie);
      origine = `copie de ${v.data.dupliquerDe}`;
    } else if (v.data.casEtude) {
      const c = (casEtude as { dossier: { onglet: string } }[]).find((x) => x.dossier.onglet === v.data.casEtude);
      if (!c) return NextResponse.json({ error: "Cas d'étude inconnu" }, { status: 404 });
      saisie = saisieDepuisCasExcel(c.dossier);
      origine = `cas d'étude ${v.data.casEtude}`;
    } else {
      saisie = saisieVide();
      saisie.secteur = secteurDepuisCodeBase(projet.secteur);
      if (projet.dureeCredit) saisie.proportionnalite.duree = projet.dureeCredit;
      const totalCredits = projet.credits.reduce((s, c) => s + (c.montant ?? 0), 0);
      if (totalCredits > 0) saisie.proportionnalite.exposition = totalCredits;
    }
    const P = await chargerParametres();
    const calc = calculerEvaluation(saisie, P, { ...projet.client, codeProjet: projet.codeProjet });
    const e = await prisma.evaluationPF.create({
      data: {
        projectId: id, titre: v.data.titre || null, saisie: saisie as unknown as Prisma.InputJsonValue,
        resultat: calc.resultat as unknown as Prisma.InputJsonValue, parametres: P as unknown as Prisma.InputJsonValue,
        ...calc.resume, creePar: user.userId, modifiePar: user.userId,
      },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: { projectId: id, utilisateurId: user.userId, action: "SCORING_PF_CREE", details: JSON.stringify({ evaluationId: e.id, origine }) },
    });
    return NextResponse.json(e, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: messagePublic(e, "Création du scoring impossible") }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => lister(r, u, id));
}
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => creer(r, u, id));
}
