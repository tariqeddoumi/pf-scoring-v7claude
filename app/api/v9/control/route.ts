import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/v9/control
 * Verifies V9 data integrity - all counts must match expected values
 */
export async function GET(request: NextRequest) {
  try {
    const checks = {
      sectors: await prisma.v9Sector.count(),
      thresholds: await prisma.v9SectorThreshold.count(),
      domainWeights: await prisma.v9SectorDomainWeight.count(),
      redFlags: await prisma.v9RedFlag.count(),
      indicators: await prisma.v9Indicator.count(),
      stressTests: await prisma.v9StressTest.count(),
      malusBonus: await prisma.v9MalusBonus.count(),
      appConfiguration: await prisma.appConfiguration.count(),
      models: await prisma.v9ScoringModel.count(),
    };

    const expected = {
      sectors: 12,
      thresholds: 144,
      domainWeights: 108,
      redFlags: 96,
      indicators: 72,
      stressTests: 24,
      malusBonus: 10,
      appConfiguration: 9,
      models: 1,
    };

    const ok = Object.entries(expected).every(([key, value]) => {
      return checks[key as keyof typeof checks] === value;
    });

    return NextResponse.json({
      success: ok,
      checks,
      expected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[V9-CONTROL GET]', error);
    return NextResponse.json(
      { error: 'Failed to verify data integrity' },
      { status: 500 }
    );
  }
}
