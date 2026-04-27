"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Save,
  Calculator,
  Send,
  AlertCircle,
  CheckCircle2,
  Info,
  RotateCcw,
  LayoutList,
  Columns,
} from "lucide-react";
import { DomainSidebar } from "./DomainSidebar";
import { LiveScorePanel, type AnswerValue } from "./LiveScorePanel";
import { EvaluationAccordionView } from "./EvaluationAccordionView";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface EvaluationWorkspaceProps {
  evaluationId: string;
  projectName: string;
  questionnaire: QuestionnaireNode[];
  modelVersionId: string;
  initialAnswers?: Record<string, AnswerValue>;
  onComplete: (evaluationId: string, score: number, rating: string) => void;
}

/* ─── helpers ───────────────────────────────────────────── */

function countLeaves(node: QuestionnaireNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((s, c) => s + countLeaves(c), 0);
}

function countAnswered(node: QuestionnaireNode, answers: Record<string, AnswerValue>): number {
  if (!node.children || node.children.length === 0) {
    const a = answers[node.id];
    if (!a) return 0;
    return a.valueString !== undefined || a.valueNumber !== undefined || a.valueBoolean !== undefined
      ? 1
      : 0;
  }
  return node.children.reduce((s, c) => s + countAnswered(c, answers), 0);
}

function buildDomainStats(
  domains: QuestionnaireNode[],
  answers: Record<string, AnswerValue>
) {
  const stats: Record<string, { answered: number; total: number; score: number | null }> = {};
  for (const d of domains) {
    stats[d.id] = {
      answered: countAnswered(d, answers),
      total: countLeaves(d),
      score: null,
    };
  }
  return stats;
}

/* ─── NodeInput ─────────────────────────────────────────── */

function NodeInput({
  node,
  answer,
  onChange,
}: {
  node: QuestionnaireNode;
  answer: AnswerValue | undefined;
  onChange: (val: AnswerValue) => void;
}) {
  const inputClass =
    "w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors";

  const selectedOption = node.options?.find((o) => o.value === answer?.valueString);

  return (
    <div className="space-y-2">
      {/* Options (SELECT) */}
      {node.options && node.options.length > 0 && (
        <div>
          <select
            value={answer?.valueString ?? ""}
            onChange={(e) => onChange({ ...answer, valueString: e.target.value || undefined })}
            className={inputClass}
          >
            <option value="">— Sélectionner une option —</option>
            {node.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {selectedOption && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-cyan-400">
              <CheckCircle2 size={11} />
              Score attribué : <span className="font-bold">{selectedOption.score} pts</span>
            </div>
          )}
        </div>
      )}

      {/* Ranges (NUMERIC) */}
      {node.ranges && node.ranges.length > 0 && (
        <div>
          <input
            type="number"
            value={answer?.valueNumber ?? ""}
            onChange={(e) =>
              onChange({
                ...answer,
                valueNumber: e.target.value !== "" ? parseFloat(e.target.value) : undefined,
              })
            }
            className={inputClass}
            placeholder="Saisir une valeur numérique"
          />
          <div className="mt-1 flex flex-wrap gap-1">
            {node.ranges.map((r, i) => {
              const active =
                answer?.valueNumber !== undefined &&
                answer.valueNumber >= r.minValue &&
                answer.valueNumber <= r.maxValue;
              return (
                <span
                  key={i}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                      : "bg-slate-700 text-slate-500"
                  }`}
                >
                  {r.label || `${r.minValue}–${r.maxValue}`} → {r.score} pts
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Boolean */}
      {node.answerType === "BOOLEAN" && !node.options?.length && (
        <div className="flex gap-3">
          {(["Oui", "Non"] as const).map((label) => {
            const val = label === "Oui";
            const active = answer?.valueBoolean === val;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...answer, valueBoolean: val })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  active
                    ? "bg-cyan-600 border-cyan-500 text-white"
                    : "bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Free text (fallback) */}
      {!node.options?.length && !node.ranges?.length && node.answerType !== "BOOLEAN" && (
        <textarea
          value={answer?.valueString ?? ""}
          onChange={(e) => onChange({ ...answer, valueString: e.target.value || undefined })}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder="Réponse libre..."
        />
      )}

      {/* Comment */}
      <textarea
        value={answer?.comment ?? ""}
        onChange={(e) =>
          onChange({ ...answer, comment: e.target.value || undefined })
        }
        rows={1}
        className={`${inputClass} resize-none text-xs text-slate-400`}
        placeholder="Commentaire / justification (optionnel)"
      />
    </div>
  );
}

/* ─── CriteriaTree ──────────────────────────────────────── */

function CriteriaTree({
  node,
  depth,
  answers,
  onAnswer,
  expandedAll,
}: {
  node: QuestionnaireNode;
  depth: number;
  answers: Record<string, AnswerValue>;
  onAnswer: (nodeId: string, val: AnswerValue) => void;
  expandedAll?: boolean;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const [open, setOpen] = useState(depth < 2 || !!expandedAll);

  const answer = answers[node.id];
  const isAnswered =
    answer?.valueString !== undefined ||
    answer?.valueNumber !== undefined ||
    answer?.valueBoolean !== undefined;

  // depth-based styles
  const depthStyles = [
    "bg-slate-800 border border-slate-700 rounded-xl mb-3",
    "bg-slate-750 border-l-2 border-slate-600 ml-2 mb-2",
    "bg-slate-800/50 border-l border-slate-700 ml-4 mb-1.5",
    "ml-6 mb-1",
  ];
  const style = depthStyles[Math.min(depth, depthStyles.length - 1)];

  const headerPy = depth === 0 ? "py-4 px-5" : depth === 1 ? "py-3 px-4" : "py-2 px-3";

  return (
    <div className={style}>
      {/* Header */}
      <div
        className={`flex items-start gap-3 ${headerPy} ${hasChildren ? "cursor-pointer select-none" : ""}`}
        onClick={hasChildren ? () => setOpen((v) => !v) : undefined}
      >
        {/* Toggle */}
        {hasChildren ? (
          <div className="mt-0.5 text-slate-500 flex-shrink-0">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        ) : (
          <div className="mt-0.5 w-4 flex-shrink-0">
            {isAnswered ? (
              <CheckCircle2 size={14} className="text-green-400" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 mt-px" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Depth badge */}
            {depth === 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                {node.code}
              </span>
            )}
            <span
              className={`font-medium ${
                depth === 0
                  ? "text-white text-base"
                  : depth === 1
                  ? "text-slate-200 text-sm"
                  : "text-slate-300 text-sm"
              }`}
            >
              {node.label}
            </span>
            {!hasChildren && (
              <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
                {node.answerType?.replace("_", " ") || "TEXT"}
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
              <Info size={10} className="mt-0.5 flex-shrink-0" />
              {node.description}
            </p>
          )}
        </div>

        {/* Weight badge */}
        {node.weight !== undefined && node.weight !== null && depth > 0 && (
          <span className="text-xs text-slate-500 flex-shrink-0">
            ×{node.weight}
          </span>
        )}
      </div>

      {/* Input (leaf nodes) */}
      {!hasChildren && (
        <div className="px-4 pb-4">
          <NodeInput
            node={node}
            answer={answers[node.id]}
            onChange={(val) => onAnswer(node.id, val)}
          />
        </div>
      )}

      {/* Children */}
      {hasChildren && open && (
        <div className="pb-2 px-2">
          {node.children!.map((child) => (
            <CriteriaTree
              key={child.id}
              node={child}
              depth={depth + 1}
              answers={answers}
              onAnswer={onAnswer}
              expandedAll={expandedAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EvaluationWorkspace (main) ────────────────────────── */

export function EvaluationWorkspace({
  evaluationId,
  projectName,
  questionnaire,
  modelVersionId,
  initialAnswers = {},
  onComplete,
}: EvaluationWorkspaceProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(initialAnswers);
  const [currentDomainId, setCurrentDomainId] = useState(questionnaire[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [viewMode, setViewMode] = useState<"tabbed" | "accordion">("tabbed");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDomain = questionnaire.find((d) => d.id === currentDomainId) ?? questionnaire[0];
  const currentIndex = questionnaire.findIndex((d) => d.id === currentDomainId);
  const stats = buildDomainStats(questionnaire, answers);

  /* auto-save after 3 s idle */
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveAnswers(false), 3000);
  }, []);

  const handleAnswer = (nodeId: string, val: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [nodeId]: val }));
    triggerAutoSave();
  };

  /* ── Save answers ──────────────────────────────────────── */
  const saveAnswers = useCallback(
    async (showFeedback = true) => {
      setIsSaving(true);
      setError(null);
      try {
        const payload = Object.entries(answers).map(([nodeId, a]) => ({
          nodeId,
          answerType: "VALUE",
          valueString: a.valueString,
          valueNumber: a.valueNumber,
          valueBoolean: a.valueBoolean,
          comment: a.comment,
        }));

        const res = await fetch(`/api/scoring/evaluations/${evaluationId}/answers`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payload }),
        });

        if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
        setLastSaved(new Date());
        if (showFeedback) setSuccessMsg("Réponses sauvegardées ✓");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsSaving(false);
      }
    },
    [answers, evaluationId]
  );

  /* ── Calculate ─────────────────────────────────────────── */
  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await saveAnswers(false);

      const res = await fetch(`/api/scoring/evaluations/${evaluationId}/calculate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Calcul échoué");
      }

      const { data } = await res.json();
      setSuccessMsg(
        `Score calculé : ${data.finalScore.toFixed(1)} pts — Rating : ${data.rating}`
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsCalculating(false);
    }
  };

  /* ── Submit ────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!confirm("Soumettre l'évaluation pour validation ?")) return;
    setIsCalculating(true);
    setError(null);
    try {
      await saveAnswers(false);

      const calcRes = await fetch(`/api/scoring/evaluations/${evaluationId}/calculate`, {
        method: "POST",
      });
      if (!calcRes.ok) throw new Error("Calcul échoué");
      const { data } = await calcRes.json();

      const subRes = await fetch(`/api/scoring/evaluations/${evaluationId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });
      if (!subRes.ok) throw new Error("Soumission échouée");

      onComplete(evaluationId, data.finalScore, data.rating);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsCalculating(false);
    }
  };

  /* ── Next / Prev domain ────────────────────────────────── */
  const goPrev = () => {
    if (currentIndex > 0) setCurrentDomainId(questionnaire[currentIndex - 1].id);
  };
  const goNext = () => {
    if (currentIndex < questionnaire.length - 1)
      setCurrentDomainId(questionnaire[currentIndex + 1].id);
  };

  /* clear success message */
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950">
      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-white">{projectName}</h1>
          <p className="text-xs text-slate-400">Évaluation de Scoring — {evaluationId.slice(0, 8)}…</p>
        </div>

        {/* Messages */}
        <div className="flex-1 px-8">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              <CheckCircle2 size={14} />
              {successMsg}
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 flex-shrink-0 mr-3">
          <button
            onClick={() => setViewMode("tabbed")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all ${
              viewMode === "tabbed"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns size={13} />
            Domaine
          </button>
          <button
            onClick={() => setViewMode("accordion")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-all ${
              viewMode === "accordion"
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutList size={13} />
            Tous
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => saveAnswers(true)}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 text-sm rounded-lg transition-all"
          >
            <Save size={14} />
            {isSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-all"
          >
            <Calculator size={14} />
            Calculer
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all"
          >
            <Send size={14} />
            Soumettre
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Domain sidebar (hidden in accordion mode) */}
        {viewMode === "tabbed" && (
          <DomainSidebar
            domains={questionnaire}
            currentDomainId={currentDomainId}
            onSelect={setCurrentDomainId}
            stats={stats}
          />
        )}

        {/* Centre: Content area */}
        {viewMode === "tabbed" ? (
          <div className="flex-1 overflow-y-auto">
            {currentDomain && (
              <div className="max-w-3xl mx-auto px-6 py-6">
                {/* Domain header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {currentDomain.code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {currentIndex + 1} / {questionnaire.length}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{currentDomain.label}</h2>
                    {currentDomain.description && (
                      <p className="text-sm text-slate-400 mt-1">{currentDomain.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandAll((v) => !v)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {expandAll ? "Réduire tout" : "Tout ouvrir"}
                  </button>
                </div>

                {/* Progress for this domain */}
                {stats[currentDomain.id] && (
                  <div className="mb-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progression du domaine</span>
                        <span>
                          {stats[currentDomain.id].answered} / {stats[currentDomain.id].total} critères
                        </span>
                      </div>
                      <div className="bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-cyan-500 transition-all duration-500"
                          style={{
                            width: `${
                              stats[currentDomain.id].total > 0
                                ? (stats[currentDomain.id].answered / stats[currentDomain.id].total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Criteria tree */}
                <div>
                  {currentDomain.children && currentDomain.children.length > 0 ? (
                    currentDomain.children.map((child) => (
                      <CriteriaTree
                        key={child.id}
                        node={child}
                        depth={0}
                        answers={answers}
                        onAnswer={handleAnswer}
                        expandedAll={expandAll}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <p>Ce domaine n'a pas encore de critères configurés.</p>
                    </div>
                  )}
                </div>

                {/* Navigation prev/next */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-800">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                    {currentIndex > 0 ? questionnaire[currentIndex - 1].label : "—"}
                  </button>

                  <span className="text-xs text-slate-600">
                    Domaine {currentIndex + 1} sur {questionnaire.length}
                  </span>

                  <button
                    onClick={goNext}
                    disabled={currentIndex >= questionnaire.length - 1}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
                  >
                    {currentIndex < questionnaire.length - 1
                      ? questionnaire[currentIndex + 1].label
                      : "—"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EvaluationAccordionView
            questionnaire={questionnaire}
            answers={answers}
            onAnswer={handleAnswer}
          />
        )}

        {/* Right: Live score panel */}
        <LiveScorePanel
          questionnaire={questionnaire}
          answers={answers}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </div>
    </div>
  );
}
