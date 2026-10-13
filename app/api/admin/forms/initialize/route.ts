import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { initializeFieldConfigurationsFromCode } from "@/lib/services/field-config-service";
import { messagePublic } from "@/lib/erreur-publique";

export async function POST(request: NextRequest) {
  // withAuth passe (requête, utilisateur) : le rôle était lu sur la requête et la
  // route refusait tout le monde.
  return withAuth(request, async (_req, user) => {
    try {
      if (user.role !== "system_admin") {
        return NextResponse.json(
          { success: false, error: "Réservé à l'administrateur système" },
          { status: 403 }
        );
      }

      await initializeFieldConfigurationsFromCode();

      return NextResponse.json({
        success: true,
        message: "Field configurations initialized successfully",
      });
    } catch (error) {
      console.error("[FORMS INITIALIZE]", error);
      return NextResponse.json(
        {
          success: false,
          error: messagePublic(error, "Initialization failed"),
        },
        { status: 500 }
      );
    }
  });
}
