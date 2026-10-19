"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { apiGet, apiDelete, messageErreurApi } from "@/lib/api-client";
import { formatMAD, formatMADCompact, formatDate } from "@/lib/utils";
import { GRADE_THRESHOLDS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutEvaluation } from "@/components/ui/status-badge";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import { usePermission } from "@/lib/hooks/usePermission";
import { useVoirScores } from "@/components/providers/visibilite-scores";

interface Evaluation {
  id: string;
  projectId: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  /** Statut de la note du scoring PF (« Note provisoire — stade bloqué… », « Hors périmètre… »). */
  recommendation?: string | null;
  titre?: string | null;
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
}

type Etat = "aReprendre" | "aValider" | "clos";

const ONGLETS: { cle: Etat; libelle: string }[] = [
  { cle: "aReprendre", libelle: "À reprendre" },
  { cle: "aValider", libelle: "En attente de validation" },
  { cle: "clos", libelle: "Validées ou rejetées" },
];

/** Dans quel état de travail se trouve une évaluation, du point de vue de celui qui la traite. */
function etatDe(ev: Evaluation): Etat {
  if (ev.status === "brouillon") return "aReprendre";
  if (ev.status === "soumis" || ev.status === "soumise") return "aValider";
  return "clos";
}

/** Verrou actif : blocage B (note provisoire) ou exclusion X (aucune note). */
function verrou(ev: Evaluation): "blocage" | "exclusion" | null {
  const s = (ev.recommendation ?? "").toLowerCase();
  if (s.startsWith("hors périmètre")) return "exclusion";
  if (s.includes("bloqué")) return "blocage";
  return null;
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
  const voirScores = useVoirScores();
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
      const res = await apiDelete(`/api/evaluations-pf/${id}`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Suppression impossible."));
      setEvaluations((liste) => liste.filter((e) => e.id !== id));
      setASupprimer(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setSuppression(false);
    }
  };

  const compteurs = useMemo(() => {
    const c: Record<Etat, number> = {
      aReprendre: 0,
      aValider: 0,
      clos: 0,
    };
    for (const ev of evaluations) c[etatDe(ev)] += 1;
    return c;
  }, [evaluations]);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return evaluations
      .filter((ev) => {
        const texte =
          `${ev.project?.nom ?? ""} ${ev.titre ?? ""} ${ev.project?.client?.nom ?? ""} ${
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
        {voirScores && (
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
        )}

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
                ? "Lancez une évaluation depuis un projet ou avec le bouton « Nouvelle évaluation »."
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
                    { t: voirScores ? "Note" : "", a: "left" },
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
                  const attente = joursDepuis(ev.submittedAt);
                  const v = verrou(ev);
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => router.push(`/scoring-pf/${ev.id}`)}
                      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          {ev.project?.nom ?? "Projet inconnu"}
                          {v && (
                            <span
                              title={ev.recommendation ?? undefined}
                              className="inline-flex items-center gap-1 rounded-full bg-destructive-subtle px-2 py-0.5 text-[11px] font-semibold text-destructive"
                            >
                              {v === "exclusion" ? <Ban size={12} /> : <ShieldAlert size={12} />}
                              {v === "exclusion" ? "Exclusion" : "Blocage"}
                            </span>
                          )}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {[ev.project?.client?.nom, ev.titre].filter(Boolean).join(" · ")}
                        </span>
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
                        <Note note={ev.rating} score={ev.finalScore} />
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
          } » sera définitivement supprimée, avec sa saisie, ses pièces et son résultat. Cette action est irréversible.`}
          isDeleting={suppression}
        />
      )}
    </div>
  );
}
