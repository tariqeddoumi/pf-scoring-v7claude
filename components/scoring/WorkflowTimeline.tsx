'use client';

import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, ChevronRight } from 'lucide-react';

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  assignedTo?: string;
  notes?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  currentStep: number;
  status: string;
}

const getStepIcon = (status: string, isCompleted: boolean) => {
  if (status === 'COMPLETED') return <CheckCircle2 className="w-6 h-6 text-success" />;
  if (status === 'FAILED') return <XCircle className="w-6 h-6 text-destructive" />;
  if (status === 'SKIPPED') return <AlertCircle className="w-6 h-6 text-muted-foreground" />;
  if (status === 'IN_PROGRESS') return <Clock className="w-6 h-6 text-primary animate-pulse" />;
  return <Clock className="w-6 h-6 text-muted-foreground" />;
};

const getStepColor = (status: string) => {
  if (status === 'COMPLETED') return 'bg-success/10 border-green-200';
  if (status === 'FAILED') return 'bg-destructive/10 border-red-200';
  if (status === 'SKIPPED') return 'bg-muted border-border';
  if (status === 'IN_PROGRESS') return 'bg-primary/10 border-blue-200';
  return 'bg-white border-border';
};

export function WorkflowTimeline({ steps, currentStep, status }: WorkflowTimelineProps) {
  if (!steps || steps.length === 0) {
    return <div className="text-muted-foreground text-sm">Aucune étape disponible</div>;
  }

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div>{getStepIcon(step.status, idx < currentStep)}</div>
            {idx < steps.length - 1 && (
              <div className={`w-1 h-12 my-2 ${
                step.status === 'COMPLETED' || idx < currentStep
                  ? 'bg-green-300'
                  : 'bg-muted'
              }`} />
            )}
          </div>

          {/* Step content */}
          <div className={`flex-1 p-4 border rounded-lg ${getStepColor(step.status)}`}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm text-foreground">{step.stepName}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Étape {step.stepNumber} • {step.stepType}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                step.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                step.status === 'IN_PROGRESS' ? 'bg-primary/10 text-blue-800' :
                step.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                step.status === 'SKIPPED' ? 'bg-muted text-foreground' :
                'bg-muted text-foreground'
              }`}>
                {step.status === 'COMPLETED' && 'Complétée'}
                {step.status === 'IN_PROGRESS' && 'En cours'}
                {step.status === 'PENDING' && 'En attente'}
                {step.status === 'FAILED' && 'Échouée'}
                {step.status === 'SKIPPED' && 'Ignorée'}
              </span>
            </div>

            {step.notes && (
              <p className="text-sm text-secondary-foreground mt-2">{step.notes}</p>
            )}

            {step.assignedTo && (
              <p className="text-xs text-secondary-foreground mt-2">
                Assignée à: {step.assignedTo}
              </p>
            )}

            {step.completedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Complétée: {new Date(step.completedAt).toLocaleString('fr-FR')}
              </p>
            )}

            {step.dueDate && !step.completedAt && (
              <p className="text-xs text-orange-600 mt-2">
                Échéance: {new Date(step.dueDate).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
