import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/admin/configuration
 * Returns all configuration keys grouped by category (admin only)
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const configs = await prisma.appConfiguration.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      const grouped = configs.reduce<Record<string, typeof configs>>((acc, c) => {
        (acc[c.category] ||= []).push(c);
        return acc;
      }, {});

      return NextResponse.json({ success: true, data: { configs, grouped } });
    } catch (error) {
      console.error('[CONFIG LIST]', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }
  });
}
