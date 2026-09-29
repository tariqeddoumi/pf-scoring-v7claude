"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { apiGet, apiDelete } from "@/lib/api-client";
import { formatMAD, formatMADCompact } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutProjet } from "@/components/ui/status-badge";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import { usePermission } from "@/lib/hooks/usePermission";

interface Projet {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
  pays?: string | null;
  dateCreation: string;
  dateMiseAJour?: string;
  client?: { id: string; nom: string } | null;
  user?: { nom: string; prenom: string } | null;
}

/**
 * Statuts de projet, tels que les définit l'énumération ProjectStatus.
 *
 * Le filtre proposait « Terminé » et « Archivé », qui n'existent pas, et omettait
 * « En revue », « Approuvé » et « Rejeté » : on ne pouvait donc pas isoler les
 * dossiers en cours d'arbitrage, qui sont précisément ceux qu'on cherche.
 */
const STATUTS = [
  { valeur: "brouillon", libelle: "Brouillon" },
  { valeur: "en_cours", libelle: "En cours" },
  { valeur: "en_revue", libelle: "En revue" },
  { valeur: "approuve", libelle: "Approuvé" },
  { valeur: "rejete", libelle: "Rejeté" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [secteur, setSecteur] = useState("");
  const [libelleSecteur, setLibelleSecteur] = useState<Record<string, string>>({});
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      // Le référentiel sert à afficher « Énergies renouvelables » là où le projet
      // stocke « ENR » : le code est ce que le moteur rapproche, pas ce qui se lit.
      const [res, resSecteurs] = await Promise.all([
        apiGet("/api/projects?limit=200"),
        apiGet("/api/reference/sectors"),
      ]);
      if (!res.ok) throw new Error("Chargement des projets impossible.");
      setProjets((await res.json()).data ?? []);
      if (resSecteurs.ok) {
        const liste: { code: string; label: string }[] =
          (await resSecteurs.json()).data ?? [];
        setLibelleSecteur(Object.fromEntries(liste.map((s) => [s.code, s.label])));
      }
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      setProjets([]);
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
      const res = await apiDelete(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Suppression impossible.");
      setProjets((p) => p.filter((x) => x.id !== id));
      setASupprimer(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSuppression(false);
    }
  };

  const nomSecteur = useCallback(
    (code: string | null | undefined) =>
      (code && (libelleSecteur[code] ?? code)) || "—",
    [libelleSecteur]
  );

  const secteurs = useMemo(
    () =>
      [...new Set(projets.map((p) => p.secteur).filter(Boolean))].sort((a, b) =>
        nomSecteur(a).localeCompare(nomSecteur(b), "fr")
      ),
    [projets, nomSecteur]
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return projets.filter((p) => {
      // La recherche porte aussi sur le client : un chargé d'affaires cherche
      // souvent « les dossiers d'Atlas » plutôt qu'un nom de projet précis.
      const texte =
        `${p.nom} ${p.client?.nom ?? ""} ${p.secteur ?? ""} ${nomSecteur(p.secteur)}`.toLowerCase();
      return (
        (!q || texte.includes(q)) &&
        (!statut || p.status === statut) &&
        (!secteur || p.secteur === secteur)
      );
    });
  }, [projets, recherche, statut, secteur, nomSecteur]);

  const nbFiltres = [statut, secteur].filter(Boolean).length;

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
        titre="Projets"
        description={`${projets.length} projet${projets.length > 1 ? "s" : ""} au portefeuille`}
        actions={
          can("project", "create") && (
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              Nouveau projet
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
            placeholder="Rechercher un projet, un client, un secteur…"
            aria-label="Rechercher"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          aria-label="Filtrer par statut"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => (
            <option key={s.valeur} value={s.valeur}>
              {s.libelle}
            </option>
          ))}
        </select>

        <select
          value={secteur}
          onChange={(e) => setSecteur(e.target.value)}
          aria-label="Filtrer par secteur"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {nomSecteur(s)}
            </option>
          ))}
        </select>

        {nbFiltres > 0 && (
          <button
            onClick={() => {
              setStatut("");
              setSecteur("");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Effacer les filtres
          </button>
        )}
      </div>

      <SectionCard sansPadding>
        {filtres.length === 0 ? (
          <EmptyState
            icone={<Briefcase size={28} />}
            titre={projets.length === 0 ? "Aucun projet" : "Aucun projet ne correspond"}
            description={
              projets.length === 0
                ? "Créez un premier projet pour lancer une évaluation."
                : "Modifiez la recherche ou effacez les filtres."
            }
            action={
              projets.length === 0 && can("project", "create")
                ? { href: "/projects/new", libelle: "Nouveau projet" }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { t: "Projet", a: "left" },
                    { t: "Client", a: "left" },
                    { t: "Secteur", a: "left" },
                    { t: "Montant", a: "right" },
                    { t: "Note", a: "left" },
                    { t: "Statut", a: "left" },
                    { t: "Chargé", a: "left" },
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
                {filtres.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium text-foreground">{p.nom}</span>
                      {p.pays && (
                        <span className="block text-[11.5px] text-muted-foreground">
                          {p.pays}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {p.client?.nom ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {nomSecteur(p.secteur)}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      title={formatMAD(p.montant)}
                    >
                      {formatMADCompact(p.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <Note note={p.grade} score={p.scoreGlobal} />
                    </td>
                    <td className="px-4 py-3">
                      <StatutProjet statut={p.status} />
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {p.user ? `${p.user.prenom} ${p.user.nom}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {can("project", "delete") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setASupprimer(p.id);
                          }}
                          aria-label={`Supprimer ${p.nom}`}
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

      {filtres.length > 0 && filtres.length !== projets.length && (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          {filtres.length} projet{filtres.length > 1 ? "s" : ""} affiché
          {filtres.length > 1 ? "s" : ""} sur {projets.length}
        </p>
      )}

      {aSupprimer && (
        <DeleteConfirmation
          isOpen
          onCancel={() => setASupprimer(null)}
          onConfirm={() => supprimer(aSupprimer)}
          title="Supprimer ce projet ?"
          message={`« ${projets.find((p) => p.id === aSupprimer)?.nom ?? "Ce projet"} » sera définitivement supprimé, avec ses évaluations. Cette action est irréversible.`}
          isDeleting={suppression}
        />
      )}
    </div>
  );
}
