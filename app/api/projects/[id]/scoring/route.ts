import { NextResponse } from "next/server";
import {
  calculateGlobalScoreV2,
  isCountryRiskActive,
  getCountryRiskMode,
  getCountryRiskScore,
  convertCountryRiskToScore,
} from "@/lib/scoring-engine-v2";

import prisma from "@/lib/prisma-client";

interface ComposanteScore {
  domainCode: string;
  score: number;
  weight: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = (await request.json()) as {
      composantes: ComposanteScore[];
      countryCode?: string;
    };

    const { composantes, countryCode } = data;

    if (!Array.isArray(composantes) || composantes.length === 0) {
      return NextResponse.json(
        { error: "Composantes invalides" },
        { status: 400 }
      );
    }

    // Valider les composantes
    for (const c of composantes) {
      if (!c.domainCode || c.score === undefined) {
        return NextResponse.json(
          { error: "Données de composante incomplètes" },
          { status: 400 }
        );
      }
    }

    // Vérifier si risque pays est actif et ajouter le score auto-assigné
    const countryRiskActive = await isCountryRiskActive();
    let updatedComposantes = [...composantes];

    if (countryRiskActive && countryCode) {
      const countryRiskMode = await getCountryRiskMode();

      if (countryRiskMode === "AUTO_ASSIGN") {
        const countryRiskScore = await getCountryRiskScore(countryCode);
        const evaluationScore = convertCountryRiskToScore(countryRiskScore);

        // Ajouter ou remplacer le score du risque pays
        updatedComposantes = updatedComposantes.filter(
          (c) => c.domainCode !== "pays"
        );
        updatedComposantes.push({
          domainCode: "pays",
          score: evaluationScore,
          weight: 0.07, // Poids par défaut, sera remplacé par la BD
        });
      }
    }

    // Calculer le score global avec le moteur v2
    const result = await calculateGlobalScoreV2(updatedComposantes);

    // Sauvegarder le score dans la base de données
    const scoring = await prisma.scoring.create({
      data: {
        projectId: id,
        scoreGlobal: result.scoreGlobal,
        grade: result.grade,
        composantes: JSON.parse(JSON.stringify(result.composantes)),
        version: 2,
      },
    });

    // Sauvegarder les scores par domaine
    for (const [domainCode, details] of Object.entries(result.details)) {
      const domain = await prisma.scoreDomain.findUnique({
        where: { code: domainCode },
      });

      if (domain) {
        await prisma.evaluationDomainScore.create({
          data: {
            domainId: domain.id,
            scoringId: scoring.id,
            score: details.score,
            weight: details.weight,
          },
        });
      }
    }

    // Sauvegarder les réponses d'évaluation
    for (const composante of updatedComposantes) {
      const domain = await prisma.scoreDomain.findUnique({
        where: { code: composante.domainCode },
      });

      if (!domain) continue;

      const criteria = await prisma.scoreCriterion.findFirst({
        where: { domainId: domain.id },
      });

      if (criteria) {
        await prisma.evaluationAnswer.create({
          data: {
            criterionId: criteria.id,
            scoringId: scoring.id,
            answerType: "SCORE",
            rangeValue: composante.score,
            score: composante.score,
          },
        });
      }
    }

    // Mettre à jour le projet avec le score global
    await prisma.project.update({
      where: { id },
      data: {
        scoreGlobal: result.scoreGlobal,
        grade: result.grade,
      },
    });

    return NextResponse.json({
      scoringId: scoring.id,
      ...result,
    });
  } catch (error) {
    console.error("Erreur scoring:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul du score" },
      { status: 500 }
    );
  }
}
