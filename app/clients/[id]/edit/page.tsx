"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import {
  ClientForm,
  versValeursClient,
  type ValeursClient,
} from "@/components/client/ClientForm";

/**
 * Modification d'une contrepartie.
 *
 * Lorsque le chargement échouait, l'écran affichait tout de même le formulaire rempli
 * de valeurs par défaut : un enregistrement écrasait alors la fiche avec des champs
 * vides. Le formulaire n'est plus rendu tant que la fiche n'est pas chargée, et seuls
 * les champs réellement modifiés sont envoyés.
 */
export default function ModifierClientPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? "");
  const [valeurs, setValeurs] = useState<ValeursClient | null>(null);
  const [nom, setNom] = useState("");
  const [modifieLe, setModifieLe] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = async () => {
    setChargement(true);
    setErreurChargement(null);
    try {
      const res = await apiGet(`/api/clients/${id}`);
      if (!res.ok) throw new Error("Cette fiche client n'a pas pu être chargée.");
      const client = (await res.json()).data;
      setValeurs(versValeursClient(client));
      setNom(client.nom ?? "");
      setModifieLe(client.updatedAt ?? null);
    } catch (e) {
      setErreurChargement(
        e instanceof Error ? e.message : "Chargement de la fiche impossible."
      );
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
    _valeurs: ValeursClient,
    modifies: Partial<ValeursClient>
  ) => {
    setEnCours(true);
    setErreur(null);
    try {
      // Seuls les champs modifiés partent : un PUT complet réécrivait des champs
      // que l'utilisateur n'avait pas touchés, et vidait l'email sur une chaîne vide.
      const charge: Record<string, unknown> = {};
      for (const [cle, valeur] of Object.entries(modifies) as [string, string][]) {
        const vide = valeur.trim() === "";
        charge[cle] = ["effectifs", "capitalSocial", "chiffreAffaires", "exposition"].includes(
          cle
        )
          ? vide
            ? null
            : Number(valeur)
          : vide
            ? null
            : valeur.trim();
      }
      const res = await apiPut(`/api/clients/${id}`, charge);
      const corps = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details: string | undefined = corps.errors
          ?.map((e: { field: string; message: string }) => `${e.field} : ${e.message}`)
          .join(" — ");
        throw new Error(details || corps.error || "Enregistrement impossible.");
      }
      router.push(`/clients/${id}`);
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

  if (erreurChargement || !valeurs) {
    return (
      <div>
        <PageHeader titre="Modifier le client" retour={{ href: "/clients", libelle: "Clients" }} />
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
            href={`/clients/${id}`}
            className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à la fiche
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titre={`Modifier — ${nom}`}
        description={
          modifieLe ? `Dernière modification le ${formatDateTime(modifieLe)}` : undefined
        }
        retour={{ href: `/clients/${id}`, libelle: "Fiche client" }}
      />
      <ClientForm
        valeursInitiales={valeurs}
        libelleAction="Enregistrer"
        enCours={enCours}
        onSubmit={enregistrer}
        hrefAnnuler={`/clients/${id}`}
        erreurGlobale={erreur}
        clientId={id}
      />
    </div>
  );
}
