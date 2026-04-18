"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface OptionModalProps {
  isOpen: boolean;
  criterionCode: string;
  initialData?: {
    id?: string;
    value: string;
    label: string;
    score: number;
  };
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function OptionModal({
  isOpen,
  criterionCode,
  initialData,
  onClose,
  onSubmit,
}: OptionModalProps) {
  const [formData, setFormData] = useState(initialData || {
    value: "",
    label: "",
    score: 0,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? "Modifier option" : "Ajouter option"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-400">Critère: <span className="font-mono">{criterionCode}</span></p>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Valeur
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="ex: excellent"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
              disabled={isEdit}
            />
            <p className="text-xs text-slate-500 mt-1">Non modifiable après création</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Libellé
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Texte affiché à l'utilisateur"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Score (0-100)
            </label>
            <input
              type="number"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

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
              {loading ? "Sauvegarde..." : isEdit ? "Modifier" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
