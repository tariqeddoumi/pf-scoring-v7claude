import { useState } from "react";
import { apiPost } from "@/lib/api-client";

/**
 * Ces appels partaient en `fetch` nu, sans en-tête d'autorisation : ils
 * fonctionnaient tant que les routes n'étaient pas protégées. Ils passent par
 * apiPost, qui porte le jeton de session.
 */

interface IntegrationOptions {
  evaluationId: string;
  analyst_email?: string;
  reason?: string;
  project_name?: string;
  manager_email?: string;
}

export function useEvaluationIntegrations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEvaluation = async (options: IntegrationOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost("/api/evaluations/submit", options);
      if (!response.ok) throw new Error("Soumission impossible.");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const validateEvaluation = async (options: IntegrationOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost("/api/evaluations/validate", options);
      if (!response.ok) throw new Error("Validation impossible.");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectEvaluation = async (options: IntegrationOptions) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost("/api/evaluations/reject", options);
      if (!response.ok) throw new Error("Rejet impossible.");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    submitEvaluation,
    validateEvaluation,
    rejectEvaluation,
  };
}

export function useAlertIntegrations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAlert = async (
    options: IntegrationOptions & { type: string; severity: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost("/api/alerts/create", options);
      if (!response.ok) throw new Error("Émission de l'alerte impossible.");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createAlert };
}
