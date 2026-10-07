import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, validationError } from '@/lib/api-response';
import prisma from '@/lib/prisma-client';

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const evaluationId = searchParams.get('evaluationId');
      const status = searchParams.get('status');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const whereClause: any = {};
      if (evaluationId) whereClause.evaluationId = evaluationId;
      if (status) whereClause.status = status;

      const overrides = await prisma.scoringOverride.findMany({
        where: whereClause,
        include: {
          evaluation: {
            select: { id: true, finalScore: true }
          },
          node: {
            select: { id: true, label: true, code: true }
          },
          overriddenByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          },
          approvedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        },
        orderBy: { overriddenAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.scoringOverride.count({
        where: whereClause
      });

      return successResponse(overrides, { count: overrides.length, status: 200 });
    } catch (error: any) {
      console.error('[Overrides GET]', error);
      return serverError('Erreur lors de la récupération des surcharges');
    }
  });
}

/**
 * POST — proposition de dérogation.
 *
 * La note d'origine était fournie par le client et rien ne liait la proposition à la
 * grille du dossier. Désormais : justification et note proposée (0 à 100) exigées,
 * critère de la version du dossier, dossier au brouillon, note d'origine relue dans
 * le dernier calcul. Une proposition reste sans effet tant qu'un tiers ne l'a pas
 * approuvée.
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const { evaluationId, nodeId, overriddenValue, overriddenScore, reason, justification, riskLevel } = body;

      const errors = [];
      if (!evaluationId) errors.push({ field: 'evaluationId', message: 'Évaluation requise' });
      if (!nodeId) errors.push({ field: 'nodeId', message: 'Critère requis' });
      if (!reason) errors.push({ field: 'reason', message: 'Motif requis' });
      if (!justification || String(justification).trim().length < 10) {
        errors.push({ field: 'justification', message: 'Justification détaillée requise (10 caractères au moins)' });
      }
      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(riskLevel)) {
        errors.push({ field: 'riskLevel', message: 'Niveau de risque requis : LOW, MEDIUM, HIGH ou CRITICAL' });
      }
      if (typeof overriddenScore !== 'number' || !(overriddenScore >= 0 && overriddenScore <= 100)) {
        errors.push({ field: 'overriddenScore', message: 'Note proposée requise, entre 0 et 100' });
      }
      if (errors.length > 0) {
        return validationError(errors);
      }

      const evaluation = await prisma.scoringEvaluation.findUnique({
        where: { id: evaluationId },
        select: { status: true, modelVersionId: true },
      });
      const node = await prisma.scoringNode.findUnique({ where: { id: nodeId }, select: { versionId: true } });
      if (!evaluation || !node || node.versionId !== evaluation.modelVersionId) {
        return validationError([{ field: 'nodeId', message: "Ce critère n'appartient pas à la grille du dossier" }]);
      }
      if (String(evaluation.status) !== 'brouillon') {
        return NextResponse.json(
          { success: false, error: 'Une dérogation se propose sur un dossier en saisie.', errorCode: 'INVALID_STATE' },
          { status: 409 }
        );
      }
      const resultat = await prisma.scoringEvaluationNodeResult.findFirst({
        where: { evaluationId, nodeId },
        select: { rawScore: true },
      });
      const reponse = await prisma.scoringEvaluationAnswer.findFirst({
        where: { evaluationId, nodeId },
        select: { valueString: true, valueNumber: true, valueBoolean: true },
      });

      const override = await prisma.scoringOverride.create({
        data: {
          evaluationId,
          nodeId,
          originalValue:
            reponse?.valueString ?? (reponse?.valueNumber ?? reponse?.valueBoolean)?.toString() ?? null,
          originalScore: resultat?.rawScore ?? null,
          overriddenValue: overriddenValue?.toString(),
          overriddenScore,
          reason,
          justification,
          riskLevel,
          overriddenBy: user.userId,
          status: 'PENDING'
        },
        include: {
          evaluation: { select: { id: true, finalScore: true } },
          node: { select: { id: true, label: true } },
          overriddenByUser: { select: { id: true, email: true, nom: true, prenom: true } }
        }
      });

      return successResponse(override, { status: 201 });
    } catch (error: any) {
      console.error('[Overrides POST]', error);
      if (error.code === 'P2002') {
        return validationError([
          { field: 'nodeId', message: 'Une dérogation existe déjà pour ce critère' }
        ]);
      }
      return serverError('Erreur lors de la création de la surcharge');
    }
  });
}
