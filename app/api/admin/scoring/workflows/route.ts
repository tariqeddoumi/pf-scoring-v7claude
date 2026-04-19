import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, forbiddenError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const projectId = searchParams.get('projectId');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const whereClause: any = {};
      if (status) whereClause.status = status;

      const workflows = await prisma.scoringWorkflow.findMany({
        where: whereClause,
        include: {
          evaluation: {
            include: {
              project: true,
              analyst: {
                select: { id: true, email: true, nom: true, prenom: true }
              }
            }
          },
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          decisions: {
            orderBy: { decidedAt: 'desc' },
            take: 1
          },
          approvals: {
            where: { status: 'PENDING' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.scoringWorkflow.count({
        where: whereClause
      });

      return successResponse(workflows, {
        count: workflows.length,
        status: 200
      });
    } catch (error: any) {
      console.error('[Workflows GET]', error);
      return serverError('Erreur lors de la récupération des workflows');
    }
  });
}
