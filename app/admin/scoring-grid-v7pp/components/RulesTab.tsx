"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";

interface Rule {
  id: string;
  code: string;
  label: string;
  severity: string;
  ruleType: string;
  messageUser?: string;
}

interface RulesTabProps {
  nodeId: string;
  versionId: string;
}

export function RulesTab({ nodeId, versionId }: RulesTabProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    label: "",
    ruleType: "WARNING",
    severity: "MEDIUM",
    messageUser: "",
  });

  useEffect(() => {
    loadRules();
  }, [nodeId, versionId]);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(`/api/admin/scoring/rules?versionId=${versionId}&nodeId=${nodeId}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
      }
    } catch (e) {
      console.error("Load rules error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!formData.code) return;

    try {
      const res = await apiPost("/api/admin/scoring/rules", {
        versionId,
        nodeId,
        ...formData,
      });

      if (res.ok) {
        const data = await res.json();
        setRules([...rules, data.data]);
        setFormData({ code: "", label: "", ruleType: "WARNING", severity: "MEDIUM", messageUser: "" });
        setShowForm(false);
      }
    } catch (e) {
      console.error("Add rule error:", e);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/rules?id=${ruleId}`);
      if (res.ok) {
        setRules(rules.filter((r) => r.id !== ruleId));
      }
    } catch (e) {
      console.error("Delete rule error:", e);
    }
  };

  if (isLoading) return <p className="text-slate-400">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {rules.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune règle pour ce nœud</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="p-3 bg-slate-800 rounded border border-slate-700">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-white font-medium">{rule.label || rule.code}</p>
                  <p className="text-slate-400 text-xs space-x-2">
                    <span className="bg-slate-700 px-2 py-0.5 rounded">{rule.ruleType}</span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded">{rule.severity}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
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
          Ajouter une règle
        </button>
      )}

      {showForm && (
        <div className="border-t border-slate-700 pt-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Nouvelle règle</h4>
          <input
            type="text"
            placeholder="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          />
          <select
            value={formData.ruleType}
            onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
          >
            <option>NO_GO</option>
            <option>HARD_STOP</option>
            <option>WARNING</option>
            <option>MALUS</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleAddRule}
              disabled={!formData.code}
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
