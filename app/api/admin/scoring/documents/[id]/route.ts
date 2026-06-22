import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const document = await prisma.scoringDocument.findUnique({
        where: { id },
        include: {
          evaluation: {
            select: { id: true, projectId: true }
          },
          node: {
            select: { id: true, label: true }
          },
          uploadedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          },
          verifiedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      if (!document) {
        return notFoundError('Document');
      }

      return successResponse(document, { status: 200 });
    } catch (error: any) {
      console.error('[Document GET]', error);
      return serverError('Erreur lors de la récupération du document');
    }
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { verifiedBy, description, notes } = body;

      const document = await prisma.scoringDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return notFoundError('Document');
      }

      const updated = await prisma.scoringDocument.update({
        where: { id },
        data: {
          ...(verifiedBy && {
            verifiedBy: user.userId,
            verifiedAt: new Date()
          }),
          ...(description !== undefined && { description }),
          ...(notes !== undefined && { notes })
        },
        include: {
          evaluation: {
            select: { id: true }
          },
          uploadedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          },
          verifiedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      return successResponse(updated, { status: 200 });
    } catch (error: any) {
      console.error('[Document PATCH]', error);
      return serverError('Erreur lors de la mise à jour du document');
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const document = await prisma.scoringDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return notFoundError('Document');
      }

      await prisma.scoringDocument.delete({
        where: { id }
      });

      return successResponse({ id }, { status: 200 });
    } catch (error: any) {
      console.error('[Document DELETE]', error);
      return serverError('Erreur lors de la suppression du document');
    }
  });
}
