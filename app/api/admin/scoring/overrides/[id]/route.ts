import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, notFoundError } from '@/lib/api-response';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const override = await prisma.scoringOverride.findUnique({
        where: { id },
        include: {
          evaluation: {
            select: { id: true, finalScore: true, project: true }
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
        }
      });

      if (!override) {
        return notFoundError('Override');
      }

      return successResponse(override, { status: 200 });
    } catch (error: any) {
      console.error('[Override GET]', error);
      return serverError('Erreur lors de la récupération de la surcharge');
    }
  });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { status, approvedBy } = body;

      const override = await prisma.scoringOverride.findUnique({
        where: { id }
      });

      if (!override) {
        return notFoundError('Override');
      }

      const updated = await prisma.scoringOverride.update({
        where: { id },
        data: {
          status,
          approvedBy: status === 'APPROVED' ? (approvedBy || user.userId) : undefined,
          approvedAt: status === 'APPROVED' ? new Date() : undefined
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
          },
          approvedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      return successResponse(updated, { status: 200 });
    } catch (error: any) {
      console.error('[Override PATCH]', error);
      return serverError('Erreur lors de la mise à jour de la surcharge');
    }
  });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;

      const override = await prisma.scoringOverride.findUnique({
        where: { id }
      });

      if (!override) {
        return notFoundError('Override');
      }

      await prisma.scoringOverride.delete({
        where: { id }
      });

      return successResponse({ id }, { status: 200 });
    } catch (error: any) {
      console.error('[Override DELETE]', error);
      return serverError('Erreur lors de la suppression de la surcharge');
    }
  });
}
