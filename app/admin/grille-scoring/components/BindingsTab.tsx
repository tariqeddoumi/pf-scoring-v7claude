"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiPost, apiDelete, messageErreurApi } from "@/lib/api-client";

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

  // Les échecs passaient inaperçus : l'écran gardait l'ancien contenu et l'ajout ou
  // la suppression semblaient réussir.
  const [erreur, setErreur] = useState<string | null>(null);

  const loadBindings = async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(`/api/admin/scoring/bindings?versionId=${versionId}&nodeId=${nodeId}`);
      if (res.ok) {
        const data = await res.json();
        setBindings(data.data || []);
        setErreur(null);
      } else {
        setErreur(await messageErreurApi(res, "Lecture des liaisons impossible."));
      }
    } catch (e) {
      console.error("Load bindings error:", e);
      setErreur("Erreur réseau lors de la lecture des liaisons.");
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
        setErreur(null);
      } else {
        setErreur(await messageErreurApi(res, "Ajout refusé."));
      }
    } catch (e) {
      console.error("Add binding error:", e);
      setErreur("Erreur réseau lors de l'ajout.");
    }
  };

  const handleDeleteBinding = async (bindingId: string) => {
    try {
      const res = await apiDelete(`/api/admin/scoring/bindings?id=${bindingId}`);
      if (res.ok) {
        setBindings(bindings.filter((b) => b.id !== bindingId));
        setErreur(null);
      } else {
        setErreur(await messageErreurApi(res, "Suppression refusée."));
      }
    } catch (e) {
      console.error("Delete binding error:", e);
      setErreur("Erreur réseau lors de la suppression.");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-4">
      {erreur && (
        <p className="rounded-md border border-destructive/40 bg-destructive-subtle px-3 py-2 text-sm text-destructive">
          {erreur}
        </p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {bindings.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune liaison pour ce nœud</p>
        ) : (
          bindings.map((binding) => (
            <div key={binding.id} className="p-3 bg-card rounded border border-border">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="text-foreground font-medium">{binding.sourceEntity}</p>
                  <p className="text-muted-foreground text-xs">{binding.sourceField}</p>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded inline-block mt-1">{binding.bindingMode}</span>
                </div>
                <button
                  onClick={() => handleDeleteBinding(binding.id)}
                  className="p-1 hover:bg-accent rounded text-destructive"
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
          className="w-full px-3 py-2 bg-card border border-input rounded hover:bg-accent text-sm text-secondary-foreground flex items-center gap-2 justify-center"
        >
          <Plus size={16} />
          Ajouter une liaison
        </button>
      )}

      {showForm && (
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="text-sm font-medium text-secondary-foreground">Nouvelle liaison</h4>
          <select
            value={formData.sourceEntity}
            onChange={(e) => setFormData({ ...formData, sourceEntity: e.target.value })}
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
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
            className="w-full px-3 py-2 bg-card border border-input rounded text-foreground text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddBinding}
              disabled={!formData.sourceField}
              className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded text-sm font-medium"
            >
              Créer
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 bg-muted hover:bg-secondary text-foreground rounded text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
