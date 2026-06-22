"use client";

import { AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";
import { V8ScoringAdjustment } from "@/lib/scoring-engine-v8";

interface V8ScoringAdjustmentDisplayProps {
  adjustment: V8ScoringAdjustment | undefined;
  baseScore: number;
  sectorLabel?: string;
}

export default function V8ScoringAdjustmentDisplay({
  adjustment,
  baseScore,
  sectorLabel = "Secteur",
}: V8ScoringAdjustmentDisplayProps) {
  if (!adjustment) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-500">
        Sélectionnez un secteur pour voir les ajustements V8
      </div>
    );
  }

  const totalAdjustment = adjustment.adjustedScore - adjustment.adjustmentDetail.baseScore;
  const isPositive = totalAdjustment > 0;

  return (
    <div className="space-y-4">
      {/* Main Adjustment Summary */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-6 text-white">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-slate-300 text-sm mb-2">Score de base (V7++)</div>
            <div className="text-3xl font-bold">{baseScore.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-slate-300 text-sm mb-2">
              Score ajusté (V7++ + {sectorLabel})
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              {adjustment.adjustedScore.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Adjustment Arrow */}
        <div className="mt-4 flex items-center gap-2">
          {isPositive ? (
            <TrendingUp size={20} className="text-green-400" />
          ) : (
            <TrendingDown size={20} className="text-red-400" />
          )}
          <span
            className={`text-lg font-semibold ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}{totalAdjustment.toFixed(2)} points
          </span>
        </div>
      </div>

      {/* Adjustment Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-blue-900 mb-2">
            Ajustement des poids de domaine
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {adjustment.adjustmentDetail.domainWeightAdjustments
              ? Object.entries(adjustment.adjustmentDetail.domainWeightAdjustments).length
              : 0}{" "}
            domaines
          </div>
          <div className="text-xs text-blue-700 mt-2">Poids sectoriels appliqués</div>
        </div>

        <div className={`rounded-lg p-4 border ${
          adjustment.adjustmentDetail.stressTestImpact < 0
            ? "bg-orange-50 border-orange-200"
            : "bg-green-50 border-green-200"
        }`}>
          <div className={`text-sm font-semibold mb-2 ${
            adjustment.adjustmentDetail.stressTestImpact < 0
              ? "text-orange-900"
              : "text-green-900"
          }`}>
            Impact des tests de stress
          </div>
          <div className={`text-2xl font-bold ${
            adjustment.adjustmentDetail.stressTestImpact < 0
              ? "text-orange-600"
              : "text-green-600"
          }`}>
            {adjustment.adjustmentDetail.stressTestImpact.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {adjustment.triggeredRedFlags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-600" />
            <div className="font-semibold text-red-900">
              Signaux d&apos;alerte ({adjustment.triggeredRedFlags.length})
            </div>
          </div>
          <div className="space-y-2">
            {adjustment.triggeredRedFlags.map((flag, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                  flag.isNoGo ? "bg-red-600" : "bg-orange-500"
                }`} />
                <div>
                  <div className="text-red-900 font-medium">{flag.description}</div>
                  {flag.isNoGo && (
                    <div className="text-xs text-red-700 mt-1">
                      ⚠️ Condition de rejet automatique
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stress Tests */}
      {adjustment.stressTestResults.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-slate-600" />
            <div className="font-semibold text-slate-900">
              Tests de stress ({adjustment.stressTestResults.length})
            </div>
          </div>
          <div className="space-y-2">
            {adjustment.stressTestResults.map((test, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="text-slate-700">{test.description}</div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  test.severity === "high"
                    ? "bg-red-100 text-red-700"
                    : test.severity === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                }`}>
                  {test.severity.charAt(0).toUpperCase() + test.severity.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Adjustments Message */}
      {adjustment.triggeredRedFlags.length === 0 &&
        adjustment.stressTestResults.length === 0 &&
        totalAdjustment === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700 text-sm">
            ✓ Aucun signal d&apos;alerte détecté. Le score V7++ reste valide pour ce secteur.
          </div>
        )}
    </div>
  );
}
