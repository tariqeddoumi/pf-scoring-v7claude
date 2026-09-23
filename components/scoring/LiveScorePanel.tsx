"use client";

import { Clock, TrendingUp, AlertTriangle, Loader2, Ban } from "lucide-react";

export interface AnswerValue {
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  comment?: string;
}

/** Résultat renvoyé par le moteur en mode aperçu. */
export interface ServerScore {
  finalScore: number;
  rating: string;
  malusTotal: number;
  blocked: boolean;
  blockingRuleCodes: string[];
  domains: Array<{ nodeId: string; code: string; label: string; score: number | null }>;
}

interface LiveScorePanelProps {
  /** Dernier résultat du moteur. null tant qu'aucun calcul n'a eu lieu. */
  score: ServerScore | null;
  /** Un calcul d'aperçu est en cours. */
  isScoring?: boolean;
  /** Des réponses non enregistrées rendent le score affiché obsolète. */
  isStale?: boolean;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

function getScoreColors(score: number | null) {
  if (score === null)
    return { text: "text-slate-600", bar: "bg-slate-700", badge: "text-slate-500 bg-slate-700/50" };
  if (score >= 70)
    return { text: "text-green-400", bar: "bg-green-400", badge: "text-green-400 bg-green-400/10" };
  if (score >= 50)
    return { text: "text-yellow-400", bar: "bg-yellow-400", badge: "text-yellow-400 bg-yellow-400/10" };
  return { text: "text-red-400", bar: "bg-red-400", badge: "text-red-400 bg-red-400/10" };
}

export function LiveScorePanel({
  score,
  isScoring,
  isStale,
  isSaving,
  lastSaved,
}: LiveScorePanelProps) {
  const total = score?.finalScore ?? null;
  const colors = getScoreColors(total);

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 flex flex-col w-56 flex-shrink-0">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-cyan-400" />
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Score du moteur
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <Clock size={10} />
          {isSaving
            ? "Sauvegarde…"
            : lastSaved
              ? lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
              : "—"}
        </div>
      </div>

      <div className="p-4 border-b border-slate-700 text-center">
        <div className={`text-5xl font-bold tabular-nums ${colors.text}`}>
          {total !== null ? total.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-slate-500 mt-1">/ 100 pts</div>

        {score?.rating && (
          <div
            className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${colors.badge}`}
          >
            {score.rating}
          </div>
        )}

        {total !== null && (
          <div className="mt-3 bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${colors.bar}`}
              style={{ width: `${Math.min(100, total)}%` }}
            />
          </div>
        )}

        <div className="mt-3 min-h-[1.25rem]">
          {isScoring ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400">
              <Loader2 size={11} className="animate-spin" />
              Calcul en cours…
            </span>
          ) : isStale ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={11} />
              Réponses non enregistrées
            </span>
          ) : total === null ? (
            <span className="text-xs text-slate-600">En attente d&apos;un premier calcul</span>
          ) : null}
        </div>
      </div>

      {score?.blocked && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1">
            <Ban size={12} />
            Condition rédhibitoire
          </div>
          <p className="text-xs text-red-300/80 leading-relaxed">
            {score.blockingRuleCodes.join(", ")} — le dossier ne peut être approuvé
            quelle que soit la note.
          </p>
        </div>
      )}

      {score !== null && score.malusTotal > 0 && (
        <div className="mx-4 mt-3 flex justify-between text-xs">
          <span className="text-slate-500">Malus appliqués</span>
          <span className="font-bold text-orange-400">− {score.malusTotal.toFixed(1)}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Par domaine
        </h3>
        {score === null ? (
          <p className="text-xs text-slate-600 leading-relaxed">
            Les scores par domaine s&apos;affichent après le premier calcul.
          </p>
        ) : (
          score.domains.map((d) => {
            const c = getScoreColors(d.score);
            return (
              <div key={d.nodeId}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400 truncate flex-1 pr-2">{d.label}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${c.text}`}>
                    {d.score !== null ? d.score.toFixed(0) : "—"}
                  </span>
                </div>
                <div className="bg-slate-800 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${c.bar}`}
                    style={{ width: d.score !== null ? `${Math.min(100, d.score)}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-600 leading-relaxed">
          Score calculé par le moteur sur les réponses enregistrées : poids, malus,
          règles et calibrage sectoriel compris.
        </p>
      </div>
    </div>
  );
}
