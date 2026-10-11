import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withAuth, hasMinimumRole } from "@/lib/auth-middleware";
import { prismaSysteme as prisma } from "@/lib/prisma-client";
import { fournisseurStockage } from "@/lib/services/ia-documents/stockage";

/**
 * GET /api/admin/base — état de la base de données (administrateur système de toute
 * la plateforme). Lecture seule : changer de base se fait par la variable
 * DATABASE_URL et un redéploiement (npm run db:basculer), jamais depuis l'écran —
 * une adresse de base modifiable en ligne serait une porte ouverte sur les données.
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    if (!hasMinimumRole(user.role, "system_admin") || !user.perimetre?.tout) {
      return NextResponse.json({ success: false, error: "Réservé aux administrateurs de la plateforme" }, { status: 403 });
    }
    const url = process.env.DATABASE_URL ?? "";
    let hote = "(non lisible)";
    let base = "";
    try {
      const u = new URL(url);
      hote = `${u.hostname}${u.port ? ":" + u.port : ""}`;
      base = u.pathname.replace(/^\//, "");
    } catch {
      /* adresse non standard : seul l'état de connexion est affiché */
    }
    const debut = Date.now();
    try {
      const [{ version }] = await prisma.$queryRaw<Array<{ version: string }>>(Prisma.sql`SELECT current_setting('server_version') AS version`);
      const latenceMs = Date.now() - debut;
      const presentes = await prisma.$queryRaw<Array<{ table_name: string }>>(
        Prisma.sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const noms = new Set(presentes.map((t) => t.table_name));
      const attendues = Prisma.dmmf.datamodel.models.map((m) => m.dbName ?? m.name);
      const manquantes = attendues.filter((t) => !noms.has(t));
      const [entites, utilisateurs, clients, projets] = await Promise.all([
        prisma.entite.count(), prisma.user.count(), prisma.client.count(), prisma.project.count(),
      ]);
      return NextResponse.json({
        success: true,
        data: {
          moteur: `PostgreSQL ${version}`,
          hote,
          base,
          latenceMs,
          schema: { attendues: attendues.length, manquantes },
          volumes: { entites, utilisateurs, clients, projets },
          stockagePieces: fournisseurStockage() ?? "non configuré",
        },
      });
    } catch (e) {
      return NextResponse.json(
        { success: false, error: `Base injoignable : ${e instanceof Error ? e.message.split("\n").slice(-1)[0] : "erreur"}` },
        { status: 503 }
      );
    }
  });
}
