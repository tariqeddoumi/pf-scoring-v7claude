import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/v9/sectors
 * Returns all sectors with thresholds, indicators, red flags, and stress tests
 */
async function handleGET(request: NextRequest) {
  try {
    const sectors = await prisma.v9Sector.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        thresholds: {
          orderBy: { level: 'asc' },
        },
        domainWeights: {
          orderBy: { domainCode: 'asc' },
        },
        redFlags: {
          orderBy: { orderIndex: 'asc' },
        },
        indicators: {
          orderBy: { orderIndex: 'asc' },
        },
        stressTests: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sectors,
        count: sectors.length,
      },
    });
  } catch (error) {
    console.error('[V9-SECTORS GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch sectors' },
      { status: 500 }
    );
  }
}

// Paramétrage du modèle : lisible par les utilisateurs connectés seulement.
export async function GET(request: NextRequest) {
  return withAuth(request, (req) => handleGET(req));
}
