"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import {
  ProjectForm,
  VALEURS_PROJET_VIDES,
  versPayloadProjet,
  type ValeursProjet,
} from "@/components/project/ProjectForm";

/**
 * Création d'un dossier projet.
 *
 * Le formulaire répartissait une trentaine de champs en sept onglets, omettait le
 * client — le projet créé n'apparaissait alors sur aucune fiche — et laissait choisir
 * le statut, jusqu'à « Approuvé », avant toute évaluation. Un projet naît désormais
 * brouillon, et l'écran renvoie sur sa fiche plutôt que sur la liste.
 */
function NouveauProjet() {
  const router = useRouter();
  const params = useSearchParams();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // La fiche client propose « Nouveau projet » : la contrepartie est déjà connue.
  const clientId = params.get("clientId") ?? "";

  const creer = async (valeurs: ValeursProjet) => {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await apiPost("/api/projects", {
        ...versPayloadProjet(valeurs),
        // Un dossier naît toujours brouillon : le statut suit l'évaluation et le
        // comité, il ne se choisit pas à la saisie.
        status: "brouillon",
      });
      const corps = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          corps.errors?.map((e: { message: string }) => e.message).join(" — ") ||
            corps.error ||
            "Création du projet impossible."
        );
      }
      const projet = corps.data ?? corps;
      router.push(`/projects/${projet.id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
      setEnCours(false);
    }
  };

  return (
    <div>
      <PageHeader
        titre="Nouveau projet"
        description="Le dossier est créé en brouillon ; l'évaluation se lance depuis sa fiche."
        retour={{ href: "/projects", libelle: "Projets" }}
      />
      <ProjectForm
        valeursInitiales={{ ...VALEURS_PROJET_VIDES, clientId }}
        libelleAction="Créer le projet"
        enCours={enCours}
        onSubmit={creer}
        hrefAnnuler="/projects"
        erreurGlobale={erreur}
        creation
      />
    </div>
  );
}

export default function NouveauProjetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[55vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={30} />
        </div>
      }
    >
      <NouveauProjet />
    </Suspense>
  );
}
