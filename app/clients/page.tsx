"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus, Search, Trash2, Users, X } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api-client";
import { formatMADCompact } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import { usePermission } from "@/lib/hooks/usePermission";
import { ratingBadgeClass } from "@/lib/score-colors";
// Les valeurs qui appellent une action viennent du référentiel, comme les listes de
// saisie : la liste et le formulaire ne peuvent plus diverger.
import { KYC_A_TRAITER, CONFORMITE_A_TRAITER } from "@/lib/referentiels";

interface Client {
  id: string;
  nom: string;
  raisonSociale?: string | null;
  secteur?: string | null;
  ville?: string | null;
  segmentClientele?: string | null;
  ratingInterne?: string | null;
  statutBancaire?: string | null;
  statusKYC?: string | null;
  statusConformite?: string | null;
  exposition?: number | null;
  gestionnaire?: string | null;
  status?: string | null;
  projects?: { id: string }[];
}


/**
 * Liste des clients.
 *
 * Elle affichait Email, Pays, Type et Statut — quatre colonnes identiques d'une ligne
 * à l'autre dans un portefeuille marocain — et taisait ce qui décide : la notation
 * interne, l'exposition, l'état du KYC et de la conformité, pourtant tous renvoyés
 * par l'API. Elle était en outre tronquée aux dix premiers clients, la route
 * appliquant take=10 par défaut et l'écran n'envoyant aucun paramètre : au-delà, les
 * clients étaient simplement invisibles, sans pagination ni message.
 */
export default function ClientsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [clients, setClients] = useState<Client[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "aTraiter">("tous");
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const res = await apiGet("/api/clients?take=500");
      if (!res.ok) throw new Error("Chargement des clients impossible.");
      setClients((await res.json()).data ?? []);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      setClients([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const supprimer = async (id: string) => {
    try {
      setSuppression(true);
      const res = await apiDelete(`/api/clients/${id}`);
      if (!res.ok) throw new Error("Suppression impossible.");
      setClients((c) => c.filter((x) => x.id !== id));
      setASupprimer(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSuppression(false);
    }
  };

  const aTraiter = useCallback(
    (c: Client) =>
      KYC_A_TRAITER.includes(c.statusKYC ?? "") ||
      CONFORMITE_A_TRAITER.includes(c.statusConformite ?? ""),
    []
  );

  const nbATraiter = useMemo(
    () => clients.filter(aTraiter).length,
    [clients, aTraiter]
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return clients.filter((c) => {
      const texte =
        `${c.nom} ${c.raisonSociale ?? ""} ${c.secteur ?? ""} ${c.gestionnaire ?? ""}`.toLowerCase();
      return (!q || texte.includes(q)) && (filtre === "tous" || aTraiter(c));
    });
  }, [clients, recherche, filtre, aTraiter]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titre="Clients"
        description={`${clients.length} contrepartie${clients.length > 1 ? "s" : ""} suivie${clients.length > 1 ? "s" : ""}`}
        actions={
          can("client", "create") && (
            <Link
              href="/clients/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              Nouveau client
            </Link>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un client, un secteur, un gestionnaire…"
            aria-label="Rechercher"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFiltre(filtre === "aTraiter" ? "tous" : "aTraiter")}
          aria-pressed={filtre === "aTraiter"}
          className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors ${
            filtre === "aTraiter"
              ? "border-warning bg-warning-subtle text-warning"
              : "border-border bg-card text-foreground hover:bg-accent"
          }`}
        >
          <AlertTriangle size={15} />
          KYC ou conformité à traiter
          {nbATraiter > 0 && (
            <span className="rounded-full bg-warning px-1.5 text-[11px] font-bold text-warning-foreground">
              {nbATraiter}
            </span>
          )}
        </button>

        {filtre === "aTraiter" && (
          <button
            onClick={() => setFiltre("tous")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Tout afficher
          </button>
        )}
      </div>

      <SectionCard sansPadding>
        {filtres.length === 0 ? (
          <EmptyState
            icone={<Users size={28} />}
            titre={clients.length === 0 ? "Aucun client" : "Aucun client ne correspond"}
            description={
              clients.length === 0
                ? "Créez une contrepartie avant de lancer un projet."
                : "Modifiez la recherche ou retirez le filtre."
            }
            action={
              clients.length === 0 && can("client", "create")
                ? { href: "/clients/new", libelle: "Nouveau client" }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { t: "Client", a: "left" },
                    { t: "Secteur", a: "left" },
                    { t: "Segment", a: "left" },
                    { t: "Note interne", a: "left" },
                    { t: "Exposition", a: "right" },
                    { t: "KYC", a: "left" },
                    { t: "Conformité", a: "left" },
                    { t: "Projets", a: "right" },
                    { t: "", a: "right" },
                  ].map((c, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                        c.a === "right" ? "text-right" : "text-left"
                      }`}
                    >
                      {c.t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtres.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium text-foreground">{c.nom}</span>
                      {c.gestionnaire && (
                        <span className="block text-[11.5px] text-muted-foreground">
                          {c.gestionnaire}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {c.secteur || "—"}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {c.segmentClientele || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.ratingInterne ? (
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[12.5px] font-bold ${ratingBadgeClass(c.ratingInterne)}`}
                        >
                          {c.ratingInterne}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {c.exposition ? formatMADCompact(c.exposition) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Conformite valeur={c.statusKYC} aTraiter={KYC_A_TRAITER} />
                    </td>
                    <td className="px-4 py-3">
                      <Conformite
                        valeur={c.statusConformite}
                        aTraiter={CONFORMITE_A_TRAITER}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-[12.5px] text-muted-foreground">
                      {c.projects?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {can("client", "delete") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setASupprimer(c.id);
                          }}
                          aria-label={`Supprimer ${c.nom}`}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {aSupprimer && (
        <DeleteConfirmation
          isOpen
          onCancel={() => setASupprimer(null)}
          onConfirm={() => supprimer(aSupprimer)}
          title="Supprimer ce client ?"
          message={`« ${clients.find((c) => c.id === aSupprimer)?.nom ?? "Ce client"} » sera définitivement supprimé. Cette action est irréversible.`}
          isDeleting={suppression}
        />
      )}
    </div>
  );
}

/** Puce d'état KYC ou conformité : neutre si rien n'est à faire, ambre sinon. */
function Conformite({
  valeur,
  aTraiter,
}: {
  valeur?: string | null;
  aTraiter: string[];
}) {
  if (!valeur) return <span className="text-muted-foreground">—</span>;
  const alerte = aTraiter.includes(valeur);
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
        alerte ? "bg-warning-subtle text-warning" : "bg-success-subtle text-success"
      }`}
    >
      {valeur}
    </span>
  );
}
