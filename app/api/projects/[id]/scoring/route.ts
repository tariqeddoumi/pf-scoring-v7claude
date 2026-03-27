import { NextResponse } from "next/server";
import { calculateScoringResult } from "@/lib/scoring-engine";
import type { ScoreComponent } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json() as {
      composantes: ScoreComponent[];
      version?: number;
    };

    const { composantes, version } = data;

    if (!Array.isArray(composantes) || composantes.length === 0) {
      return NextResponse.json(
        { error: "Composantes invalides" },
        { status: 400 }
      );
    }

    // Valider les composantes
    for (const c of composantes) {
      if (!c.categorie || c.score === undefined || c.ponderation === undefined) {
        return NextResponse.json(
          { error: "Données de composante incomplètes" },
          { status: 400 }
        );
      }
    }

    const result = calculateScoringResult(id, composantes, version || 1);

    // TODO: Sauvegarder dans Prisma
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors du calcul du score" },
      { status: 500 }
    );
  }
}
