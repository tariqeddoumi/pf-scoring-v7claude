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
import { api } from "../api-client";
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
      const data = await api.evaluations.list();
      // L'API retourne { success: true, data: [...] } ou directement un tableau
      const list = (data as { data?: Evaluation[] })?.data ?? (data as Evaluation[]);
      setEvaluations(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
      // Fallback : lire depuis localStorage si l'API est indisponible
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

  /**
   * Crée une nouvelle évaluation et l'ajoute à la liste locale.
   * @param data - Données de l'évaluation (projectId, notes, etc.)
   */
  async function createEvaluation(data: Partial<Evaluation>): Promise<Evaluation> {
    const result = await api.evaluations.create(data);
    const newEval = ((result as { data?: Evaluation })?.data ?? result) as Evaluation;
    setEvaluations((prev) => [...prev, newEval]);
    return newEval;
  }

  /**
   * Met à jour une évaluation existante dans la liste locale.
   * @param id   - Identifiant de l'évaluation
   * @param data - Champs à modifier
   */
  async function updateEvaluation(id: string, data: Partial<Evaluation>): Promise<Evaluation> {
    const result = await api.evaluations.update(id, data);
    const updated = ((result as { data?: Evaluation })?.data ?? result) as Evaluation;
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
