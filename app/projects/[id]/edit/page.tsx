"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Note, StatutProjet } from "@/components/ui/status-badge";
import {
  ProjectForm,
  versValeursProjet,
  versPayloadProjet,
  type ValeursProjet,
} from "@/components/project/ProjectForm";

interface Projet {
  id: string;
  nom: string;
  status: string;
  grade?: string | null;
  scoreGlobal?: number | null;
  dateMiseAJour?: string | null;
  user?: { nom?: string | null; prenom?: string | null } | null;
}

/**
 * Modification d'un dossier projet.
 *
 * Le formulaire renvoyait l'intégralité de l'objet chargé : la note et le score
 * calculés entre-temps par une évaluation étaient réécrits avec les valeurs d'avant,
 * et le statut pouvait passer à « Approuvé » hors de tout comité. Les dates, reçues
 * au format ISO, s'affichaient vides : on les croyait absentes. Si le chargement
 * échouait, le formulaire restait affiché et pouvait être enregistré à vide.
 */
export default function ModifierProjetPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");
  const [valeurs, setValeurs] = useState<ValeursProjet | null>(null);
  const [projet, setProjet] = useState<Projet | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = async () => {
    setChargement(true);
    setErreurChargement(null);
    try {
      const res = await apiGet(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Ce projet n'a pas pu être chargé.");
      const corps = await res.json();
      // La route renvoie le projet à plat ; d'autres routes l'enveloppent dans data.
      const p = corps.data ?? corps;
      setProjet(p);
      setValeurs(versValeursProjet(p));
    } catch (e) {
      setErreurChargement(e instanceof Error ? e.message : "Chargement impossible.");
      setValeurs(null);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (id) charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const enregistrer = async (
    _valeurs: ValeursProjet,
    modifies: Partial<ValeursProjet>
  ) => {
    setEnCours(true);
    setErreur(null);
    try {
      // Seuls les champs modifiés partent, et jamais le score, la note ni le statut :
      // ils appartiennent à l'évaluation et au workflow, pas à la saisie.
      const res = await apiPut(`/api/projects/${id}`, versPayloadProjet(modifies));
      const corps = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? "Vous n'êtes pas autorisé à modifier ce projet."
            : corps.error || "Enregistrement impossible."
        );
      }
      router.push(`/projects/${id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      setEnCours(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (erreurChargement || !valeurs || !projet) {
    return (
      <div>
        <PageHeader titre="Modifier le projet" retour={{ href: "/projects", libelle: "Projets" }} />
        <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreurChargement}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={charger}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Réessayer
          </button>
          <Link
            href={`/projects/${id}`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour au projet
          </Link>
        </div>
      </div>
    );
  }

  const evalue = projet.status !== "brouillon" && projet.scoreGlobal != null;

  return (
    <div>
      <PageHeader
        titre={`Modifier — ${projet.nom}`}
        description={
          projet.dateMiseAJour
            ? `Dernière modification le ${formatDateTime(projet.dateMiseAJour)}${
                projet.user ? ` par ${projet.user.prenom} ${projet.user.nom}` : ""
              }`
            : undefined
        }
        retour={{ href: `/projects/${id}`, libelle: "Fiche projet" }}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <StatutProjet statut={projet.status} />
            <Note note={projet.grade} score={projet.scoreGlobal} />
          </div>
        }
      />

      <ProjectForm
        valeursInitiales={valeurs}
        libelleAction="Enregistrer"
        enCours={enCours}
        onSubmit={enregistrer}
        hrefAnnuler={`/projects/${id}`}
        erreurGlobale={erreur}
        rappel={
          evalue ? (
            <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
              Ce dossier porte déjà une note. Modifier le montant, la structure de
              financement ou le calendrier peut exiger une réévaluation.
            </div>
          ) : null
        }
      />
    </div>
  );
}
