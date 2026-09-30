"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ClipboardList,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { apiGet, apiDelete, apiPut, messageErreurApi } from "@/lib/api-client";
import { formatMAD, formatMADCompact, formatDate } from "@/lib/utils";
import { GRADE_THRESHOLDS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutEvaluation } from "@/components/ui/status-badge";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import { usePermission } from "@/lib/hooks/usePermission";

interface Evaluation {
  id: string;
  projectId: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  recommendation?: string | null;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  project?: {
    id: string;
    nom: string;
    montant?: number | null;
    secteur?: string | null;
    client?: { id: string; nom: string } | null;
  } | null;
  analyst?: { nom?: string | null; prenom?: string | null } | null;
  avancement?: { repondues: number; total: number };
}

type Etat = "aReprendre" | "aValider" | "clos" | "archivees";

const ONGLETS: { cle: Etat; libelle: string }[] = [
  { cle: "aReprendre", libelle: "À reprendre" },
  { cle: "aValider", libelle: "En attente de validation" },
  { cle: "clos", libelle: "Clos" },
  { cle: "archivees", libelle: "Archivées" },
];

/** Dans quel état de travail se trouve une évaluation, du point de vue de celui qui la traite. */
function etatDe(ev: Evaluation): Etat {
  if (ev.isArchived) return "archivees";
  if (ev.status === "brouillon") return "aReprendre";
  if (ev.status === "soumis" || ev.status === "soumise") return "aValider";
  return "clos";
}

/** Le moteur préfixe la recommandation par « Blocage » quand une règle rédhibitoire a joué. */
function estBloquee(ev: Evaluation): boolean {
  return (ev.recommendation ?? "").toLowerCase().startsWith("blocage");
}

function joursDepuis(date: string | null | undefined): number | null {
  if (!date) return null;
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}

/**
 * Liste des évaluations.
 *
 * L'écran mélangeait dans un même tableau les brouillons à reprendre, les dossiers en
 * attente de validation et les dossiers clos : rien n'y distinguait ce qu'il reste à
 * faire de ce qui est terminé. Il affichait en outre la date de création plutôt que
 * celle de la dernière activité, taisait l'avancement des brouillons, et son filtre de
 * notation omettait CC et C — les dossiers ainsi notés étaient introuvables.
 */
export default function EvaluationsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Etat>("aReprendre");
  const [recherche, setRecherche] = useState("");
  const [note, setNote] = useState("");
  const [aSupprimer, setASupprimer] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const res = await apiGet("/api/evaluations?limit=200");
      if (!res.ok) throw new Error(await messageErreurApi(res, "Chargement des évaluations impossible."));
      setEvaluations((await res.json()).data ?? []);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      setEvaluations([]);
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
      const res = await apiDelete(`/api/evaluations/${id}`);
      if (!res.ok) throw new Error("Suppression impossible.");
      setEvaluations((liste) => liste.filter((e) => e.id !== id));
      setASupprimer(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSuppression(false);
    }
  };

  const archiver = async (ev: Evaluation, archiver: boolean) => {
    try {
      const res = await apiPut(`/api/evaluations/${ev.id}`, { isArchived: archiver });
      if (!res.ok) throw new Error("Archivage impossible.");
      setEvaluations((liste) =>
        liste.map((e) => (e.id === ev.id ? { ...e, isArchived: archiver } : e))
      );
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Archivage impossible.");
    }
  };

  const compteurs = useMemo(() => {
    const c: Record<Etat, number> = {
      aReprendre: 0,
      aValider: 0,
      clos: 0,
      archivees: 0,
    };
    for (const ev of evaluations) c[etatDe(ev)] += 1;
    return c;
  }, [evaluations]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return evaluations
      .filter((ev) => {
        const texte =
          `${ev.project?.nom ?? ""} ${ev.project?.client?.nom ?? ""} ${
            ev.analyst ? `${ev.analyst.prenom ?? ""} ${ev.analyst.nom ?? ""}` : ""
          }`.toLowerCase();
        return (
          etatDe(ev) === onglet &&
          (!q || texte.includes(q)) &&
          (!note || ev.rating === note)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() -
          new Date(a.updatedAt ?? a.createdAt).getTime()
      );
  }, [evaluations, onglet, recherche, note]);

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
        titre="Évaluations"
        description={`${evaluations.length} évaluation${evaluations.length > 1 ? "s" : ""} au total`}
        actions={
          can("evaluation", "create") && (
            <Link
              href="/evaluations/new"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus size={16} />
              Nouvelle évaluation
            </Link>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* Les onglets disent d'abord ce qu'il reste à faire : un brouillon et un dossier
          clos n'appellent pas la même action, et le tri par statut ne suffisait pas. */}
      <div
        role="tablist"
        aria-label="État des évaluations"
        className="mb-4 flex flex-wrap items-center gap-1 border-b border-border"
      >
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            role="tab"
            aria-selected={onglet === o.cle}
            onClick={() => setOnglet(o.cle)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              onglet === o.cle
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.libelle}
            <span
              className={`rounded-full px-1.5 text-[11px] font-bold ${
                onglet === o.cle
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {compteurs[o.cle]}
            </span>
          </button>
        ))}
      </div>

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
            placeholder="Rechercher un projet, un client, un analyste…"
            aria-label="Rechercher"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        {/* L'échelle complète, CC et C compris : le filtre s'arrêtait à CCC puis sautait
            à D, si bien qu'aucun dossier noté CC ou C ne pouvait être retrouvé. */}
        <select
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Filtrer par notation"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">Toutes les notations</option>
          {Object.keys(GRADE_THRESHOLDS).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {note && (
          <button
            onClick={() => setNote("")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Effacer le filtre
          </button>
        )}
      </div>

      <SectionCard sansPadding>
        {filtrees.length === 0 ? (
          <EmptyState
            icone={<ClipboardList size={28} />}
            titre={
              evaluations.length === 0
                ? "Aucune évaluation"
                : "Aucune évaluation dans cet onglet"
            }
            description={
              evaluations.length === 0
                ? "Lancez une évaluation depuis un projet pour obtenir une note."
                : "Changez d'onglet ou retirez le filtre de notation."
            }
            action={
              evaluations.length === 0 && can("evaluation", "create")
                ? { href: "/evaluations/new", libelle: "Nouvelle évaluation" }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { t: "Dossier", a: "left" },
                    { t: "Montant", a: "right" },
                    {
                      t: onglet === "aReprendre" ? "Avancement" : "Note",
                      a: "left",
                    },
                    { t: "Statut", a: "left" },
                    { t: "Analyste", a: "left" },
                    { t: "Dernière activité", a: "left" },
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
                {filtrees.map((ev) => {
                  const brouillon = ev.status === "brouillon";
                  const attente = joursDepuis(ev.submittedAt);
                  return (
                    <tr
                      key={ev.id}
                      onClick={() =>
                        router.push(
                          brouillon && !ev.isArchived && can("evaluation", "update")
                            ? `/evaluations/${ev.id}/saisie`
                            : `/evaluations/${ev.id}`
                        )
                      }
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          {ev.project?.nom ?? "Projet inconnu"}
                          {estBloquee(ev) && (
                            <span
                              title={ev.recommendation ?? undefined}
                              className="inline-flex items-center gap-1 rounded-full bg-destructive-subtle px-2 py-0.5 text-[11px] font-semibold text-destructive"
                            >
                              <ShieldAlert size={12} />
                              Blocage
                            </span>
                          )}
                        </span>
                        {ev.project?.client?.nom && (
                          <span className="block text-[11.5px] text-muted-foreground">
                            {ev.project.client.nom}
                          </span>
                        )}
                      </td>

                      <td
                        className="whitespace-nowrap px-4 py-3 text-right"
                        title={
                          ev.project?.montant ? formatMAD(ev.project.montant) : undefined
                        }
                      >
                        {ev.project?.montant ? formatMADCompact(ev.project.montant) : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {brouillon ? (
                          <Avancement avancement={ev.avancement} />
                        ) : (
                          <Note note={ev.rating} score={ev.finalScore} />
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatutEvaluation statut={ev.status} />
                        {onglet === "aValider" && attente !== null && attente > 0 && (
                          <span
                            className={`mt-0.5 block text-[11.5px] ${
                              attente > 7 ? "text-warning" : "text-muted-foreground"
                            }`}
                          >
                            depuis {attente} jour{attente > 1 ? "s" : ""}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                        {ev.analyst
                          ? `${ev.analyst.prenom ?? ""} ${ev.analyst.nom ?? ""}`.trim() || "—"
                          : "—"}
                      </td>

                      {/* La colonne montrait la date de création : un brouillon repris
                          hier paraissait aussi dormant qu'un dossier oublié. */}
                      <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-muted-foreground">
                        {formatDate(ev.updatedAt ?? ev.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {can("evaluation", "delete") && (
                            <>
                              <button
                                onClick={() => archiver(ev, !ev.isArchived)}
                                aria-label={
                                  ev.isArchived
                                    ? `Restaurer l'évaluation de ${ev.project?.nom ?? "ce projet"}`
                                    : `Archiver l'évaluation de ${ev.project?.nom ?? "ce projet"}`
                                }
                                title={ev.isArchived ? "Restaurer" : "Archiver"}
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                              >
                                {ev.isArchived ? (
                                  <RotateCcw size={15} />
                                ) : (
                                  <Archive size={15} />
                                )}
                              </button>
                              <button
                                onClick={() => setASupprimer(ev.id)}
                                aria-label={`Supprimer l'évaluation de ${ev.project?.nom ?? "ce projet"}`}
                                title="Supprimer"
                                className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
          title="Supprimer cette évaluation ?"
          message={`L'évaluation de « ${
            evaluations.find((e) => e.id === aSupprimer)?.project?.nom ?? "ce projet"
          } » sera définitivement supprimée, avec ses réponses et sa trace de calcul. Cette action est irréversible.`}
          isDeleting={suppression}
        />
      )}
    </div>
  );
}

/** Avancement de la saisie d'un brouillon : rien ne l'indiquait dans la liste. */
function Avancement({ avancement }: { avancement?: { repondues: number; total: number } }) {
  if (!avancement || !avancement.total) {
    return <span className="text-muted-foreground">—</span>;
  }
  const pct = Math.round((avancement.repondues / avancement.total) * 100);
  return (
    <div className="min-w-[110px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] text-foreground tabulaire">
          {avancement.repondues}/{avancement.total}
        </span>
        <span className="text-[11.5px] text-muted-foreground tabulaire">{pct} %</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {/* La barre reste neutre : une saisie peu avancée n'est pas un mauvais
            dossier, et la teinter de rouge la ferait lire comme un score. */}
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
