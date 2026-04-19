/**
 * Model Configuration API Route
 *
 * GET /api/admin/scoring/model-config?versionId=xxx
 *   - Fetch current model configuration
 *
 * PUT /api/admin/scoring/model-config?versionId=xxx
 *   - Update model configuration
 *   - Body: { aggregationMethod, weightMode, scoreScale }
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { successResponse, serverError, errorResponse, validationError } from '@/lib/api-response';
import prisma from '@/lib/prisma-client';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const versionId = searchParams.get('versionId');

      if (!versionId) {
        return validationError([{ field: 'versionId', message: 'Requis' }]);
      }

      // Get model version to check it exists
      const version = await prisma.scoringModelVersion.findUnique({
        where: { id: versionId },
        select: { id: true, aggregationMethod: true, weightMode: true, scoreScale: true },
      });

      if (!version) {
        return errorResponse('Version du modèle non trouvée', { status: 404, errorCode: 'VERSION_NOT_FOUND' });
      }

      return successResponse({
        aggregationMethod: version.aggregationMethod || 'WEIGHTED_AVERAGE',
        weightMode: version.weightMode || 'RELATIVE',
        scoreScale: version.scoreScale || '0_100',
      });
    } catch (error: any) {
      console.error('[ADMIN/SCORING/MODEL_CONFIG] GET error:', error);
      return serverError('Erreur lors de la récupération de la configuration');
    }
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    try {
      const { searchParams } = new URL(req.url);
      const versionId = searchParams.get('versionId');

      if (!versionId) {
        return validationError([{ field: 'versionId', message: 'Requis' }]);
      }

      const body = await req.json();
      const { aggregationMethod, weightMode, scoreScale } = body;

      // Validate that all required fields are present
      if (!aggregationMethod || !weightMode || !scoreScale) {
        return validationError([
          { field: 'aggregationMethod', message: 'Requis' },
          { field: 'weightMode', message: 'Requis' },
          { field: 'scoreScale', message: 'Requis' },
        ]);
      }

      // Update the model version
      const updated = await prisma.scoringModelVersion.update({
        where: { id: versionId },
        data: {
          aggregationMethod,
          weightMode,
          scoreScale,
        },
      });

      return successResponse({
        id: updated.id,
        aggregationMethod: updated.aggregationMethod,
        weightMode: updated.weightMode,
        scoreScale: updated.scoreScale,
      });
    } catch (error: any) {
      console.error('[ADMIN/SCORING/MODEL_CONFIG] PUT error:', error);
      return serverError('Erreur lors de la mise à jour de la configuration');
    }
  });
}
