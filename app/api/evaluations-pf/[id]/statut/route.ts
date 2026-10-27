import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { messagePublic } from "@/lib/erreur-publique";
import { relireSaisie } from "@/lib/modele-pf/saisie";
import { fusionnerParametres, gradeDeLaNote } from "@/lib/modele-pf/parametres";
import { chargerParametres, calculerEvaluation, peutSaisir, peutDecider } from "@/lib/modele-pf/serveur";
import { getAppConfigKey } from "@/lib/services/app-config-service";
import { intervenantsScoring } from "@/lib/modele-pf/acces";
import { delegationSuffisante, lireMatriceDelegation, roleRequisPourMontant } from "@/lib/services/scoring/decision-guard";

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
      include: { project: { select: { id: true, creePar: true, codeProjet: true, montant: true, credits: { select: { montant: true } }, client: { select: { codeClientT24: true, radical: true } } } } },
    });
    if (!e) return NextResponse.json({ error: "Scoring introuvable" }, { status: 404 });
    const auteurs = [e.creePar, e.project.creePar];
    const { action, motif } = v.data;
    // Transition atomique : le changement ne s'applique que si le statut lu est toujours
    // celui de la base (deux décisions simultanées, ou une saisie soumise entre-temps).
    const passer = async (de: string, data: Prisma.EvaluationPFUpdateManyMutationInput) =>
      (await prisma.evaluationPF.updateMany({ where: { id, statut: de, updatedAt: e.updatedAt }, data })).count === 1;
    const conflit = () => NextResponse.json({ error: "Le scoring a changé entre-temps : rechargez la page." }, { status: 409 });
    const journal = (details: Record<string, unknown>) =>
      prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: `SCORING_PF_${action.toUpperCase()}`, details: JSON.stringify({ evaluationId: id, ...details }) } });

    if (action === "soumettre") {
      if (e.statut !== "brouillon") return NextResponse.json({ error: "Seul un brouillon se soumet" }, { status: 409 });
      if (!peutSaisir(user.role, user.userId, auteurs)) return NextResponse.json({ error: "Vos droits ne permettent pas de soumettre ce scoring" }, { status: 403 });
      const P = await chargerParametres();
      const calc = calculerEvaluation(relireSaisie(e.saisie), P, { ...e.project.client, codeProjet: e.project.codeProjet });
      if (calc.controles.length) {
        return NextResponse.json({ error: `${calc.controles.length} saisie(s) exigée(s) manquante(s)`, controles: calc.controles }, { status: 422 });
      }
      // modifiePar garde la trace de qui a soumis : il ne pourra pas valider.
      if (!(await passer("brouillon", { statut: "soumis", soumisLe: new Date(), modifiePar: user.userId, resultat: calc.resultat as never, parametres: P as never, ...calc.resume }))) return conflit();
      await journal({ statutNote: calc.resume.statutNote });
      return NextResponse.json({ statut: "soumis" });
    }

    if (action === "valider" || action === "rejeter") {
      if (e.statut !== "soumis") return NextResponse.json({ error: "Seul un scoring soumis se valide ou se rejette" }, { status: 409 });
      // Tous ceux qui ont contribué à la saisie sont écartés, pas seulement le dernier rédacteur
      // (modifiePar) : sinon un décideur qui a modifié le brouillon validait son propre travail.
      if (!peutDecider(user.role, user.userId, await intervenantsScoring(e))) {
        return NextResponse.json({ error: "La décision revient à un autre utilisateur habilité (séparation des fonctions)" }, { status: 403 });
      }
      if (action === "rejeter" && !motif) return NextResponse.json({ error: "Indiquez le motif du rejet" }, { status: 400 });
      if (action === "valider") {
        // Le montant retenu est le plus élevé entre le projet, l'exposition saisie (figée à la
        // soumission) et les crédits : le montant du projet seul se modifiait après soumission.
        // Une matrice illisible bloque la validation au lieu de lever toute délégation.
        let matrice: string | null;
        try {
          matrice = await getAppConfigKey("delegation.matrice");
        } catch {
          return NextResponse.json({ error: "Matrice de délégation illisible : validation impossible pour l'instant" }, { status: 503 });
        }
        const exposition = Number(relireSaisie(e.saisie).proportionnalite?.exposition ?? 0) * 1e6;
        const credits = e.project.credits.reduce((t, c) => t + (c.montant ?? 0), 0) * 1e6;
        const montant = Math.max(e.project.montant ?? 0, Number.isFinite(exposition) ? exposition : 0, credits);
        const roleRequis = roleRequisPourMontant(lireMatriceDelegation(matrice), montant);
        if (!delegationSuffisante(user.role, roleRequis)) {
          return NextResponse.json({ error: `Délégation insuffisante pour ce montant : validation réservée au rôle ${roleRequis} ou supérieur` }, { status: 403 });
        }
        // Note validée : ni exclusion, ni blocage, ni évaluation partielle (paramètres du calcul soumis).
        // Paramètres du calcul, complétés des règles ajoutées depuis (inactives par défaut).
        const P = e.parametres ? fusionnerParametres(e.parametres as never) : await chargerParametres();
        const calc = calculerEvaluation(relireSaisie(e.saisie), P, { ...e.project.client, codeProjet: e.project.codeProjet });
        if (!calc.resultat.statut.startsWith("Note validable")) {
          return NextResponse.json({ error: `Note non validable : ${calc.resultat.statut}` }, { status: 422 });
        }
        const ok = await prisma.$transaction(async (tx) => {
          const n = await tx.evaluationPF.updateMany({ where: { id, statut: "soumis", updatedAt: e.updatedAt }, data: { statut: "valide", validePar: user.userId, valideLe: new Date() } });
          if (n.count !== 1) return false;
          // Le projet reçoit le grade de l'échelle de la banque (AAA à D), pas la note 1 à 10 :
          // la note brute s'affichait en badge rouge et manquait aux répartitions.
          await tx.project.update({ where: { id: e.projectId }, data: { scoreGlobal: calc.resultat.score, grade: gradeDeLaNote(calc.resultat.noteApprouvee, P), status: "approuve" } });
          return true;
        });
        if (!ok) return conflit();
      } else if (!(await passer("soumis", { statut: "rejete", validePar: user.userId, valideLe: new Date() }))) return conflit();
      await journal({ motif: motif ?? null });
      return NextResponse.json({ statut: action === "valider" ? "valide" : "rejete" });
    }

    // rouvrir
    if (e.statut !== "soumis" && e.statut !== "rejete") return NextResponse.json({ error: "Seul un scoring soumis ou rejeté se rouvre" }, { status: 409 });
    if (!peutSaisir(user.role, user.userId, auteurs)) return NextResponse.json({ error: "Vos droits ne permettent pas de rouvrir ce scoring" }, { status: 403 });
    if (!(await passer(e.statut, { statut: "brouillon", soumisLe: null, validePar: null, valideLe: null }))) return conflit();
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
