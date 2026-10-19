import { NextResponse } from "next/server";

/**
 * Route historique de l'ancien moteur de questionnaire, retirée : aucun écran ne l'appelait,
 * sa validation ignorait la délégation par montant et écrasait le grade du projet par
 * celui de l'ancien moteur. Le circuit se fait sur le scoring PF :
 * POST /api/evaluations-pf/[id]/statut.
 */
export function POST() {
  return NextResponse.json(
    { error: "Route retirée : utilisez POST /api/evaluations-pf/[id]/statut (soumettre, valider, rejeter, rouvrir)." },
    { status: 410 }
  );
}
