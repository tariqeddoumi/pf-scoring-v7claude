import { useState, useEffect } from 'react';
import { api } from '../api-client';
import { Evaluation } from '@/types/database';

export function useEvaluationAPI() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    try {
      setLoading(true);
      const data = await api.evaluations.list();
      setEvaluations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('pf_evaluations');
      if (stored) setEvaluations(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  }

  async function createEvaluation(data: any) {
    try {
      const newEval = await api.evaluations.create(data);
      setEvaluations([...evaluations, newEval]);
      return newEval;
    } catch (err) {
      throw err;
    }
  }

  async function updateEvaluation(id: string, data: any) {
    try {
      const updated = await api.evaluations.update(id, data);
      setEvaluations(evaluations.map(e => (e.id === id ? updated : e)));
      return updated;
    } catch (err) {
      throw err;
    }
  }

  return { evaluations, loading, error, createEvaluation, updateEvaluation, fetchEvaluations };
}
