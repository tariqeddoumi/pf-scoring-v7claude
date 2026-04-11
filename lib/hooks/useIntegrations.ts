import { useState } from "react";

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
      const response = await fetch("/api/evaluations/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error("Failed to submit");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
      const response = await fetch("/api/evaluations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error("Failed to validate");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
      const response = await fetch("/api/evaluations/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error("Failed to reject");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
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
      const response = await fetch("/api/alerts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error("Failed to create alert");
      return await response.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createAlert };
}
