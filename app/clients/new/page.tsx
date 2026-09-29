"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import {
  ClientForm,
  VALEURS_CLIENT_VIDES,
  versPayloadClient,
  type ValeursClient,
} from "@/components/client/ClientForm";

/**
 * Création d'une contrepartie.
 *
 * Le formulaire répartissait vingt-sept champs en six onglets, sans marquer le seul
 * champ obligatoire ni dire lesquels étaient perdus — et la route n'en enregistrait
 * que onze. Les deux bouts sont désormais alignés sur le même schéma Zod.
 */
export default function NouveauClientPage() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const creer = async (valeurs: ValeursClient) => {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await apiPost("/api/clients", versPayloadClient(valeurs));
      const corps = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details: string | undefined = corps.errors
          ?.map((e: { field: string; message: string }) => `${e.field} : ${e.message}`)
          .join(" — ");
        throw new Error(details || corps.error || "Création du client impossible.");
      }
      // Un client se crée pour porter un projet : on l'ouvre sur sa fiche, d'où
      // l'action « Nouveau projet » est à un clic.
      router.push(`/clients/${corps.data.id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
      setEnCours(false);
    }
  };

  return (
    <div>
      <PageHeader
        titre="Nouveau client"
        description="Le nom suffit pour créer la fiche ; le reste peut être complété ensuite."
        retour={{ href: "/clients", libelle: "Clients" }}
      />
      <ClientForm
        valeursInitiales={VALEURS_CLIENT_VIDES}
        libelleAction="Créer le client"
        enCours={enCours}
        onSubmit={creer}
        hrefAnnuler="/clients"
        erreurGlobale={erreur}
      />
    </div>
  );
}
