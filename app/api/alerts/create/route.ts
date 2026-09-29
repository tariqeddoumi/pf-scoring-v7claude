import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";
import { webhookService } from "@/lib/webhook-service";

/**
 * POST /api/alerts/create
 *
 * Émet une notification d'alerte vers les intégrations configurées.
 *
 * La route n'exigeait aucune authentification et relayait tel quel le
 * `manager_email` reçu : n'importe qui pouvait faire envoyer un message, au nom de la
 * banque, à une adresse arbitraire. Elle est désormais réservée aux utilisateurs
 * authentifiés, et le destinataire doit être un utilisateur de l'application —
 * à défaut, la notification part sans adresse plutôt que vers un inconnu.
 */
async function handlePOST(request: NextRequest, user: AuthPayload) {
  try {
    const { type, severity, project_name, manager_email, description } =
      await request.json();

    if (!type || !severity) {
      return NextResponse.json(
        { success: false, error: "Type et gravité requis" },
        { status: 400 }
      );
    }

    let destinataire: string | null = null;
    if (typeof manager_email === "string" && manager_email.trim()) {
      const connu = await prisma.user.findUnique({
        where: { email: manager_email.trim().toLowerCase() },
        select: { email: true },
      });
      destinataire = connu?.email ?? null;
    }

    await webhookService.emit("alert.created", {
      type,
      severity,
      project_name,
      manager_email: destinataire,
      description,
      // L'émetteur est consigné : une notification anonyme n'est pas traçable.
      emitted_by: user.userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: destinataire
        ? "Alerte émise et notification envoyée"
        : "Alerte émise ; aucun destinataire connu, notification sans adresse",
      severity,
    });
  } catch (error) {
    console.error("[ALERTS CREATE]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'émission de l'alerte" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
