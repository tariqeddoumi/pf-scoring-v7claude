"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { PageReserveeScores } from "@/components/providers/visibilite-scores";
import { StatutEvaluation } from "@/components/ui/status-badge";

interface NodeResult {
  nodeId: string;
  nodeCode: string;
  nodeLabel: string;
  rawScore: number;
  weightedScore: number;
  normalizedScore: number;
  aggregationMethod?: string;
  explanation: string;
  ruleImpacts: any[];
}

function ResultsPageContenu() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [trace, setTrace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrace();
  }, [evaluationId]);

  const loadTrace = async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(
        `/api/scoring/evaluations/${evaluationId}/trace`
      );
      if (!res.ok) throw new Error("Trace de calcul indisponible");
      const { data } = await res.json();
      setTrace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chargement des résultats impossible");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement des résultats…</div>;
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-destructive-subtle text-destructive border border-destructive/40 rounded">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Erreur</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const ratingColor = (rating: string) => {
    if (rating.includes("AAA") || rating.includes("AA")) return "text-success";
    if (rating.includes("BBB") || rating.includes("BB")) return "text-warning";
    if (rating.includes("CCC") || rating.includes("CC")) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-card rounded"
         aria-label="Retour">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[22px] font-semibold text-foreground">Trace de calcul</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Score final" value={trace?.finalScore?.toFixed(1).replace(".", ",")} />
        <SummaryCard label="Note" value={trace?.rating} color={ratingColor(trace?.rating || "")} />
        <SummaryCard label="Total des malus" value={trace?.malusTotal?.toFixed(2).replace(".", ",")} />
        <SummaryCard label="Règles déclenchées" value={String(trace?.nodeResults?.filter((r: NodeResult) => r.ruleImpacts?.length > 0).length || 0)} />
      </div>

      {/* Recommendation box */}
      {trace?.recommendation && (
        <div className="p-4 bg-accent border border-border rounded">
          <h3 className="font-semibold text-accent-foreground mb-2">Recommandation</h3>
          <p className="text-sm">{trace.recommendation}</p>
        </div>
      )}

      {/* Node results table */}
      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="px-4 py-3 text-left font-semibold">Critère</th>
              <th className="px-4 py-3 text-right font-semibold">Score brut</th>
              <th className="px-4 py-3 text-right font-semibold">Pondéré</th>
              <th className="px-4 py-3 text-right font-semibold">Normalisé</th>
              <th className="px-4 py-3 text-left font-semibold">Explication</th>
              <th className="px-4 py-3 text-left font-semibold">Règles</th>
            </tr>
          </thead>
          <tbody>
            {trace?.nodeResults?.map((result: NodeResult) => (
              <tr key={result.nodeId} className="border-b border-border hover:bg-card/30">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{result.nodeLabel}</div>
                    <div className="text-xs text-muted-foreground">{result.nodeCode}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-warning">
                  {result.rawScore.toFixed(2).replace(".", ",")}
                </td>
                <td className="px-4 py-3 text-right text-primary">
                  {result.weightedScore.toFixed(2).replace(".", ",")}
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {(result.normalizedScore * 100).toFixed(1).replace(".", ",")} %
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {result.explanation}
                </td>
                <td className="px-4 py-3">
                  {result.ruleImpacts?.length > 0 && (
                    <div className="text-xs space-y-1">
                      {result.ruleImpacts.map((r: any) => (
                        <div key={r.ruleId} className="text-warning">
                          {r.ruleCode} ({r.severity})
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status info */}
      <div className="p-4 bg-card border border-border rounded text-sm">
        <p>Statut : <StatutEvaluation statut={trace?.status} /></p>
        {trace?.submittedAt && (
          <p className="text-muted-foreground">
            Soumise le {new Date(trace.submittedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color = "",
}: {
  label: string;
  value: string | undefined;
  color?: string;
}) {
  return (
    <div className="p-4 bg-card border border-border rounded">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value || "-"}</p>
    </div>
  );
}

// Écran consacré aux scores : réservé aux rôles qui les voient.
export default function ResultsPage() {
  return (
    <PageReserveeScores titre="Résultats détaillés">
      <ResultsPageContenu />
    </PageReserveeScores>
  );
}
