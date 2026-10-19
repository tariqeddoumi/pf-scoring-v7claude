import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { withAuth, withAdminAuth } from "@/lib/auth-middleware";
import { messagePublic } from "@/lib/erreur-publique";
import { chargerParametres, enregistrerParametres, anomaliesParametres } from "@/lib/modele-pf/serveur";
import { PARAMETRES_DEFAUT } from "@/lib/modele-pf/parametres";

/** GET — paramètres du modèle en vigueur, valeurs candidates d'origine et anomalies éventuelles. */
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const parametres = await chargerParametres();
    return NextResponse.json({ parametres, defaut: PARAMETRES_DEFAUT, anomalies: anomaliesParametres(parametres) });
  });
}

/** PUT — enregistre la surcharge (administrateur du modèle) ; refusée si les poids ne totalisent pas 100 %. */
export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async (r, user) => {
    // Les paramètres valent pour toutes les banques de la plateforme : un administrateur
    // rattaché à une seule banque ne les modifie pas.
    if (!user.perimetre?.tout) {
      return NextResponse.json({ error: "Réservé à un administrateur de toute la plateforme (les paramètres s'appliquent à toutes les banques)" }, { status: 403 });
    }
    try {
      const { parametres, anomalies } = await enregistrerParametres(await r.json(), user.userId);
      if (anomalies.length) return NextResponse.json({ error: "Paramètres incohérents", anomalies }, { status: 422 });
      return NextResponse.json({ parametres, anomalies: [] });
    } catch (e) {
      if (e instanceof ZodError) return NextResponse.json({ error: "Paramètres invalides", erreurs: e.issues.slice(0, 20) }, { status: 400 });
      return NextResponse.json({ error: messagePublic(e, "Enregistrement des paramètres impossible") }, { status: 500 });
    }
  });
}
