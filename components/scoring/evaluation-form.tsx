"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Save, AlertCircle } from "lucide-react";

interface FormNode {
  id: string;
  code: string;
  label: string;
  description?: string;
  depth: number;
  nodeType: string;
  isScored: boolean;
  isMandatory: boolean;
  answerType?: string;
  weight?: number;
  answer?: {
    id: string;
    valueString?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    valueDate?: string;
    comment?: string;
    isAutoFilled?: boolean;
    isOverridden?: boolean;
  };
  binding?: {
    id: string;
    sourceEntity: string;
    sourcePath?: string;
    bindingMode: string;
  };
  children?: FormNode[];
}

interface EvaluationFormProps {
  evaluationId: string;
  form: FormNode[];
  onSave: (answers: Array<{ nodeId: string; value: unknown; overrideReason?: string }>) => Promise<void>;
  isLoading?: boolean;
}

export function EvaluationForm({ evaluationId, form, onSave, isLoading = false }: EvaluationFormProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const answers: Array<{ nodeId: string; value: unknown; overrideReason?: string }> = [];
      collectAnswers(form, answers);
      await onSave(answers);
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save answers");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex gap-2 p-3 bg-red-900/20 text-red-400 border border-red-700 rounded">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2 border border-gray-700 rounded p-4 bg-gray-950/50">
        {form.map((node) => (
          <FormNodeComponent
            key={node.id}
            node={node}
            expanded={expandedNodes}
            onToggle={toggleNode}
            onAnswerChange={() => setIsDirty(true)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded"
        >
          <Save className="w-4 h-4" />
          Save {isDirty ? "Changes" : ""}
        </button>
      </div>
    </div>
  );
}

function FormNodeComponent({
  node,
  expanded,
  onToggle,
  onAnswerChange,
}: {
  node: FormNode;
  expanded: Set<string>;
  onToggle: (nodeId: string) => void;
  onAnswerChange: () => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-2">
      <div className={`space-y-1 p-2 rounded border-l-2 ${node.isScored ? "border-blue-600" : "border-gray-700"}`}>
        <div className="flex items-start gap-2">
          {hasChildren && (
            <button
              onClick={() => onToggle(node.id)}
              className="mt-1 p-1 hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{node.label}</h4>
              {node.isMandatory && <span className="text-red-400 text-xs">*</span>}
              {node.binding && (
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                  Auto: {node.binding.sourceEntity}
                </span>
              )}
            </div>
            {node.description && <p className="text-xs text-gray-400 mt-1">{node.description}</p>}
          </div>
        </div>

        {/* Answer input */}
        {node.isScored && node.answer && (
          <div className="ml-6 mt-2 space-y-1">
            <AnswerInput
              node={node}
              answer={node.answer}
              onAnswerChange={onAnswerChange}
            />
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4 space-y-2">
          {node.children!.map((child) => (
            <FormNodeComponent
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onAnswerChange={onAnswerChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerInput({
  node,
  answer,
  onAnswerChange,
}: {
  node: FormNode;
  answer: FormNode["answer"];
  onAnswerChange: () => void;
}) {
  const [value, setValue] = useState(
    answer?.valueString ?? answer?.valueNumber ?? answer?.valueBoolean ?? answer?.valueDate ?? ""
  );

  const inputClass = "w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  if (node.answerType === "SELECT") {
    return (
      <select
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onAnswerChange();
        }}
        className={inputClass}
      >
        <option value="">Choose...</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
    );
  }

  if (node.answerType === "BOOLEAN") {
    return (
      <select
        value={value ? "true" : "false"}
        onChange={(e) => {
          setValue(e.target.value === "true");
          onAnswerChange();
        }}
        className={inputClass}
      >
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    );
  }

  if (node.answerType === "NUMBER") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onAnswerChange();
        }}
        className={inputClass}
        placeholder="Enter number"
      />
    );
  }

  if (node.answerType === "DATE") {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onAnswerChange();
        }}
        className={inputClass}
      />
    );
  }

  return (
    <textarea
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onAnswerChange();
      }}
      className={`${inputClass} resize-none`}
      rows={2}
      placeholder="Enter answer"
    />
  );
}

function collectAnswers(
  nodes: FormNode[],
  answers: Array<{ nodeId: string; value: unknown; overrideReason?: string }>
): void {
  for (const node of nodes) {
    if (node.answer?.valueString || node.answer?.valueNumber || node.answer?.valueBoolean || node.answer?.valueDate) {
      answers.push({
        nodeId: node.id,
        value:
          node.answer.valueNumber ??
          node.answer.valueBoolean ??
          node.answer.valueDate ??
          node.answer.valueString,
        overrideReason: node.answer.isOverridden ? node.answer.comment : undefined,
      });
    }
    if (node.children) {
      collectAnswers(node.children, answers);
    }
  }
}
