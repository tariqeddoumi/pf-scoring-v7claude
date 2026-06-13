import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/v9/configuration
 * Returns public app configuration for UI initialization
 * Cached: 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const config = await prisma.appConfiguration.findMany({
      where: { isPublic: true },
    });

    const configMap = Object.fromEntries(
      config.map((c) => [c.key, c.value])
    );

    return NextResponse.json(
      { success: true, data: configMap },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      }
    );
  } catch (error) {
    console.error('[V9-CONFIG GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}
