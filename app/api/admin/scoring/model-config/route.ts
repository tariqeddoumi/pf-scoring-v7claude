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

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing versionId parameter',
        errorCode: 'MISSING_VERSION_ID',
      }, { status: 400 });
    }

    // Get model version to check it exists
    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
      select: { id: true, aggregationMethod: true, weightMode: true, scoreScale: true },
    });

    if (!version) {
      return NextResponse.json({
        success: false,
        error: 'Model version not found',
        errorCode: 'VERSION_NOT_FOUND',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        aggregationMethod: version.aggregationMethod || 'WEIGHTED_AVERAGE',
        weightMode: version.weightMode || 'RELATIVE',
        scoreScale: version.scoreScale || '0_100',
      },
    });
  } catch (error) {
    console.error('Model config GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch configuration',
      errorCode: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get('versionId');

    if (!versionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing versionId parameter',
        errorCode: 'MISSING_VERSION_ID',
      }, { status: 400 });
    }

    const body = await req.json();
    const { aggregationMethod, weightMode, scoreScale } = body;

    // Validate that all required fields are present
    if (!aggregationMethod || !weightMode || !scoreScale) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: aggregationMethod, weightMode, scoreScale',
        errorCode: 'MISSING_FIELDS',
      }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        aggregationMethod: updated.aggregationMethod,
        weightMode: updated.weightMode,
        scoreScale: updated.scoreScale,
      },
    });
  } catch (error) {
    console.error('Model config PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update configuration',
      errorCode: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}
