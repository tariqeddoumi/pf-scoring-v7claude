"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface RangeModalProps {
  isOpen: boolean;
  criterionCode: string;
  initialData?: {
    id?: string;
    minValue: number;
    maxValue: number;
    score: number;
    label?: string;
  };
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function RangeModal({
  isOpen,
  criterionCode,
  initialData,
  onClose,
  onSubmit,
}: RangeModalProps) {
  const [formData, setFormData] = useState(initialData || {
    minValue: 0,
    maxValue: 100,
    score: 50,
    label: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.minValue > formData.maxValue) {
      setError("La valeur min doit être inférieure à la valeur max");
      return;
    }

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
      <div className="bg-card rounded-xl border border-border w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? "Modifier plage" : "Ajouter plage"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">Critère: <span className="font-mono">{criterionCode}</span></p>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">
                Valeur min
              </label>
              <input
                type="number"
                value={formData.minValue}
                onChange={(e) => setFormData({ ...formData, minValue: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1">
                Valeur max
              </label>
              <input
                type="number"
                value={formData.maxValue}
                onChange={(e) => setFormData({ ...formData, maxValue: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-1">
              Score (0-100)
            </label>
            <input
              type="number"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-1">
              Libellé (optionnel)
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="ex: Excellent"
              className="w-full px-3 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input text-secondary-foreground hover:bg-accent transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors disabled:opacity-50"
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
