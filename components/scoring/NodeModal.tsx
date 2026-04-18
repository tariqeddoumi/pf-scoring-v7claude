"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface NodeModalProps {
  isOpen: boolean;
  nodeType: "DOMAIN" | "CRITERION";
  initialData?: {
    id?: string;
    code: string;
    label: string;
    shortLabel?: string;
    description?: string;
    weight?: number;
    answerType?: string;
  };
  parentDomainCode?: string;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  versionId?: string;
}

export default function NodeModal({
  isOpen,
  nodeType,
  initialData,
  parentDomainCode,
  onClose,
  onSubmit,
  versionId,
}: NodeModalProps) {
  const [formData, setFormData] = useState(initialData || {
    code: "",
    label: "",
    shortLabel: "",
    description: "",
    weight: nodeType === "DOMAIN" ? 0.1 : 0,
    answerType: "OPTION_SINGLE",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = !!initialData?.id;
  const title = isEdit
    ? `Modifier ${nodeType === "DOMAIN" ? "domaine" : "critère"}`
    : `Créer ${nodeType === "DOMAIN" ? "domaine" : "critère"}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder={nodeType === "DOMAIN" ? "D1" : "C1.1"}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
              disabled={isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Libellé
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Nom du domaine/critère"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Libellé court
            </label>
            <input
              type="text"
              value={formData.shortLabel}
              onChange={(e) => setFormData({ ...formData, shortLabel: e.target.value })}
              placeholder="Version abrégée"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle"
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Poids ({nodeType === "DOMAIN" ? "0-1" : "0-1"})
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.01"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {nodeType === "CRITERION" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Type de réponse
              </label>
              <select
                value={formData.answerType}
                onChange={(e) => setFormData({ ...formData, answerType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="OPTION_SINGLE">Options (liste déroulante)</option>
                <option value="NUMERIC_RANGE">Numérique (plages)</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Sauvegarde..." : isEdit ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
