import prisma from "@/lib/prisma-client";

/**
 * Ouvre (ou rouvre) le circuit de validation d'une évaluation soumise.
 *
 * Aucune route de soumission ne créait de circuit : seul un script de migration en
 * avait produit pour les dossiers anciens. Une évaluation soumise n'apparaissait donc
 * pas dans l'écran « Validations » et ne pouvait recevoir aucune décision. Le circuit
 * porte l'auteur de la soumission, que les contrôles de décision excluent.
 */
export function ouvrirCircuit(evaluationId: string, soumisPar: string) {
  const maintenant = new Date();
  return prisma.scoringWorkflow.upsert({
    where: { evaluationId },
    create: {
      evaluationId,
      status: "SUBMITTED",
      currentStep: 1,
      requestedAt: maintenant,
      submittedAt: maintenant,
      submittedBy: soumisPar,
    },
    update: {
      status: "SUBMITTED",
      currentStep: 1,
      submittedAt: maintenant,
      submittedBy: soumisPar,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
    },
  });
}
