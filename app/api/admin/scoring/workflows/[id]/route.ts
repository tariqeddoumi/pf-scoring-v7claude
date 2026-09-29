import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, withMinimumRole } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Même ouverture en lecture que la liste : instruire un dossier suppose de le lire.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withMinimumRole('risk_analyst', request, async () => {
    try {
      const { id } = await params;

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id },
        include: {
          evaluation: {
            include: {
              project: true,
              analyst: {
                select: { id: true, email: true, nom: true, prenom: true }
              },
              answers: true,
              nodeResults: true
            }
          },
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          decisions: {
            include: {
              decidedByUser: {
                select: { id: true, email: true, nom: true, prenom: true }
              }
            },
            orderBy: { decidedAt: 'desc' }
          },
          approvals: {
            include: {
              approvedByUser: {
                select: { id: true, email: true, nom: true, prenom: true }
              }
            }
          },
          // Seules les racines : les réponses sont déjà incluses sous leur parent,
          // et les renvoyer aussi au premier niveau les affichait en double.
          comments: {
            where: { parentCommentId: null },
            include: {
              createdByUser: {
                select: { id: true, email: true, nom: true, prenom: true }
              },
              replies: {
                include: {
                  createdByUser: {
                    select: { id: true, email: true, nom: true, prenom: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!workflow) {
        return notFoundError('Workflow');
      }

      return successResponse(workflow, { status: 200 });
    } catch (error: any) {
      console.error('[Workflow GET]', error);
      return serverError('Erreur lors de la récupération du workflow');
    }
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { status, currentStep, escalationReason } = body;

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id }
      });

      if (!workflow) {
        return notFoundError('Workflow');
      }

      const updated = await prisma.scoringWorkflow.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(currentStep !== undefined && { currentStep }),
          ...(escalationReason && { escalationReason })
        },
        include: {
          evaluation: true,
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          decisions: {
            orderBy: { decidedAt: 'desc' },
            take: 1
          }
        }
      });

      return successResponse(updated, { status: 200 });
    } catch (error: any) {
      console.error('[Workflow PATCH]', error);
      return serverError('Erreur lors de la mise à jour du workflow');
    }
  });
}
