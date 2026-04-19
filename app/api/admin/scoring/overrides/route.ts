import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, validationError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const {
        evaluationId,
        nodeId,
        originalValue,
        originalScore,
        overriddenValue,
        overriddenScore,
        reason,
        justification,
        riskLevel
      } = body;

      // Validate required fields
      const errors = [];
      if (!evaluationId) errors.push({ field: 'evaluationId', message: 'Evaluation ID required' });
      if (!nodeId) errors.push({ field: 'nodeId', message: 'Node ID required' });
      if (!reason) errors.push({ field: 'reason', message: 'Reason required' });
      if (!riskLevel) errors.push({ field: 'riskLevel', message: 'Risk level required' });

      if (errors.length > 0) {
        return validationError(errors);
      }

      const override = await prisma.scoringOverride.create({
        data: {
          evaluationId,
          nodeId,
          originalValue: originalValue?.toString(),
          originalScore,
          overriddenValue: overriddenValue?.toString(),
          overriddenScore,
          reason,
          justification,
          riskLevel,
          overriddenBy: user.userId,
          status: 'PENDING'
        },
        include: {
          evaluation: {
            select: { id: true, finalScore: true }
          },
          node: {
            select: { id: true, label: true }
          },
          overriddenByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      return successResponse(override, { status: 201 });
    } catch (error: any) {
      console.error('[Overrides POST]', error);
      if (error.code === 'P2002') {
        return validationError([
          { field: 'nodeId', message: 'Override already exists for this evaluation and node' }
        ]);
      }
      return serverError('Erreur lors de la création de la surcharge');
    }
  });
}
