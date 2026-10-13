import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

/**
 * GET /api/groupes-affaires?search= — groupes d'affaires du périmètre, pour le choix
 * du groupe dans la fiche client (nombre de sociétés et exposition consolidée).
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const search = (new URL(req.url).searchParams.get("search") ?? "")
        .trim()
        .slice(0, 100);
      const groupes = await prisma.groupeAffaires.findMany({
        where: search
          ? {
              OR: [
                { nom: { contains: search, mode: "insensitive" } },
                { code: { equals: search, mode: "insensitive" } },
              ],
            }
          : {},
        select: { id: true, code: true, nom: true, ratingGroupe: true },
        orderBy: { nom: "asc" },
        take: 50,
      });
      // Agrégats lus sur les clients (requête cloisonnée) plutôt que par une relation imbriquée.
      const totaux = groupes.length
        ? await prisma.client.groupBy({
            by: ["groupeAffairesId"],
            where: { groupeAffairesId: { in: groupes.map((g) => g.id) } },
            _count: { _all: true },
            _sum: { exposition: true },
          })
        : [];
      const parGroupe = new Map(totaux.map((t) => [t.groupeAffairesId, t]));
      return NextResponse.json({
        success: true,
        data: groupes.map((g) => ({
          ...g,
          nbClients: parGroupe.get(g.id)?._count._all ?? 0,
          expositionConsolidee: parGroupe.get(g.id)?._sum.exposition ?? null,
        })),
      });
    } catch (error) {
      console.error("[Groupes d'affaires GET]", error);
      return NextResponse.json(
        { success: false, error: "Erreur serveur" },
        { status: 500 }
      );
    }
  });
}
