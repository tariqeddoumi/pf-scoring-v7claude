"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle,
  BarChart3,
  Edit2,
  FileSearch,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { apiGet, apiPost, messageErreurApi } from "@/lib/api-client";
import { usePermission } from "@/lib/hooks/usePermission";
import { scoreBarClass, scoreTextClass } from "@/lib/score-colors";
import { useVoirScores } from "@/components/providers/visibilite-scores";
import { Note, StatutEvaluation } from "@/components/ui/status-badge";
import { messageErreur } from "@/lib/erreur-inconnue";

interface Evaluation {
  id: string;
  projectId: string;
  project?: { nom: string };
  analystId?: string;
  rating?: string;
  finalScore?: number;
  recommendation: string;
  notes?: string;
  status: string;
  /** Scores par domaine issus de la trace de calcul persistée, pas de colonnes figées. */
  domainScores?: Array<{
    code: string;
    label: string;
    weight?: number | null;
    score?: number | null;
  }>;
  probabilityOfDefault?: number;
  malusTotal?: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <div>
    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
      {label}
    </label>
    <p className="text-foreground">
      {value !== null && value !== undefined && value !== "" ? (
        value
      ) : (
        <span className="text-muted-foreground italic">Non renseigné</span>
      )}
    </p>
  </div>
);

/**
 * Barre de score d'un domaine.
 *
 * La largeur valait « score × 10 » plafonné à 100 % : sur l'échelle 0–100 du moteur,
 * toute note au-dessus de 10 remplissait la barre entièrement. Un domaine à 20 sur 100
 * s'affichait aussi plein qu'un domaine à 95, ce qui rendait la lecture non seulement
 * inutile mais trompeuse.
 */
/**
 * Ton d'une recommandation, déduit de son texte.
 *
 * Un blocage et un refus se lisent en rouge, une approbation sous conditions en ambre,
 * une approbation franche en vert. Le reste reste neutre plutôt que d'être coloré au
 * hasard.
 */
function tonRecommandation(texte?: string | null): string {
  const t = (texte || "").toLowerCase();
  if (!t) return "bg-muted text-muted-foreground";
  if (t.includes("blocage") || t.includes("rejeter") || t.includes("refus"))
    return "bg-destructive-subtle text-destructive";
  if (t.includes("condition") || t.includes("comité") || t.includes("examiner"))
    return "bg-warning-subtle text-warning";
  if (t.includes("approuver")) return "bg-success-subtle text-success";
  return "bg-muted text-muted-foreground";
}

const ScoreBar = ({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) => {
  const renseigne = value !== null && value !== undefined;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </span>
        <span
          className={`font-semibold tabulaire ${renseigne ? scoreTextClass(value) : "text-muted-foreground"}`}
        >
          {renseigne ? `${value.toFixed(1).replace(".", ",")} / 100` : "—"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${renseigne ? scoreBarClass(value) : ""}`}
          style={{
            width: renseigne ? `${Math.max(0, Math.min(value, 100))}%` : "0%",
          }}
        />
      </div>
    </div>
  );
};

export default function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const voirScores = useVoirScores();
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evalId, setEvalId] = useState<string | null>(null);
  const { can } = usePermission();
  const [reouverture, setReouverture] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreurReouverture, setErreurReouverture] = useState<string | null>(
    null
  );

  /**
   * Remise en saisie d'une évaluation soumise ou rejetée.
   *
   * Une évaluation soumise ne pouvait plus être corrigée : le bouton « Reprendre la
   * saisie » n'apparaît que pour un brouillon, et rien ne ramenait un dossier soumis à
   * l'état de brouillon. Le score ne se corrige jamais directement — on corrige les
   * réponses, puis on relance le calcul — d'où ce retour en saisie, motivé et tracé.
   */
  const remettreEnSaisie = async () => {
    if (!evalId) return;
    setEnCours(true);
    setErreurReouverture(null);
    try {
      const res = await apiPost(`/api/scoring/evaluations/${evalId}/reopen`, {
        motif,
      });
      if (!res.ok)
        throw new Error(
          await messageErreurApi(res, "Remise en saisie impossible.")
        );
      router.push(`/evaluations/${evalId}/saisie`);
    } catch (e) {
      setErreurReouverture(
        e instanceof Error ? e.message : "Remise en saisie impossible."
      );
      setEnCours(false);
    }
  };

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setEvalId(id);
        const response = await apiGet(`/api/evaluations/${id}`);
        // Les évaluations sont des scorings PF : un lien vers cette ancienne page (signet,
        // courriel) mène à l'écran de scoring au lieu d'une impasse.
        if (response.status === 404) {
          const pf = await apiGet(`/api/evaluations-pf/${id}`);
          if (pf.ok) {
            router.replace(`/scoring-pf/${id}`);
            return;
          }
        }
        if (!response.ok)
          throw new Error("Chargement de l'évaluation impossible");
        const data = await response.json();
        setEvaluation(data.data || data);
        setError(null);
      } catch (err: unknown) {
        setError(messageErreur(err) || "Chargement de l'évaluation impossible");
        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    };
    resolveAndFetch();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-6">
        <Link
          href="/evaluations"
          className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
          <span>Retour aux évaluations</span>
        </Link>
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
          {error || "Évaluation non trouvée"}
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "general",
      label: "Générale",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Projet" value={evaluation.project?.nom} />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Statut
              </label>
              <StatutEvaluation statut={evaluation.status} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                Recommandation
              </label>
              {/* Le moteur écrit une phrase — « Approuver avec conditions »,
                  « Blocage — condition rédhibitoire déclenchée (NOGO_DSCR_MIN) » — et
                  non un code APPROVE/REJECT. La comparer à des codes affichait
                  « Approuver sous conditions » sur tous les dossiers, y compris ceux
                  que le moteur bloque. */}
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm ${tonRecommandation(evaluation.recommendation)}`}
              >
                {evaluation.recommendation || "Non calculée"}
              </span>
            </div>
            {voirScores && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Note
                </label>
                <Note note={evaluation.rating} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Notes
            </label>
            <p className="text-foreground whitespace-pre-wrap">
              {evaluation.notes || (
                <span className="text-muted-foreground italic">
                  Non renseigné
                </span>
              )}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "scores",
      label: "Scores",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Score final
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {evaluation.finalScore != null
                    ? evaluation.finalScore.toFixed(1).replace(".", ",")
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">sur 100</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  Probabilité de défaut
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {evaluation.probabilityOfDefault != null
                    ? evaluation.probabilityOfDefault
                        .toFixed(2)
                        .replace(".", ",")
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">%</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {evaluation.domainScores && evaluation.domainScores.length > 0 ? (
              evaluation.domainScores.map((d) => (
                <ScoreBar
                  key={d.code}
                  label={d.label}
                  value={d.score ?? undefined}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun score par domaine : l&apos;évaluation n&apos;a pas encore
                été calculée.
              </p>
            )}
          </div>
          <Field
            label="Total malus"
            value={
              evaluation.malusTotal != null
                ? evaluation.malusTotal.toFixed(2).replace(".", ",")
                : null
            }
          />
        </div>
      ),
    },
    {
      id: "approval",
      label: "Approbation",
      icon: <CheckCircle size={18} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Approuvé par" value={evaluation.approvedBy} />
            <Field
              label="Date d'approbation"
              value={
                evaluation.approvedAt
                  ? new Date(evaluation.approvedAt).toLocaleDateString("fr-FR")
                  : null
              }
            />
            <Field label="Rejeté par" value={evaluation.rejectedBy} />
            <Field
              label="Date de rejet"
              value={
                evaluation.rejectedAt
                  ? new Date(evaluation.rejectedAt).toLocaleDateString("fr-FR")
                  : null
              }
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Raison du rejet
            </label>
            <p className="text-foreground whitespace-pre-wrap">
              {evaluation.rejectionReason || (
                <span className="text-muted-foreground italic">
                  Non renseigné
                </span>
              )}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center space-x-4">
          <Link
            href="/evaluations"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {evaluation.project?.nom || "Évaluation"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Évaluation •{" "}
              {evaluation.createdAt
                ? new Date(evaluation.createdAt).toLocaleDateString("fr-FR")
                : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/scoring/evaluations/${evalId}/results`}
            className="inline-flex items-center space-x-2 bg-muted hover:bg-secondary text-foreground font-semibold px-4 py-2 rounded-lg transition-all"
          >
            <FileSearch size={20} />
            <span>Trace de calcul</span>
          </Link>
          {evaluation.status === "brouillon" && (
            <button
              onClick={() =>
                evalId && router.push(`/evaluations/${evalId}/saisie`)
              }
              className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition-all"
            >
              <Edit2 size={20} />
              <span>Reprendre la saisie</span>
            </button>
          )}
          {(evaluation.status === "soumis" || evaluation.status === "rejete") &&
            can("evaluation", "update") && (
              <button
                onClick={() => setReouverture(true)}
                className="inline-flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition-all"
              >
                <Edit2 size={20} />
                <span>Corriger l&apos;évaluation</span>
              </button>
            )}
        </div>
      </div>

      {reouverture && (
        <div className="rounded-lg border border-warning/40 bg-warning-subtle p-4 space-y-3">
          <p className="text-sm text-foreground">
            <strong>Remettre l&apos;évaluation en saisie ?</strong> Elle repasse
            en brouillon et sort du circuit de validation. Le score ne se
            corrige pas directement : modifiez les réponses concernées, relancez
            le calcul, puis soumettez à nouveau. Le motif est conservé dans les
            notes et le journal d&apos;audit.
          </p>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={2}
            placeholder="Motif de la correction (ex. erreur de saisie sur le DSCR de l'année 3)"
            aria-label="Motif de la correction"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
          {erreurReouverture && (
            <p className="text-sm text-destructive">{erreurReouverture}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setReouverture(false);
                setErreurReouverture(null);
              }}
              className="h-9 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-accent"
            >
              Annuler
            </button>
            <button
              onClick={remettreEnSaisie}
              disabled={enCours || motif.trim().length < 5}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              {enCours && <Loader2 size={15} className="animate-spin" />}
              Remettre en saisie
            </button>
          </div>
        </div>
      )}

      {/* Score Card */}
      {/* Réservé aux rôles qui voient les scores : ailleurs, ni score ni note. */}
      {voirScores &&
        evaluation.finalScore !== undefined &&
        evaluation.finalScore !== null && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  Score final
                </p>
                <p
                  className={`text-3xl font-bold tabulaire ${scoreTextClass(evaluation.finalScore)}`}
                >
                  {evaluation.finalScore.toFixed(1).replace(".", ",")}
                </p>
                <p className="text-xs text-muted-foreground">sur 100</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  Note
                </p>
                <Note note={evaluation.rating} taille="grande" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  Statut
                </p>
                <StatutEvaluation statut={evaluation.status} />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  Recommandation
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {evaluation.recommendation || "Non calculée"}
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <Tabs
          tabs={voirScores ? tabs : tabs.filter((t) => t.id !== "scores")}
          defaultTab="general"
        />
      </div>

      {/* Meta */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Informations système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Créé le"
            value={
              evaluation.createdAt
                ? new Date(evaluation.createdAt).toLocaleDateString("fr-FR")
                : null
            }
          />
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              Identifiant
            </label>
            <p className="text-foreground font-mono text-sm">{evaluation.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
