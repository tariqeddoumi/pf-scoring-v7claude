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
      const documentType = searchParams.get('documentType');
      const limit = parseInt(searchParams.get('limit') || '50');
      const offset = parseInt(searchParams.get('offset') || '0');

      const whereClause: any = {};
      if (evaluationId) whereClause.evaluationId = evaluationId;
      if (documentType) whereClause.documentType = documentType;

      const documents = await prisma.scoringDocument.findMany({
        where: whereClause,
        include: {
          evaluation: {
            select: { id: true }
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
        },
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.scoringDocument.count({
        where: whereClause
      });

      return successResponse(documents, { count: documents.length, status: 200 });
    } catch (error: any) {
      console.error('[Documents GET]', error);
      return serverError('Erreur lors de la récupération des documents');
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const body = await request.json();
      const {
        evaluationId,
        fileName,
        fileSize,
        fileType,
        storagePath,
        documentType,
        nodeId,
        isRequired,
        description,
        notes
      } = body;

      // Validate required fields
      const errors = [];
      if (!evaluationId) errors.push({ field: 'evaluationId', message: 'Evaluation ID required' });
      if (!fileName) errors.push({ field: 'fileName', message: 'File name required' });
      if (!storagePath) errors.push({ field: 'storagePath', message: 'Storage path required' });
      if (!documentType) errors.push({ field: 'documentType', message: 'Document type required' });

      if (errors.length > 0) {
        return validationError(errors);
      }

      const document = await prisma.scoringDocument.create({
        data: {
          evaluationId,
          fileName,
          fileSize: fileSize || 0,
          fileType,
          storagePath,
          documentType,
          nodeId: nodeId || null,
          isRequired: isRequired || false,
          description,
          notes,
          uploadedBy: user.userId,
          uploadedAt: new Date()
        },
        include: {
          evaluation: {
            select: { id: true }
          },
          uploadedByUser: {
            select: { id: true, email: true, nom: true, prenom: true }
          }
        }
      });

      return successResponse(document, { status: 201 });
    } catch (error: any) {
      console.error('[Documents POST]', error);
      return serverError('Erreur lors de la création du document');
    }
  });
}
