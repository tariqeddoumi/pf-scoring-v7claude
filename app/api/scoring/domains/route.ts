import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/scoring/domains
 * Get all domains (root nodes at depth 0) from the latest published scoring model
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // Get latest published model version
      const latestVersion = await prisma.scoringModelVersion.findFirst({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!latestVersion) {
        return NextResponse.json(
          { error: 'No published scoring model found' },
          { status: 404 }
        );
      }

      // Get all domain nodes (depth 0, no parent)
      const domains = await prisma.scoringNode.findMany({
        where: {
          versionId: latestVersion.id,
          depth: 0,
          parentNodeId: null,
        },
        select: {
          id: true,
          code: true,
          label: true,
          depth: true,
        },
        orderBy: { orderIndex: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: domains,
      });
    } catch (error) {
      console.error('[DOMAINS GET]', error);
      return NextResponse.json(
        { error: 'Failed to fetch domains' },
        { status: 500 }
      );
    }
  });
}
