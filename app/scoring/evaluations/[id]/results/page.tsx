"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";

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

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [trace, setTrace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrace();
  }, [evaluationId]);

  const loadTrace = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/scoring/evaluations/${evaluationId}/trace`
      );
      if (!res.ok) throw new Error("Failed to load trace");
      const { data } = await res.json();
      setTrace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading results");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-900/20 text-red-400 border border-red-700 rounded">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const ratingColor = (rating: string) => {
    if (rating.includes("AAA") || rating.includes("AA")) return "text-green-400";
    if (rating.includes("BBB") || rating.includes("BB")) return "text-yellow-400";
    if (rating.includes("CCC") || rating.includes("CC")) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Scoring Results</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Final Score" value={trace?.finalScore?.toFixed(2)} />
        <SummaryCard label="Rating" value={trace?.rating} color={ratingColor(trace?.rating || "")} />
        <SummaryCard label="Malus Total" value={trace?.malusTotal?.toFixed(2)} />
        <SummaryCard label="Rules Triggered" value={String(trace?.nodeResults?.filter((r: NodeResult) => r.ruleImpacts?.length > 0).length || 0)} />
      </div>

      {/* Recommendation box */}
      {trace?.recommendation && (
        <div className="p-4 bg-blue-900/20 border border-blue-700 rounded">
          <h3 className="font-semibold text-blue-300 mb-2">Recommendation</h3>
          <p className="text-sm">{trace.recommendation}</p>
        </div>
      )}

      {/* Node results table */}
      <div className="border border-gray-700 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              <th className="px-4 py-3 text-left font-semibold">Node</th>
              <th className="px-4 py-3 text-right font-semibold">Raw Score</th>
              <th className="px-4 py-3 text-right font-semibold">Weighted</th>
              <th className="px-4 py-3 text-right font-semibold">Normalized</th>
              <th className="px-4 py-3 text-left font-semibold">Explanation</th>
              <th className="px-4 py-3 text-left font-semibold">Rules</th>
            </tr>
          </thead>
          <tbody>
            {trace?.nodeResults?.map((result: NodeResult) => (
              <tr key={result.nodeId} className="border-b border-gray-800 hover:bg-gray-900/30">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{result.nodeLabel}</div>
                    <div className="text-xs text-gray-500">{result.nodeCode}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-yellow-400">
                  {result.rawScore.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-blue-400">
                  {result.weightedScore.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-purple-400">
                  {(result.normalizedScore * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {result.explanation}
                </td>
                <td className="px-4 py-3">
                  {result.ruleImpacts?.length > 0 && (
                    <div className="text-xs space-y-1">
                      {result.ruleImpacts.map((r: any) => (
                        <div key={r.ruleId} className="text-orange-400">
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
      <div className="p-4 bg-gray-900 border border-gray-700 rounded text-sm">
        <p>Status: <span className="font-semibold">{trace?.status}</span></p>
        {trace?.submittedAt && (
          <p className="text-gray-400">
            Submitted: {new Date(trace.submittedAt).toLocaleString()}
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
    <div className="p-4 bg-gray-900 border border-gray-700 rounded">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value || "-"}</p>
    </div>
  );
}
