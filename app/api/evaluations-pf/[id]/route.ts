import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { messagePublic } from "@/lib/erreur-publique";
import { peutVoirScores } from "@/lib/score-visibility";
import { relireSaisie, saisieSchema } from "@/lib/modele-pf/saisie";
import { fusionnerOrigines } from "@/lib/modele-pf/origines";
import { fusionnerParametres, parametresVisibles } from "@/lib/modele-pf/parametres";
import { dernierRejet, intervenantsScoring, piecesDe } from "@/lib/modele-pf/acces";
import { chargerParametres, calculerEvaluation, peutSaisir, peutDecider, resultatVisible } from "@/lib/modele-pf/serveur";

interface RouteParams { params: Promise<{ id: string }> }

const inclure = {
  project: {
    select: {
      id: true, nom: true, codeProjet: true, secteur: true, creePar: true, montant: true, devise: true,
      client: { select: { id: true, nom: true, codeClientT24: true, radical: true } },
      credits: { orderBy: [{ ordre: "asc" as const }, { createdAt: "asc" as const }] },
    },
  },
};

type Charge = NonNullable<Awaited<ReturnType<typeof charger>>>;
async function charger(id: string) {
  return prisma.evaluationPF.findUnique({ where: { id }, include: inclure });
}

function reponse(
  e: Charge,
  user: AuthPayload,
  P: Awaited<ReturnType<typeof chargerParametres>>,
  extra: { intervenants?: string[]; rejet?: { motif: string | null; le: Date } | null } = {}
) {
  const saisie = relireSaisie(e.saisie);
  const codes = { codeClientT24: e.project.client?.codeClientT24, radical: e.project.client?.radical, codeProjet: e.project.codeProjet };
  const calc = calculerEvaluation(saisie, P, codes);
  const voir = peutVoirScores(user.role);
  return {
    id: e.id, titre: e.titre, statut: e.statut, createdAt: e.createdAt, updatedAt: e.updatedAt, soumisLe: e.soumisLe, valideLe: e.valideLe,
    projet: { id: e.project.id, nom: e.project.nom, codeProjet: e.project.codeProjet, secteur: e.project.secteur, client: e.project.client },
    credits: e.project.credits,
    saisie,
    resultat: resultatVisible(calc.resultat, user.role),
    controles: calc.controles,
    voirScores: voir,
    // Sans visibilité des notes : ni barème de conversion, ni niveau des plafonds.
    parametres: parametresVisibles(P, voir),
    droits: {
      saisir: e.statut === "brouillon" && peutSaisir(user.role, user.userId, [e.creePar, e.project.creePar]),
      decider: e.statut === "soumis" && peutDecider(user.role, user.userId, extra.intervenants ?? [e.creePar, e.modifiePar, e.project.creePar]),
      rouvrir: (e.statut === "soumis" || e.statut === "rejete") && peutSaisir(user.role, user.userId, [e.creePar, e.project.creePar]),
    },
    analyseIa: e.analyseIa ?? null,
    dernierRejet: extra.rejet ?? null,
    // Le chemin de stockage reste côté serveur.
    pieces: piecesDe(e.pieces).map((p) => ({ id: p.id, nom: p.nom, taille: p.taille, type: p.type, deposeLe: p.deposeLe })),
  };
}

/** GET — saisie, résultat recalculé avec les paramètres en vigueur, contrôles et droits. */
async function lire(_req: NextRequest, user: AuthPayload, id: string) {
  const e = await charger(id);
  if (!e) return NextResponse.json({ error: "Scoring introuvable" }, { status: 404 });
  // Un scoring soumis ou validé se relit avec les paramètres de son calcul : la note reste
  // reproductible même si le paramétrage change ensuite.
  const P = e.statut !== "brouillon" && e.parametres ? fusionnerParametres(e.parametres as never) : await chargerParametres();
  const [intervenants, rejet] = await Promise.all([intervenantsScoring(e), dernierRejet(id)]);
  return NextResponse.json(reponse(e, user, P, { intervenants, rejet }));
}

/** PUT — enregistre la saisie (brouillon seulement) ; le serveur recalcule et conserve le résultat. */
async function enregistrer(req: NextRequest, user: AuthPayload, id: string) {
  try {
    const e = await charger(id);
    if (!e) return NextResponse.json({ error: "Scoring introuvable" }, { status: 404 });
    if (e.statut !== "brouillon") return NextResponse.json({ error: "Ce scoring n'est plus modifiable : rouvrez-le d'abord." }, { status: 409 });
    if (!peutSaisir(user.role, user.userId, [e.creePar, e.project.creePar])) {
      return NextResponse.json({ error: "Vos droits ne permettent pas de modifier ce scoring" }, { status: 403 });
    }
    const corps = await req.json();
    const v = saisieSchema.safeParse(corps.saisie);
    if (!v.success) {
      return NextResponse.json({ error: "Saisie invalide", erreurs: v.error.issues.slice(0, 20).map((i) => ({ chemin: i.path.join("."), message: i.message })) }, { status: 400 });
    }
    // Les origines « IA » sont celles écrites par le serveur à l'acceptation des propositions.
    v.data.origines = fusionnerOrigines(v.data.origines, relireSaisie(e.saisie).origines);
    const P = await chargerParametres();
    const calc = calculerEvaluation(v.data, P, { codeClientT24: e.project.client?.codeClientT24, radical: e.project.client?.radical, codeProjet: e.project.codeProjet });
    // Écrit seulement si le scoring est toujours au brouillon (il a pu être soumis entre-temps).
    const ecrit = await prisma.evaluationPF.updateMany({
      where: { id, statut: "brouillon" },
      data: {
        saisie: v.data as unknown as Prisma.InputJsonValue, resultat: calc.resultat as unknown as Prisma.InputJsonValue,
        parametres: P as unknown as Prisma.InputJsonValue, ...calc.resume, modifiePar: user.userId,
        ...(typeof corps.titre === "string" ? { titre: corps.titre.trim().slice(0, 200) || null } : {}),
      },
    });
    if (ecrit.count !== 1) return NextResponse.json({ error: "Ce scoring n'est plus modifiable : il a été soumis entre-temps." }, { status: 409 });
    // modifiePar ne garde que le dernier rédacteur : chaque nouveau contributeur est tracé
    // pour être écarté de la décision (séparation des fonctions).
    if (e.modifiePar !== user.userId) {
      await prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: "SCORING_PF_CONTRIBUTION", details: JSON.stringify({ evaluationId: id }) } });
    }
    const maj = (await charger(id))!;
    return NextResponse.json(reponse(maj, user, P));
  } catch (err) {
    return NextResponse.json({ error: messagePublic(err, "Enregistrement impossible") }, { status: 500 });
  }
}

/** DELETE — supprime un brouillon. */
async function supprimer(_req: NextRequest, user: AuthPayload, id: string) {
  const e = await charger(id);
  if (!e) return NextResponse.json({ error: "Scoring introuvable" }, { status: 404 });
  if (e.statut !== "brouillon") return NextResponse.json({ error: "Seul un brouillon se supprime" }, { status: 409 });
  if (!peutSaisir(user.role, user.userId, [e.creePar, e.project.creePar])) {
    return NextResponse.json({ error: "Vos droits ne permettent pas de supprimer ce scoring" }, { status: 403 });
  }
  // Suppression conditionnelle : le scoring a pu être soumis entre la lecture et la suppression.
  if ((await prisma.evaluationPF.deleteMany({ where: { id, statut: "brouillon" } })).count !== 1) {
    return NextResponse.json({ error: "Seul un brouillon se supprime" }, { status: 409 });
  }
  await prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: "SCORING_PF_SUPPRIME", details: JSON.stringify({ evaluationId: id }) } });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => lire(r, u, id));
}
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => enregistrer(r, u, id));
}
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => supprimer(r, u, id));
}
