/**
 * Hook React pour la gestion des évaluations côté client.
 *
 * POURQUOI UN HOOK ? (pour débutants)
 * -------------------------------------------
 * Un hook React encapsule de la logique réutilisable (état + effets + appels API).
 * Au lieu de copier-coller le code de chargement des évaluations dans chaque page,
 * on l'écrit ici une seule fois et on l'utilise partout avec useEvaluationAPI().
 *
 * UTILISATION dans une page :
 *   const { evaluations, loading, error, createEvaluation } = useEvaluationAPI();
 */

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { Evaluation } from "@/types/database";

export function useEvaluationAPI() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les évaluations au montage du composant
  useEffect(() => {
    fetchEvaluations();
  }, []);

  /**
   * Charge toutes les évaluations depuis l'API.
   * En cas d'erreur réseau, essaie de lire depuis le localStorage (mode offline).
   */
  async function fetchEvaluations(): Promise<void> {
    try {
      setLoading(true);
      const res = await apiGet("/api/evaluations");
      const json = await res.json();
      const list = json.data || json;
      setEvaluations(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      const stored = localStorage.getItem("pf_evaluations");
      if (stored) {
        try {
          setEvaluations(JSON.parse(stored) as Evaluation[]);
        } catch {
          // localStorage corrompu : on ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function createEvaluation(data: Partial<Evaluation>): Promise<Evaluation> {
    const res = await apiPost("/api/evaluations", data);
    const json = await res.json();
    const newEval = (json.data ?? json) as Evaluation;
    setEvaluations((prev) => [...prev, newEval]);
    return newEval;
  }

  async function updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation> {
    const res = await apiPost(`/api/evaluations/${id}`, data);
    const json = await res.json();
    const updated = (json.data ?? json) as Evaluation;
    setEvaluations((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  }

  return {
    evaluations,
    loading,
    error,
    createEvaluation,
    updateEvaluation,
    fetchEvaluations,
  };
}
