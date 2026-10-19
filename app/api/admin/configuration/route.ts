import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';
import { CATALOGUE_CONFIG } from '@/lib/config-catalogue';

/**
 * GET /api/admin/configuration
 * Returns all configuration keys grouped by category (admin only)
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const enBase = await prisma.appConfiguration.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });
      // Les clés connues absentes de la base s'affichent quand même (valeur par défaut) :
      // elles sont créées au premier enregistrement.
      const presentes = new Set(enBase.map((c) => c.key));
      const manquantes = CATALOGUE_CONFIG.filter((c) => !presentes.has(c.key)).map((c) => ({
        ...c, metadata: c.metadata ?? null, updatedAt: null, updatedBy: null,
      }));
      const configs = [...manquantes, ...enBase] as typeof enBase;

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
