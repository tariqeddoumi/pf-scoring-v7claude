"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GitBranch, Loader2, Search, X } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatMADCompact, formatDate } from "@/lib/utils";
import { scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note } from "@/components/ui/status-badge";
import { useVoirScores } from "@/components/providers/visibilite-scores";

interface Workflow {
  id: string;
  evaluationId: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string | null;
  evaluation?: {
    id?: string;
    finalScore?: number | null;
    rating?: string | null;
    project?: { id?: string; nom?: string; montant?: number | null } | null;
    analyst?: { prenom?: string | null; nom?: string | null } | null;
  } | null;
  steps?: { stepNumber: number; stepName?: string; status: string }[];
  approvals?: { status: string }[];
}

/**
 * Étapes du circuit, dans l'ordre. L'écran affichait « Étape actuelle : 0 » — un
 * nombre nu, sans nom ni total — et deux brouillons s'y lisaient « 0 » alors que leur
 * première étape était en cours.
 */
const ETAPES = [
  { cle: "DRAFT", libelle: "Saisie" },
  { cle: "SUBMITTED", libelle: "Revue risques" },
  { cle: "UNDER_REVIEW", libelle: "Revue risques" },
  { cle: "REVIEWED", libelle: "Comité" },
  { cle: "APPROVED", libelle: "Décision" },
  { cle: "REJECTED", libelle: "Décision" },
];

const STATUTS: Record<string, { libelle: string; ton: string }> = {
  DRAFT: { libelle: "Saisie", ton: "bg-muted text-muted-foreground" },
  SUBMITTED: { libelle: "Soumis", ton: "bg-warning-subtle text-warning" },
  UNDER_REVIEW: { libelle: "En revue", ton: "bg-warning-subtle text-warning" },
  REVIEWED: { libelle: "Revu", ton: "bg-accent text-accent-foreground" },
  APPROVED: { libelle: "Approuvé", ton: "bg-success-subtle text-success" },
  REJECTED: { libelle: "Rejeté", ton: "bg-destructive-subtle text-destructive" },
};

const ORDRE_ETAPES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVIEWED"];

/** Position du circuit dans la file, pour la frise. */
function position(w: Workflow): number {
  const i = ORDRE_ETAPES.indexOf(w.status);
  if (i >= 0) return i + 1;
  return ORDRE_ETAPES.length + 1;
}

/**
 * Circuits de validation.
 *
 * L'écran était illisible dans le thème sombre — bandeau, tuiles et cartes en
 * `bg-white` codé en dur sous un texte presque blanc —, inaccessible aux analystes
 * (la route exigeait le rôle d'administrateur du modèle) et orphelin : aucune entrée
 * de menu, aucun lien depuis une autre page n'y menait. Les tuiles annonçaient
 * « Total 6 » plutôt que ce qu'il y a à faire.
 */
export default function WorkflowsPage() {
  const voirScores = useVoirScores();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [etape, setEtape] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/admin/scoring/workflows?limit=100");
        if (!res.ok) {
          throw new Error(
            res.status === 403
              ? "Vos droits ne permettent pas de consulter les circuits de validation."
              : "Chargement des circuits impossible."
          );
        }
        const corps = await res.json();
        setWorkflows(corps.data ?? []);
        setErreur(null);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const compteurs = useMemo(() => {
    const c = { aInstruire: 0, enComite: 0, clos: 0 };
    for (const w of workflows) {
      if (w.status === "SUBMITTED" || w.status === "UNDER_REVIEW") c.aInstruire += 1;
      else if (w.status === "REVIEWED") c.enComite += 1;
      else if (w.status === "APPROVED" || w.status === "REJECTED") c.clos += 1;
    }
    return c;
  }, [workflows]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return workflows
      .filter((w) => {
        const texte = `${w.evaluation?.project?.nom ?? ""} ${
          w.evaluation?.analyst
            ? `${w.evaluation.analyst.prenom ?? ""} ${w.evaluation.analyst.nom ?? ""}`
            : ""
        }`.toLowerCase();
        return (!q || texte.includes(q)) && (!etape || w.status === etape);
      })
      .sort((a, b) => position(a) - position(b));
  }, [workflows, recherche, etape]);

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
        titre="Circuits de validation"
        description="De la saisie de l'analyste à la décision du comité."
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Tuile
          libelle="À instruire"
          valeur={compteurs.aInstruire}
          actif={etape === "SUBMITTED"}
          onClick={() => setEtape(etape === "SUBMITTED" ? "" : "SUBMITTED")}
        />
        <Tuile
          libelle="En attente de comité"
          valeur={compteurs.enComite}
          actif={etape === "REVIEWED"}
          onClick={() => setEtape(etape === "REVIEWED" ? "" : "REVIEWED")}
        />
        <Tuile libelle="Clos" valeur={compteurs.clos} />
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
            placeholder="Rechercher un dossier, un analyste…"
            aria-label="Rechercher"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
        {etape && (
          <button
            onClick={() => setEtape("")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Toutes les étapes
          </button>
        )}
      </div>

      {filtres.length === 0 ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<GitBranch size={28} />}
            titre={
              workflows.length === 0 ? "Aucun circuit" : "Aucun circuit ne correspond"
            }
            description={
              workflows.length === 0
                ? "Un circuit s'ouvre lorsqu'une évaluation est soumise à validation."
                : "Modifiez la recherche ou retirez le filtre d'étape."
            }
          />
        </SectionCard>
      ) : (
        <SectionCard sansPadding>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { t: "Dossier", a: "left" },
                  { t: "Montant", a: "right" },
                  { t: voirScores ? "Note" : "", a: "left" },
                  { t: "Étape", a: "left" },
                  { t: "Analyste", a: "left" },
                  { t: "Depuis", a: "left" },
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
              {filtres.map((w) => {
                const statut = STATUTS[w.status] ?? {
                  libelle: w.status,
                  ton: "bg-muted text-muted-foreground",
                };
                const total = ORDRE_ETAPES.length;
                return (
                  <tr
                    key={w.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/workflows/${w.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {w.evaluation?.project?.nom ?? "Dossier sans nom"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabulaire">
                      {w.evaluation?.project?.montant != null
                        ? formatMADCompact(w.evaluation.project.montant)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {w.evaluation?.rating ? (
                        <Note
                          note={w.evaluation.rating}
                          score={w.evaluation.finalScore}
                        />
                      ) : w.evaluation?.finalScore != null ? (
                        <span
                          className={`tabulaire text-[12.5px] font-semibold ${scoreTextClass(w.evaluation.finalScore)}`}
                        >
                          {w.evaluation.finalScore.toFixed(1).replace(".", ",")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* L'étape est nommée et située dans le circuit : elle s'affichait
                        sous la forme d'un nombre nu. */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${statut.ton}`}
                      >
                        {statut.libelle}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                        étape {Math.min(position(w), total)} sur {total} —{" "}
                        {ETAPES.find((e) => e.cle === w.status)?.libelle ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-muted-foreground">
                      {w.evaluation?.analyst
                        ? `${w.evaluation.analyst.prenom ?? ""} ${w.evaluation.analyst.nom ?? ""}`.trim()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-muted-foreground">
                      {formatDate(w.submittedAt ?? w.updatedAt ?? w.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}

function Tuile({
  libelle,
  valeur,
  actif,
  onClick,
}: {
  libelle: string;
  valeur: number;
  actif?: boolean;
  onClick?: () => void;
}) {
  const contenu = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p className="mt-1 text-[19px] font-semibold text-foreground tabulaire">{valeur}</p>
    </>
  );
  if (!onClick) {
    return <div className="rounded-lg border border-border bg-card px-4 py-3">{contenu}</div>;
  }
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
        actif ? "border-primary bg-accent" : "border-border bg-card hover:bg-surface"
      }`}
    >
      {contenu}
    </button>
  );
}
