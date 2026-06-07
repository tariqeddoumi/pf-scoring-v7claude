import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError, validationError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id }
      });

      if (!workflow) {
        return notFoundError('Workflow');
      }

      const comments = await prisma.scoringComment.findMany({
        where: {
          workflowId: id,
          parentCommentId: null
        },
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
      });

      return successResponse(comments, { count: comments.length, status: 200 });
    } catch (error: any) {
      console.error('[Comments GET]', error);
      return serverError('Erreur lors de la récupération des commentaires');
    }
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { content, commentType, isInternal, parentCommentId } = body;

      if (!content) {
        return validationError([{ field: 'content', message: 'Comment content required' }]);
      }

      const workflow = await prisma.scoringWorkflow.findUnique({
        where: { id }
      });

      if (!workflow) {
        return notFoundError('Workflow');
      }

      const comment = await prisma.scoringComment.create({
        data: {
          workflowId: id,
          content,
          commentType: commentType || 'GENERAL',
          isInternal: isInternal || false,
          createdBy: user.userId,
          parentCommentId: parentCommentId || null,
          createdAt: new Date()
        },
        include: {
          createdByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      return successResponse(comment, { status: 201 });
    } catch (error: any) {
      console.error('[Comments POST]', error);
      return serverError('Erreur lors de la création du commentaire');
    }
  });
}
