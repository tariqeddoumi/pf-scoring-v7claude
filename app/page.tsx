import { redirect } from "next/navigation";

/**
 * Accueil : le tableau de bord. L'ancienne page de présentation affichait des
 * statistiques fictives (« 7.8/10 ») qui ne correspondaient à aucun dossier.
 */
export default function Accueil() {
  redirect("/dashboard");
}
