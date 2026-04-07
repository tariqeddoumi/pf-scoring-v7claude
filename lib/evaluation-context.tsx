'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type EvaluationStatus = 'brouillon' | 'soumis' | 'valide' | 'rejete';

export interface EvaluationWorkflow {
  id: string;
  projectId: string;
  status: EvaluationStatus;
  createdAt: Date;
  submittedAt?: Date;
  validatedAt?: Date;
  rejectionReason?: string;
  submittedBy?: string;
  validatedBy?: string;
  history: WorkflowEvent[];
}

export interface WorkflowEvent {
  timestamp: Date;
  status: EvaluationStatus;
  user: string;
  action: string;
  reason?: string;
}

interface EvaluationContextType {
  workflow: EvaluationWorkflow | null;
  evaluations?: Record<string, EvaluationWorkflow>;
  createEvaluation: (projectId: string, user: string) => EvaluationWorkflow;
  submitEvaluation: (evaluationId: string, user: string) => Promise<boolean>;
  validateEvaluation: (evaluationId: string, user: string) => Promise<boolean>;
  rejectEvaluation: (evaluationId: string, user: string, reason: string) => Promise<boolean>;
  getEvaluation: (evaluationId: string) => EvaluationWorkflow | null;
  updateEvaluationStatus: (evaluationId: string, data: Partial<EvaluationWorkflow>) => void;
  canTransition: (from: EvaluationStatus, to: EvaluationStatus) => boolean;
  getTransitionError: (from: EvaluationStatus, to: EvaluationStatus) => string | null;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

// Validation rules for state transitions
const TRANSITION_RULES: Record<EvaluationStatus, EvaluationStatus[]> = {
  brouillon: ['soumis', 'rejete'],
  soumis: ['valide', 'rejete', 'brouillon'],
  valide: ['rejete'],
  rejete: ['brouillon'],
};

const TRANSITION_DESCRIPTIONS: Record<string, string> = {
  'brouillon:soumis': 'Soumission pour validation',
  'soumis:valide': 'Validation complète',
  'soumis:rejete': 'Rejet pour révision',
  'valide:rejete': 'Rejet après validation',
  'brouillon:rejete': 'Rejet du brouillon',
  'rejete:brouillon': 'Retour en édition',
  'soumis:brouillon': 'Retour en édition',
};

const STORAGE_KEY = 'pf_evaluations_workflow';

export function EvaluationProvider({ children }: { children: React.ReactNode }) {
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationWorkflow>>({});
  const [currentWorkflow, setCurrentWorkflow] = useState<EvaluationWorkflow | null>(null);

  // Load evaluations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const parsed: Record<string, EvaluationWorkflow> = {};
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          parsed[key] = {
            ...value,
            createdAt: new Date(value.createdAt),
            submittedAt: value.submittedAt ? new Date(value.submittedAt) : undefined,
            validatedAt: value.validatedAt ? new Date(value.validatedAt) : undefined,
            history: value.history.map((h: any) => ({
              ...h,
              timestamp: new Date(h.timestamp),
            })),
          };
        });
        setEvaluations(parsed);
      }
    } catch (error) {
    }
  }, []);

  // Save evaluations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
    } catch (error) {
    }
  }, [evaluations]);

  const canTransition = (from: EvaluationStatus, to: EvaluationStatus): boolean => {
    return TRANSITION_RULES[from]?.includes(to) ?? false;
  };

  const getTransitionError = (from: EvaluationStatus, to: EvaluationStatus): string | null => {
    if (from === to) return 'État identique';
    if (!canTransition(from, to)) {
      return `Transition non autorisée: ${from} → ${to}`;
    }
    return null;
  };

  const createEvaluation = (projectId: string, user: string): EvaluationWorkflow => {
    const id = `ev_${Date.now()}`;
    const now = new Date();

    const newWorkflow: EvaluationWorkflow = {
      id,
      projectId,
      status: 'brouillon',
      createdAt: now,
      history: [
        {
          timestamp: now,
          status: 'brouillon',
          user,
          action: 'Création de l\'évaluation',
        },
      ],
    };

    setEvaluations(prev => ({
      ...prev,
      [id]: newWorkflow,
    }));

    return newWorkflow;
  };

  const submitEvaluation = async (evaluationId: string, user: string): Promise<boolean> => {
    const evaluation = evaluations[evaluationId];
    if (!evaluation) {
      return false;
    }

    if (!canTransition(evaluation.status, 'soumis')) {
      return false;
    }

    const now = new Date();
    const updated: EvaluationWorkflow = {
      ...evaluation,
      status: 'soumis',
      submittedAt: now,
      submittedBy: user,
      history: [
        ...evaluation.history,
        {
          timestamp: now,
          status: 'soumis',
          user,
          action: 'Soumission pour validation',
        },
      ],
    };

    setEvaluations(prev => ({
      ...prev,
      [evaluationId]: updated,
    }));

    setCurrentWorkflow(updated);
    return true;
  };

  const validateEvaluation = async (evaluationId: string, user: string): Promise<boolean> => {
    const evaluation = evaluations[evaluationId];
    if (!evaluation) return false;

    if (!canTransition(evaluation.status, 'valide')) {
      return false;
    }

    const now = new Date();
    const updated: EvaluationWorkflow = {
      ...evaluation,
      status: 'valide',
      validatedAt: now,
      validatedBy: user,
      history: [
        ...evaluation.history,
        {
          timestamp: now,
          status: 'valide',
          user,
          action: 'Validation complète',
        },
      ],
    };

    setEvaluations(prev => ({
      ...prev,
      [evaluationId]: updated,
    }));

    setCurrentWorkflow(updated);
    return true;
  };

  const rejectEvaluation = async (
    evaluationId: string,
    user: string,
    reason: string
  ): Promise<boolean> => {
    const evaluation = evaluations[evaluationId];
    if (!evaluation) return false;

    if (!canTransition(evaluation.status, 'rejete')) {
      return false;
    }

    const now = new Date();
    const updated: EvaluationWorkflow = {
      ...evaluation,
      status: 'rejete',
      rejectionReason: reason,
      history: [
        ...evaluation.history,
        {
          timestamp: now,
          status: 'rejete',
          user,
          action: 'Rejet',
          reason,
        },
      ],
    };

    setEvaluations(prev => ({
      ...prev,
      [evaluationId]: updated,
    }));

    setCurrentWorkflow(updated);
    return true;
  };

  const getEvaluation = (evaluationId: string): EvaluationWorkflow | null => {
    return evaluations[evaluationId] ?? null;
  };

  const updateEvaluationStatus = (evaluationId: string, data: Partial<EvaluationWorkflow>) => {
    setEvaluations(prev => ({
      ...prev,
      [evaluationId]: {
        ...prev[evaluationId],
        ...data,
      },
    }));
  };

  return (
    <EvaluationContext.Provider
      value={{
        workflow: currentWorkflow,
        evaluations,
        createEvaluation,
        submitEvaluation,
        validateEvaluation,
        rejectEvaluation,
        getEvaluation,
        updateEvaluationStatus,
        canTransition,
        getTransitionError,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluationWorkflow() {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluationWorkflow must be used within EvaluationProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useEvaluation = useEvaluationWorkflow;
