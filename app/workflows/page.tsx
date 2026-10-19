import { redirect } from "next/navigation";

/**
 * Les validations se font sur le scoring PF : la liste des dossiers soumis est l'onglet
 * « En attente de validation » de la page Évaluations. L'ancien circuit (moteur générique)
 * n'était alimenté par aucun scoring PF et restait vide.
 */
export default function ValidationsPage() {
  redirect("/evaluations?onglet=aValider");
}
