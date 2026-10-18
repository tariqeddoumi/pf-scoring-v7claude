import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { messagePublic } from "@/lib/erreur-publique";
import { saisieSchema } from "@/lib/modele-pf/saisie";
import { ecrireChamp, normaliser } from "@/lib/modele-pf/champs-ia";
import type { AnalysePF } from "@/lib/modele-pf/ia";
import { chargerParametres, calculerEvaluation } from "@/lib/modele-pf/serveur";
import { evaluationModifiable, refus } from "@/lib/modele-pf/acces";

type Ctx = { params: Promise<{ id: string }> };

const corpsSchema = z.object({
  decisions: z.array(z.object({ cle: z.string().max(60), decision: z.enum(["acceptee", "rejetee"]) })).min(1).max(800),
});

/**
 * POST — décisions de l'analyste sur les propositions de l'IA. Une proposition acceptée
 * est écrite dans la saisie (valeur revérifiée), puis le scoring est recalculé ; chaque
 * décision est tracée dans le journal d'audit avec la valeur, la source et la confiance.
 */
async function decider(req: NextRequest, user: AuthPayload, id: string) {
  const v = corpsSchema.safeParse(await req.json().catch(() => null));
  if (!v.success) return refus(400, "Décisions invalides");
  const a = await evaluationModifiable(id, user);
  if (!a.ok) return a.refus;
  const e = a.e;
  const analyse = e.analyseIa as unknown as AnalysePF | null;
  if (!analyse?.propositions?.length) return refus(409, "Aucune proposition en attente : relancez l'analyse.");

  try {
    const saisie = saisieSchema.parse(e.saisie);
    const maintenant = new Date().toISOString();
    const trace: { cle: string; decision: string; valeur: unknown; avant: unknown; source: string; confiance: string }[] = [];
    const parCle = new Map(analyse.propositions.map((p) => [p.cle, p]));
    for (const d of v.data.decisions) {
      const p = parCle.get(d.cle);
      if (!p || p.decision !== "en_attente") continue;
      if (d.decision === "acceptee") {
        const n = normaliser(p.cle, p.valeur);
        if (!n.ok || !ecrireChamp(saisie, p.cle, n.valeur)) continue;
      }
      p.decision = d.decision;
      p.decidePar = user.userId;
      p.decideLe = maintenant;
      trace.push({ cle: p.cle, decision: d.decision, valeur: p.valeur, avant: p.actuelle, source: p.source, confiance: p.confiance });
    }
    if (!trace.length) return refus(409, "Ces propositions ont déjà été traitées.");
    const propre = saisieSchema.safeParse(saisie);
    if (!propre.success) return refus(422, `Proposition incompatible avec la saisie : ${propre.error.issues[0]?.path.join(".")}`);

    const P = await chargerParametres();
    const calc = calculerEvaluation(propre.data, P, { codeClientT24: e.project.client?.codeClientT24, radical: e.project.client?.radical, codeProjet: e.project.codeProjet });
    await prisma.$transaction([
      prisma.evaluationPF.update({
        where: { id },
        data: {
          saisie: propre.data as unknown as Prisma.InputJsonValue, resultat: calc.resultat as unknown as Prisma.InputJsonValue,
          parametres: P as unknown as Prisma.InputJsonValue, ...calc.resume, modifiePar: user.userId,
          analyseIa: analyse as unknown as Prisma.InputJsonValue,
        },
      }),
      prisma.auditLog.create({ data: { projectId: e.projectId, utilisateurId: user.userId, action: "SCORING_PF_PROPOSITIONS_IA",
        details: JSON.stringify({ evaluationId: id, acceptees: trace.filter((t) => t.decision === "acceptee").length, rejetees: trace.filter((t) => t.decision === "rejetee").length, decisions: trace }).slice(0, 100_000) } }),
    ]);
    return NextResponse.json({ traitees: trace.length });
  } catch (err) {
    return NextResponse.json({ error: messagePublic(err, "Décisions non enregistrées") }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  return withAuth(req, (r, u) => decider(r, u, id));
}
