import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { messagePublic } from "@/lib/erreur-publique";
import { saisieSchema } from "@/lib/modele-pf/saisie";
import type { ParametresModele } from "@/lib/modele-pf/parametres";
import { chargerParametres, calculerEvaluation, peutSaisir, peutDecider } from "@/lib/modele-pf/serveur";

interface RouteParams { params: Promise<{ id: string }> }

const demandeSchema = z.object({
  action: z.enum(["soumettre", "valider", "rejeter", "rouvrir"]),
  motif: z.string().trim().max(2000).optional(),
});

/**
 * POST — circuit du scoring : brouillon → soumis (saisie complète) → validé ou rejeté
 * (par un autre utilisateur habilité) ; un scoring soumis ou rejeté peut être rouvert.
 */
async function changer(req: NextRequest, user: AuthPayload, id: string) {
  try {
    const v = demandeSchema.safeParse(await req.json());
    if (!v.success) return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    const e = await prisma.evaluationPF.findUnique({
      where: { id },
      include: { project: { select: { id: true, creePar: true, codeProjet: true, client: { select: { codeClientT24: true, radical: true } } } } },
    });
    if (!e) return NextResponse.json({ error: "Scoring introuvable" }, { status: 404 });
    const auteurs = [e.creePar, e.project.creePar];
    const { action, motif } = v.data;
    const journal = (details: Record<string, unknown>) =>
      prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: `SCORING_PF_${action.toUpperCase()}`, details: JSON.stringify({ evaluationId: id, ...details }) } });

    if (action === "soumettre") {
      if (e.statut !== "brouillon") return NextResponse.json({ error: "Seul un brouillon se soumet" }, { status: 409 });
      if (!peutSaisir(user.role, user.userId, auteurs)) return NextResponse.json({ error: "Vos droits ne permettent pas de soumettre ce scoring" }, { status: 403 });
      const P = await chargerParametres();
      const calc = calculerEvaluation(saisieSchema.parse(e.saisie), P, { ...e.project.client, codeProjet: e.project.codeProjet });
      if (calc.controles.length) {
        return NextResponse.json({ error: `${calc.controles.length} saisie(s) exigée(s) manquante(s)`, controles: calc.controles }, { status: 422 });
      }
      await prisma.evaluationPF.update({
        where: { id },
        data: { statut: "soumis", soumisLe: new Date(), resultat: calc.resultat as never, parametres: P as never, ...calc.resume },
      });
      await journal({ statutNote: calc.resume.statutNote });
      return NextResponse.json({ statut: "soumis" });
    }

    if (action === "valider" || action === "rejeter") {
      if (e.statut !== "soumis") return NextResponse.json({ error: "Seul un scoring soumis se valide ou se rejette" }, { status: 409 });
      if (!peutDecider(user.role, user.userId, e.creePar)) {
        return NextResponse.json({ error: "La décision revient à un autre utilisateur habilité (séparation des fonctions)" }, { status: 403 });
      }
      if (action === "rejeter" && !motif) return NextResponse.json({ error: "Indiquez le motif du rejet" }, { status: 400 });
      if (action === "valider") {
        // Note validée : ni exclusion, ni blocage, ni évaluation partielle (paramètres du calcul soumis).
        const P = (e.parametres as unknown as ParametresModele | null) ?? (await chargerParametres());
        const calc = calculerEvaluation(saisieSchema.parse(e.saisie), P, { ...e.project.client, codeProjet: e.project.codeProjet });
        if (!calc.resultat.statut.startsWith("Note validable")) {
          return NextResponse.json({ error: `Note non validable : ${calc.resultat.statut}` }, { status: 422 });
        }
        await prisma.$transaction([
          prisma.evaluationPF.update({ where: { id }, data: { statut: "valide", validePar: user.userId, valideLe: new Date() } }),
          prisma.project.update({ where: { id: e.projectId }, data: { scoreGlobal: calc.resultat.score, grade: String(calc.resultat.noteApprouvee) } }),
        ]);
      } else {
        await prisma.evaluationPF.update({ where: { id }, data: { statut: "rejete", validePar: user.userId, valideLe: new Date() } });
      }
      await journal({ motif: motif ?? null });
      return NextResponse.json({ statut: action === "valider" ? "valide" : "rejete" });
    }

    // rouvrir
    if (e.statut !== "soumis" && e.statut !== "rejete") return NextResponse.json({ error: "Seul un scoring soumis ou rejeté se rouvre" }, { status: 409 });
    if (!peutSaisir(user.role, user.userId, auteurs)) return NextResponse.json({ error: "Vos droits ne permettent pas de rouvrir ce scoring" }, { status: 403 });
    await prisma.evaluationPF.update({ where: { id }, data: { statut: "brouillon", soumisLe: null, validePar: null, valideLe: null } });
    await journal({ motif: motif ?? null });
    return NextResponse.json({ statut: "brouillon" });
  } catch (err) {
    return NextResponse.json({ error: messagePublic(err, "Changement de statut impossible") }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return withAuth(req, (r, u) => changer(r, u, id));
}
