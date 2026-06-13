import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/v9/scoring-model
 * Returns active V9 scoring model with socle structure
 */
export async function GET(request: NextRequest) {
  try {
    const model = await prisma.v9ScoringModel.findFirst({
      where: { isActive: true },
    });

    if (!model) {
      return NextResponse.json(
        { error: 'No active V9 model found' },
        { status: 404 }
      );
    }

    // Get sector count for quick summary
    const sectorCount = await prisma.v9Sector.count();
    const thresholdCount = await prisma.v9SectorThreshold.count();
    const redFlagCount = await prisma.v9RedFlag.count();
    const indicatorCount = await prisma.v9Indicator.count();
    const stressTestCount = await prisma.v9StressTest.count();

    return NextResponse.json({
      success: true,
      data: {
        model,
        statistics: {
          sectors: sectorCount,
          thresholds: thresholdCount,
          redFlags: redFlagCount,
          indicators: indicatorCount,
          stressTests: stressTestCount,
        },
      },
    });
  } catch (error) {
    console.error('[V9-MODEL GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch scoring model' },
      { status: 500 }
    );
  }
}
