"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";
import type { AnswerValue } from "./LiveScorePanel";
import { formatPart, formatPoidsDetail, sommeFratrie } from "@/lib/weight-format";

interface EvaluationAccordionViewProps {
  questionnaire: QuestionnaireNode[];
  answers: Record<string, AnswerValue>;
  onAnswer: (nodeId: string, val: AnswerValue) => void;
}

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
    "w-full px-3 py-2 bg-muted border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors";

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
            <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
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
                      ? "bg-primary/15 text-primary font-semibold"
                      : "bg-muted text-muted-foreground"
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
                    ? "bg-primary border-primary text-white"
                    : "bg-muted border-input text-muted-foreground hover:border-ring"
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
        className={`${inputClass} resize-none text-xs text-muted-foreground`}
        placeholder="Commentaire / justification (optionnel)"
      />
    </div>
  );
}

function QuestionNode({
  node,
  sommeNiveau,
  depth,
  answers,
  onAnswer,
  expandedAll,
}: {
  node: QuestionnaireNode;
  /** Somme des poids de la fratrie : un poids ne se lit que rapporté à elle. */
  sommeNiveau: number;
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

  const depthStyles = [
    "bg-card border border-border rounded-lg mb-2 ml-0",
    "bg-surface border-l-2 border-input ml-3 mb-1.5",
    "bg-card/50 border-l border-border ml-6 mb-1",
    "ml-9 mb-0.5",
  ];
  const style = depthStyles[Math.min(depth, depthStyles.length - 1)];

  const headerPy = depth === 0 ? "py-3 px-4" : depth === 1 ? "py-2.5 px-3" : "py-2 px-3";

  return (
    <div className={style}>
      {/* Header */}
      <div
        className={`flex items-start gap-2.5 ${headerPy} ${hasChildren ? "cursor-pointer select-none hover:bg-accent/50" : ""}`}
        onClick={hasChildren ? () => setOpen((v) => !v) : undefined}
      >
        {/* Toggle */}
        {hasChildren ? (
          <div className="mt-0.5 text-muted-foreground flex-shrink-0">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        ) : (
          <div className="mt-0.5 w-4 flex-shrink-0">
            {isAnswered ? (
              <CheckCircle2 size={12} className="text-success" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-input mt-px" />
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium ${
                depth === 0
                  ? "text-foreground text-sm"
                  : depth === 1
                  ? "text-foreground text-xs"
                  : "text-secondary-foreground text-xs"
              }`}
            >
              {node.label}
            </span>
            {!hasChildren && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {node.answerType?.replace("_", " ") || "TEXT"}
              </span>
            )}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
              <Info size={10} className="mt-0.5 flex-shrink-0" />
              {node.description}
            </p>
          )}
        </div>

        {/* Weight badge */}
        {node.weight !== undefined && node.weight !== null && depth > 0 && (
          <span
            className="text-xs text-muted-foreground flex-shrink-0"
            title={formatPoidsDetail(node.weight, sommeNiveau)}
          >
            {formatPart(node.weight, sommeNiveau) ?? `poids ${node.weight}`}
          </span>
        )}
      </div>

      {/* Input (leaf nodes) */}
      {!hasChildren && (
        <div className="px-4 pb-3">
          <NodeInput
            node={node}
            answer={answers[node.id]}
            onChange={(val) => onAnswer(node.id, val)}
          />
        </div>
      )}

      {/* Children */}
      {hasChildren && open && (
        <div className="pb-1.5 px-1.5">
          {node.children!.map((child) => (
            <QuestionNode
              key={child.id}
              node={child}
              sommeNiveau={sommeFratrie(node.children)}
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

function DomainAccordion({
  domain,
  answers,
  onAnswer,
  expandedAll,
}: {
  domain: QuestionnaireNode;
  answers: Record<string, AnswerValue>;
  onAnswer: (nodeId: string, val: AnswerValue) => void;
  expandedAll?: boolean;
}) {
  const [open, setOpen] = useState(!!expandedAll);

  const countLeaves = (node: QuestionnaireNode): number => {
    if (!node.children || node.children.length === 0) return 1;
    return node.children.reduce((s, c) => s + countLeaves(c), 0);
  };

  const countAnswered = (node: QuestionnaireNode): number => {
    if (!node.children || node.children.length === 0) {
      const a = answers[node.id];
      if (!a) return 0;
      return a.valueString !== undefined || a.valueNumber !== undefined || a.valueBoolean !== undefined
        ? 1
        : 0;
    }
    return node.children.reduce((s, c) => s + countAnswered(c), 0);
  };

  const total = countLeaves(domain);
  const answered = countAnswered(domain);
  const progress = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div className="border border-border rounded-lg mb-3 overflow-hidden">
      {/* Domain header (accordion trigger) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-card hover:bg-surface transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {open ? (
            <ChevronDown size={18} className="text-primary flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          )}
          <div>
            <h3 className="text-base font-semibold text-foreground">{domain.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{domain.code}</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs font-semibold text-secondary-foreground">
              {answered}/{total}
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">questions</div>
          </div>
          <div className="w-12 h-6 bg-muted rounded-full relative overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      {/* Domain content */}
      {open && (
        <div className="bg-surface px-4 py-3 border-t border-border">
          {domain.children && domain.children.length > 0 ? (
            domain.children.map((child) => (
              <QuestionNode
                key={child.id}
                node={child}
                sommeNiveau={sommeFratrie(domain.children)}
                depth={0}
                answers={answers}
                onAnswer={onAnswer}
                expandedAll={expandedAll}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ce domaine n'a pas encore de critères configurés.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EvaluationAccordionView({
  questionnaire,
  answers,
  onAnswer,
}: EvaluationAccordionViewProps) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tous les champs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vue complète de tous les domaines et leurs critères d'évaluation
            </p>
          </div>
          <button
            onClick={() => setExpandAll((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-secondary text-foreground text-sm rounded-lg transition-colors"
          >
            <ChevronDown size={14} />
            {expandAll ? "Réduire tout" : "Tout ouvrir"}
          </button>
        </div>

        {/* Domains with accordions */}
        <div>
          {questionnaire.map((domain) => (
            <DomainAccordion
              key={domain.id}
              domain={domain}
              answers={answers}
              onAnswer={onAnswer}
              expandedAll={expandAll}
            />
          ))}
        </div>

        {/* Footer spacing */}
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          {questionnaire.length} domaines • {questionnaire.reduce((s, d) => s + (d.children?.length ?? 0), 0)} critères
        </div>
      </div>
    </div>
  );
}
