"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import type { ScoringNode, ScoringNodeOption, ScoringNodeRange } from "@/lib/types/scoring-grid";
import { apiPut, apiPost, apiDelete, messageErreurApi } from "@/lib/api-client";
import { RulesTab } from "./RulesTab";
import { BindingsTab } from "./BindingsTab";

interface NodeDetailsPanelProps {
  node: ScoringNode;
  versionId: string;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

type TabType = "properties" | "options" | "ranges" | "rules" | "bindings" | "validation";

export function NodeDetailsPanel({
  node,
  versionId,
  onNodeUpdate,
  onDirtyChange,
}: NodeDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("properties");
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-border bg-background">
        <div className="flex gap-0 overflow-x-auto">
          {(["properties", "options", "ranges", "rules", "bindings", "validation"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "properties" && "Propriétés"}
              {tab === "options" && "Options"}
              {tab === "ranges" && "Plages"}
              {tab === "rules" && "Règles"}
              {tab === "bindings" && "Liaisons"}
              {tab === "validation" && "Validation"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Les échecs d'enregistrement n'étaient écrits que dans la console. */}
        {erreur && (
          <p role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erreur}
            <button type="button" aria-label="Fermer" onClick={() => setErreur(null)}><X size={14} /></button>
          </p>
        )}
        {activeTab === "properties" && (
          <PropertiesTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} onErreur={setErreur} />
        )}
        {activeTab === "options" && (
          <OptionsTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} onErreur={setErreur} />
        )}
        {activeTab === "ranges" && (
          <RangesTab node={node} onNodeUpdate={onNodeUpdate} onDirtyChange={onDirtyChange} onErreur={setErreur} />
        )}
        {activeTab === "rules" && <RulesTab nodeId={node.id} versionId={versionId} />}
        {activeTab === "bindings" && <BindingsTab nodeId={node.id} versionId={versionId} />}
        {activeTab === "validation" && (
          <ValidationTab node={node} versionId={versionId} />
        )}
      </div>
    </div>
  );
}

interface PropertiesTabProps {
  node: ScoringNode;
  onNodeUpdate: (node: ScoringNode) => void;
  onDirtyChange: (dirty: boolean) => void;
}

function PropertiesTab({ node, onNodeUpdate, onDirtyChange, onErreur }: PropertiesTabProps & { onErreur: (m: string) => void }) {
  const [formData, setFormData] = useState(node);

  const handleChange = (field: keyof ScoringNode, value: any) => {
    setFormData({ ...formData, [field]: value });
    onDirtyChange(true);
  };

  const handleSave = async () => {
    try {
      const res = await apiPut(`/api/admin/scoring/nodes/${node.id}`, formData);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Erreur lors de la sauvegarde"));
      onNodeUpdate(formData);
      onDirtyChange(false);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nodedetailspanel-1" className="block text-sm font-medium text-secondary-foreground mb-2">Code</label>
        <input id="nodedetailspanel-1"
          type="text"
          value={formData.code}
          onChange={(e) => handleChange("code", e.target.value)}
          className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
        />
      </div>

      <div>
        <label htmlFor="nodedetailspanel-2" className="block text-sm font-medium text-secondary-foreground mb-2">Libellé</label>
        <input id="nodedetailspanel-2"
          type="text"
          value={formData.label}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
        />
      </div>

      <div>
        <label htmlFor="nodedetailspanel-3" className="block text-sm font-medium text-secondary-foreground mb-2">Libellé court</label>
        <input id="nodedetailspanel-3"
          type="text"
          value={formData.shortLabel || ""}
          onChange={(e) => handleChange("shortLabel", e.target.value)}
          className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
        />
      </div>

      <div>
        <label htmlFor="nodedetailspanel-4" className="block text-sm font-medium text-secondary-foreground mb-2">Description</label>
        <textarea id="nodedetailspanel-4"
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
        />
      </div>

      {formData.weight !== null && formData.weight !== undefined && (
        <div>
          <label htmlFor="nodedetailspanel-5" className="block text-sm font-medium text-secondary-foreground mb-2">Poids (%)</label>
          <input id="nodedetailspanel-5"
            type="number"
            value={formData.weight}
            onChange={(e) => handleChange("weight", parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
        </div>
      )}

      {/* Always shown so a domain/criterion node (answerType=null by default)
          can be made scoreable — required for DOMAIN-level granularity. */}
      <div>
        <label htmlFor="nodedetailspanel-6" className="block text-sm font-medium text-secondary-foreground mb-2">Type de réponse</label>
        <select id="nodedetailspanel-6"
          value={formData.answerType ?? ""}
          onChange={(e) =>
            handleChange("answerType", e.target.value === "" ? null : e.target.value)
          }
          className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
        >
          <option value="">Aucun (agrégation des enfants)</option>
          <option value="OPTION_SINGLE">Option Unique</option>
          <option value="NUMERIC_RANGE">Plage Numérique</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Choisir « Option Unique » ou « Plage » pour saisir un score directement
          sur ce nœud (utile pour la granularité au niveau domaine/critère).
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-success hover:bg-success/90 rounded text-success-foreground text-sm font-medium"
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

function OptionsTab({ node, onNodeUpdate, onDirtyChange, onErreur }: OptionsTabProps & { onErreur: (m: string) => void }) {
  const [options, setOptions] = useState<ScoringNodeOption[]>(node.options || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOption, setNewOption] = useState<Partial<ScoringNodeOption>>({});

  const handleAddOption = async () => {
    if (!newOption.label || newOption.value === undefined) return;

    try {
      const res = await apiPost(`/api/admin/scoring/nodes/${node.id}/options`, newOption);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Erreur lors de l'ajout"));
      const data = await res.json();
      setOptions([...options, data.data]);
      setNewOption({});
      onDirtyChange(true);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/nodes/${node.id}/options/${optionId}`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Erreur lors de la suppression"));
      setOptions(options.filter((o) => o.id !== optionId));
      onDirtyChange(true);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  if (node.answerType !== "OPTION_SINGLE") {
    return <p className="text-muted-foreground">Ce nœud n&apos;utilise pas les options</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {options.map((option) => (
          <div key={option.id} className="p-3 bg-card rounded border border-border">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-foreground font-medium">{option.label}</p>
                <p className="text-muted-foreground text-sm">Code: {option.code}</p>
                <p className="text-muted-foreground text-sm">Valeur: {option.value}</p>
                <p className="text-muted-foreground text-sm">Score: {option.score}</p>
              </div>
              <button
                onClick={() => handleDeleteOption(option.id)}
                className="p-1 hover:bg-accent rounded text-destructive"
               aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-secondary-foreground mb-3">Ajouter une option</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Libellé"
            value={newOption.label || ""}
            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <input
            type="text"
            placeholder="Code"
            value={newOption.code || ""}
            onChange={(e) => setNewOption({ ...newOption, code: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <input
            type="text"
            placeholder="Valeur"
            value={newOption.value || ""}
            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <input
            type="number"
            placeholder="Score"
            value={newOption.score || ""}
            onChange={(e) => setNewOption({ ...newOption, score: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <button
            onClick={handleAddOption}
            className="w-full px-3 py-2 bg-primary hover:bg-primary/90 rounded text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
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

function RangesTab({ node, onNodeUpdate, onDirtyChange, onErreur }: RangesTabProps & { onErreur: (m: string) => void }) {
  const [ranges, setRanges] = useState<ScoringNodeRange[]>(node.ranges || []);
  const [newRange, setNewRange] = useState<Partial<ScoringNodeRange>>({});

  const handleAddRange = async () => {
    if (newRange.minValue === undefined || newRange.maxValue === undefined) return;

    try {
      const res = await apiPost(`/api/admin/scoring/nodes/${node.id}/ranges`, newRange);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Erreur lors de l'ajout"));
      const data = await res.json();
      setRanges([...ranges, data.data]);
      setNewRange({});
      onDirtyChange(true);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  const handleDeleteRange = async (rangeId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/nodes/${node.id}/ranges/${rangeId}`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Erreur lors de la suppression"));
      setRanges(ranges.filter((r) => r.id !== rangeId));
      onDirtyChange(true);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : "Enregistrement impossible");
    }
  };

  if (node.answerType !== "NUMERIC_RANGE") {
    return <p className="text-muted-foreground">Ce nœud n&apos;utilise pas les plages</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {ranges.map((range) => (
          <div key={range.id} className="p-3 bg-card rounded border border-border">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <p className="text-foreground font-medium">{range.label}</p>
                <p className="text-muted-foreground text-sm">
                  Plage: [{range.minValue}, {range.maxValue}]
                </p>
                <p className="text-muted-foreground text-sm">Score: {range.score}</p>
              </div>
              <button
                onClick={() => handleDeleteRange(range.id)}
                className="p-1 hover:bg-accent rounded text-destructive"
               aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-secondary-foreground mb-3">Ajouter une plage</h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Libellé"
            value={newRange.label || ""}
            onChange={(e) => setNewRange({ ...newRange, label: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={newRange.minValue || ""}
              onChange={(e) => setNewRange({ ...newRange, minValue: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={newRange.maxValue || ""}
              onChange={(e) => setNewRange({ ...newRange, maxValue: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
            />
          </div>
          <input
            type="number"
            placeholder="Score"
            value={newRange.score || ""}
            onChange={(e) => setNewRange({ ...newRange, score: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <button
            onClick={handleAddRange}
            className="w-full px-3 py-2 bg-primary hover:bg-primary/90 rounded text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
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
  versionId: string;
}

function ValidationTab({ node, versionId }: ValidationTabProps) {
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const validateNode = async () => {
    setLoading(true);
    try {
      // L'onglet envoyait { versionId: "dummy" } : le serveur ne trouvait aucun nœud
      // et répondait toujours « valide ». La validation ne contrôlait rien.
      const res = await apiPost("/api/admin/scoring/validate-grid", { versionId });
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
        className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded text-primary-foreground text-sm font-medium"
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
                    ? "bg-destructive-subtle border border-destructive/40 text-destructive"
                    : "bg-warning-subtle border border-warning/40 text-warning"
                }`}
              >
                <p className="font-medium">{error.message}</p>
                <p className="text-xs text-muted-foreground">Champ : {error.field}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
