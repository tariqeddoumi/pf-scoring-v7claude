"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

interface Binding {
  id: string;
  sourceEntity: string;
  sourceField?: string;
  bindingMode: string;
  description?: string;
}

interface BindingsTabProps {
  nodeId: string;
  versionId: string;
}

export function BindingsTab({ nodeId, versionId }: BindingsTabProps) {
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sourceEntity: "PROJECT",
    sourceField: "",
    bindingMode: "AUTO_EDITABLE",
  });

  useEffect(() => {
    loadBindings();
  }, [nodeId, versionId]);

  const loadBindings = async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(`/api/admin/scoring/bindings?versionId=${versionId}&nodeId=${nodeId}`);
      if (res.ok) {
        const data = await res.json();
        setBindings(data.data || []);
      }
    } catch (e) {
      console.error("Load bindings error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBinding = async () => {
    if (!formData.sourceField) return;

    try {
      const res = await apiPost("/api/admin/scoring/bindings", {
        versionId,
        nodeId,
        ...formData,
      });

      if (res.ok) {
        const data = await res.json();
        setBindings([...bindings, data.data]);
        setFormData({ sourceEntity: "PROJECT", sourceField: "", bindingMode: "AUTO_EDITABLE" });
        setShowForm(false);
      }
    } catch (e) {
      console.error("Add binding error:", e);
    }
  };

  const handleDeleteBinding = async (bindingId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/bindings?id=${bindingId}`);
      if (res.ok) {
        setBindings(bindings.filter((b) => b.id !== bindingId));
      }
    } catch (e) {
      console.error("Delete binding error:", e);
    }
  };

  if (isLoading) return <p className="text-slate-400">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {bindings.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune liaison pour ce nœud</p>
        ) : (
          bindings.map((binding) => (
            <div key={binding.id} className="p-3 bg-slate-800 rounded border border-slate-700">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-white font-medium">{binding.sourceEntity}</p>
                  <p className="text-slate-400 text-xs">{binding.sourceField}</p>
                  <span className="text-xs bg-slate-700 px-2 py-0.5 rounded inline-block mt-1">{binding.bindingMode}</span>
                </div>
                <button
                  onClick={() => handleDeleteBinding(binding.id)}
                  className="p-1 hover:bg-slate-700 rounded text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2 justify-center"
        >
          <Plus size={16} />
          Ajouter une liaison
        </button>
      )}

      {showForm && (
        <div className="border-t border-slate-700 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Nouvelle liaison</h4>
          <select
            value={formData.sourceEntity}
            onChange={(e) => setFormData({ ...formData, sourceEntity: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          >
            <option>PROJECT</option>
            <option>CLIENT</option>
            <option>EVALUATION</option>
          </select>
          <input
            type="text"
            placeholder="Champ source"
            value={formData.sourceField}
            onChange={(e) => setFormData({ ...formData, sourceField: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddBinding}
              disabled={!formData.sourceField}
              className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded text-sm font-medium"
            >
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
