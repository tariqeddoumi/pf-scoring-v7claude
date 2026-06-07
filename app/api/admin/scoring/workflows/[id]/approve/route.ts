import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError, validationError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const {
        decisionType,
        riskRating,
        justification,
        recommendation,
        hasConditions,
        conditionsJson,
        requiresHigherApproval
      } = body;

      // Validate required fields
      const errors = [];
      if (!decisionType) errors.push({ field: 'decisionType', message: 'Decision type required' });
      if (!riskRating) errors.push({ field: 'riskRating', message: 'Risk rating required' });
      if (!justification) errors.push({ field: 'justification', message: 'Justification required' });

      if (errors.length > 0) {
        return validationError(errors);
      }

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id }
      });

      if (!workflow) {
        return notFoundError('Workflow');
      }

      // Create decision
      const decision = await prisma.scoringDecision.create({
        data: {
          workflowId: id,
          decisionType,
          riskRating,
          justification,
          recommendation,
          hasConditions: hasConditions || false,
          conditionsJson,
          decidedBy: user.userId,
          requiresHigherApproval: requiresHigherApproval || false,
          decidedAt: new Date()
        },
        include: {
          decidedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      // Update workflow status based on decision
      let newStatus = workflow.status;
      if (decisionType === 'APPROVE' || decisionType === 'APPROVE_WITH_CONDITIONS') {
        newStatus = 'APPROVED';
      } else if (decisionType === 'REJECT') {
        newStatus = 'REJECTED';
      }

      await prisma.scoringWorkflow.update({
        where: { id },
        data: {
          status: newStatus,
          approvedAt: newStatus === 'APPROVED' ? new Date() : undefined,
          approvedBy: newStatus === 'APPROVED' ? user.userId : undefined,
          rejectedAt: newStatus === 'REJECTED' ? new Date() : undefined,
          rejectedBy: newStatus === 'REJECTED' ? user.userId : undefined
        }
      });

      return successResponse(decision, { status: 201 });
    } catch (error: any) {
      console.error('[Workflow Approve]', error);
      return serverError('Erreur lors de la création de la décision');
    }
  });
}
