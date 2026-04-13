"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

interface QuestionnaireFormProps {
  nodes: QuestionnaireNode[];
  onAnswersChange: (answers: Record<string, any>) => void;
  initialAnswers?: Record<string, any>;
}

interface AnswerState {
  [nodeId: string]: {
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    comment?: string;
  };
}

export function QuestionnaireForm({
  nodes,
  onAnswersChange,
  initialAnswers = {},
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<AnswerState>(initialAnswers);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    onAnswersChange(answers);
  }, [answers, onAnswersChange]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateAnswer = (
    nodeId: string,
    key: keyof Omit<
      AnswerState[string],
      "comment"
    >,
    value: any
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [key]: value,
      },
    }));
  };

  const updateComment = (nodeId: string, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        comment,
      },
    }));
  };

  const getPaddingClass = (depth: number) => {
    const paddings = ["pl-0", "pl-4", "pl-8", "pl-12", "pl-16"];
    return paddings[Math.min(depth, paddings.length - 1)];
  };

  const getBgClass = (depth: number) => {
    if (depth === 0) return "bg-slate-800 font-semibold";
    if (depth === 1) return "bg-slate-700/50";
    return "bg-slate-800/30";
  };

  const renderNode = (node: QuestionnaireNode, depth: number = 0): JSX.Element => {
    const isParent = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const nodeAnswer = answers[node.id];
    const paddingClass = getPaddingClass(depth);
    const bgClass = getBgClass(depth);

    return (
      <div key={node.id} className="border-l border-slate-700">
        <div className={`${paddingClass} py-3 px-4 ${bgClass}`}>
          {/* Header with toggle */}
          <div className="flex items-center gap-2 mb-2">
            {isParent && (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-slate-600 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            <div className="flex-1">
              <h3 className="text-white font-medium">{node.label}</h3>
              {node.description && (
                <p className="text-xs text-slate-400 mt-1">{node.description}</p>
              )}
            </div>
          </div>

          {/* Answer inputs */}
          {!isParent && (
            <div className="ml-6 space-y-3">
              {/* Options dropdown */}
              {node.options && node.options.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Choisir une option
                  </label>
                  <select
                    value={nodeAnswer?.valueString || ""}
                    onChange={(e) =>
                      updateAnswer(node.id, "valueString", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    {node.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.score} pts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Numeric range input */}
              {node.ranges && node.ranges.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Saisir une valeur
                  </label>
                  <input
                    type="number"
                    value={nodeAnswer?.valueNumber || ""}
                    onChange={(e) =>
                      updateAnswer(node.id, "valueNumber", e.target.value ? parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Ex: 7.5"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Plages: {node.ranges.map((r) => `${r.minValue}-${r.maxValue}=${r.score}pts`).join(", ")}
                  </p>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={nodeAnswer?.comment || ""}
                  onChange={(e) => updateComment(node.id, e.target.value)}
                  placeholder="Notes ou justification..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Children */}
        {isParent && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {nodes.map((node) => renderNode(node))}
    </div>
  );
}
