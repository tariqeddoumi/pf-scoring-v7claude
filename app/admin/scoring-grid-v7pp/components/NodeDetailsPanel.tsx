"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import type { ScoringNode, ScoringNodeOption, ScoringNodeRange } from "@/lib/types/scoring-grid";
import { apiPut, apiPost, apiDelete } from "@/lib/api-client";

interface NodeDetailsPanelProps {
  node: ScoringNode;
  versionId: string;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

type TabType = "properties" | "options" | "ranges" | "validation";

export function NodeDetailsPanel({
  node,
  versionId,
  onNodeUpdate,
  onDirtyChange,
}: NodeDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("properties");
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-slate-700 bg-slate-900">
        <div className="flex gap-0">
          {(["properties", "options", "ranges", "validation"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab === "properties" && "Propriétés"}
              {tab === "options" && "Options"}
              {tab === "ranges" && "Plages"}
              {tab === "validation" && "Validation"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "properties" && (
          <PropertiesTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} />
        )}
        {activeTab === "options" && (
          <OptionsTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} />
        )}
        {activeTab === "ranges" && (
          <RangesTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} />
        )}
        {activeTab === "validation" && <ValidationTab node={node} />}
      </div>
    </div>
  );
}

interface PropertiesTabProps {
  node: ScoringNode;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

function PropertiesTab({ node, onNodeUpdate, onDirtyChange }: PropertiesTabProps) {
  const [formData, setFormData] = useState(node);

  const handleChange = (field: keyof ScoringNode, value: any) => {
    setFormData({ ...formData, [field]: value });
    onDirtyChange(true);
  };

  const handleSave = async () => {
    try {
      const res = await apiPut(`/api/admin/scoring/nodes/${node.id}`, formData);
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      onNodeUpdate(formData);
      onDirtyChange(false);
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Code</label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => handleChange("code", e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Label</label>
        <input
          type="text"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Short Label</label>
        <input
          type="text"
          value={formData.shortLabel || ""}
          onChange={(e) => handleChange("shortLabel", e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
        />
      </div>

      {formData.weight !== null && formData.weight !== undefined && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Weight (%)</label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => handleChange("weight", parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
        </div>
      )}

      {formData.answerType && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Answer Type</label>
          <select
            value={formData.answerType}
            onChange={(e) => handleChange("answerType", e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          >
            <option value="OPTION_SINGLE">Option Unique</option>
            <option value="NUMERIC_RANGE">Plage Numérique</option>
          </select>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm font-medium"
      >
        Sauvegarder
      </button>
    </div>
  );
}

interface OptionsTabProps {
  node: ScoringNode;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

function OptionsTab({ node, onNodeUpdate, onDirtyChange }: OptionsTabProps) {
  const [options, setOptions] = useState<ScoringNodeOption[]>(node.options || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState<Partial<ScoringNodeOption>>({});

  const handleAddOption = async () => {
    if (!newOption.label || newOption.value === undefined) return;

    try {
      const res = await apiPost(`/api/admin/scoring/nodes/${node.id}/options`, newOption);
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const data = await res.json();
      setOptions([...options, data.data]);
      setNewOption({});
      onDirtyChange(true);
    } catch (e) {
      console.error("Add option error:", e);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/nodes/${node.id}/options/${optionId}`);
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setOptions(options.filter((o) => o.id !== optionId));
      onDirtyChange(true);
    } catch (e) {
      console.error("Delete option error:", e);
    }
  };

  if (node.answerType !== "OPTION_SINGLE") {
    return <p className="text-slate-400">Ce nœud n'utilise pas les options</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {options.map((option) => (
          <div key={option.id} className="p-3 bg-slate-800 rounded border border-slate-700">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-white font-medium">{option.label}</p>
                <p className="text-slate-400 text-sm">Code: {option.code}</p>
                <p className="text-slate-400 text-sm">Valeur: {option.value}</p>
                <p className="text-slate-400 text-sm">Score: {option.score}</p>
              </div>
              <button
                onClick={() => handleDeleteOption(option.id)}
                className="p-1 hover:bg-slate-700 rounded text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Ajouter une option</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Label"
            value={newOption.label || ""}
            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <input
            type="text"
            placeholder="Code"
            value={newOption.code || ""}
            onChange={(e) => setNewOption({ ...newOption, code: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <input
            type="text"
            placeholder="Valeur"
            value={newOption.value || ""}
            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <input
            type="number"
            placeholder="Score"
            value={newOption.score || ""}
            onChange={(e) => setNewOption({ ...newOption, score: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <button
            onClick={handleAddOption}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

interface RangesTabProps {
  node: ScoringNode;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

function RangesTab({ node, onNodeUpdate, onDirtyChange }: RangesTabProps) {
  const [ranges, setRanges] = useState<ScoringNodeRange[]>(node.ranges || []);
  const [newRange, setNewRange] = useState<Partial<ScoringNodeRange>>({});

  const handleAddRange = async () => {
    if (newRange.minValue === undefined || newRange.maxValue === undefined) return;

    try {
      const res = await apiPost(`/api/admin/scoring/nodes/${node.id}/ranges`, newRange);
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const data = await res.json();
      setRanges([...ranges, data.data]);
      setNewRange({});
      onDirtyChange(true);
    } catch (e) {
      console.error("Add range error:", e);
    }
  };

  const handleDeleteRange = async (rangeId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/nodes/${node.id}/ranges/${rangeId}`);
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setRanges(ranges.filter((r) => r.id !== rangeId));
      onDirtyChange(true);
    } catch (e) {
      console.error("Delete range error:", e);
    }
  };

  if (node.answerType !== "NUMERIC_RANGE") {
    return <p className="text-slate-400">Ce nœud n'utilise pas les plages</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {ranges.map((range) => (
          <div key={range.id} className="p-3 bg-slate-800 rounded border border-slate-700">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-white font-medium">{range.label}</p>
                <p className="text-slate-400 text-sm">
                  Plage: [{range.minValue}, {range.maxValue}]
                </p>
                <p className="text-slate-400 text-sm">Score: {range.score}</p>
              </div>
              <button
                onClick={() => handleDeleteRange(range.id)}
                className="p-1 hover:bg-slate-700 rounded text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 pt-4">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Ajouter une plage</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Label"
            value={newRange.label || ""}
            onChange={(e) => setNewRange({ ...newRange, label: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={newRange.minValue || ""}
              onChange={(e) => setNewRange({ ...newRange, minValue: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={newRange.maxValue || ""}
              onChange={(e) => setNewRange({ ...newRange, maxValue: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
          </div>
          <input
            type="number"
            placeholder="Score"
            value={newRange.score || ""}
            onChange={(e) => setNewRange({ ...newRange, score: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <button
            onClick={handleAddRange}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

interface ValidationTabProps {
  node: ScoringNode;
}

function ValidationTab({ node }: ValidationTabProps) {
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const validateNode = async () => {
    setLoading(true);
    try {
      const res = await apiPost("/api/admin/scoring/validate-grid", { versionId: "dummy" });
      const data = await res.json();
      setValidationErrors(data.data?.errors || []);
    } catch (e) {
      console.error("Validation error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={validateNode}
        disabled={loading}
        className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded text-white text-sm font-medium"
      >
        {loading ? "Validation en cours..." : "Valider le nœud"}
      </button>

      {validationErrors.length > 0 && (
        <div className="space-y-2">
          {validationErrors
            .filter((e) => e.nodeId === node.id)
            .map((error, i) => (
              <div
                key={i}
                className={`p-3 rounded text-sm ${
                  error.severity === "error"
                    ? "bg-red-900/20 border border-red-600 text-red-300"
                    : "bg-yellow-900/20 border border-yellow-600 text-yellow-300"
                }`}
              >
                <p className="font-medium">{error.message}</p>
                <p className="text-xs text-slate-400">Field: {error.field}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
