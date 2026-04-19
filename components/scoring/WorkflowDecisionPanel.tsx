'use client';

import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export interface DecisionFormData {
  decisionType: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'CONDITIONAL_APPROVAL' | 'REJECT';
  riskRating: string;
  justification: string;
  recommendation?: string;
  hasConditions?: boolean;
  conditionsJson?: string;
  requiresHigherApproval?: boolean;
}

interface WorkflowDecisionPanelProps {
  workflowId: string;
  onSubmit: (data: DecisionFormData) => Promise<void>;
  isLoading?: boolean;
  riskRatings?: string[];
}

const RISK_RATINGS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D'];

const DECISION_TYPES = [
  { value: 'APPROVE', label: 'Approuver', color: 'bg-green-100 border-green-300' },
  { value: 'APPROVE_WITH_CONDITIONS', label: 'Approuver avec conditions', color: 'bg-blue-100 border-blue-300' },
  { value: 'CONDITIONAL_APPROVAL', label: 'Approbation conditionnelle', color: 'bg-yellow-100 border-yellow-300' },
  { value: 'REJECT', label: 'Rejeter', color: 'bg-red-100 border-red-300' }
];

export function WorkflowDecisionPanel({
  workflowId,
  onSubmit,
  isLoading = false,
  riskRatings = RISK_RATINGS
}: WorkflowDecisionPanelProps) {
  const [formData, setFormData] = useState<DecisionFormData>({
    decisionType: 'APPROVE',
    riskRating: 'BBB',
    justification: '',
    requiresHigherApproval: false,
    hasConditions: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.justification.trim()) {
      newErrors.justification = 'Justification requise';
    }
    if (!formData.riskRating) {
      newErrors.riskRating = 'Rating de risque requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Decision submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Décision de Scoring</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Decision Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type de décision
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DECISION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, decisionType: type.value as any })}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                  formData.decisionType === type.value
                    ? type.color + ' border-current'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note de risque (Grade)
          </label>
          <select
            value={formData.riskRating}
            onChange={(e) => setFormData({ ...formData, riskRating: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.riskRating ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {riskRatings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
          {errors.riskRating && (
            <p className="text-red-500 text-xs mt-1">{errors.riskRating}</p>
          )}
        </div>

        {/* Justification */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Justification *
          </label>
          <textarea
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              errors.justification ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={4}
            placeholder="Fournir une justification détaillée de la décision..."
          />
          {errors.justification && (
            <p className="text-red-500 text-xs mt-1">{errors.justification}</p>
          )}
        </div>

        {/* Recommendation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recommandation (optionnel)
          </label>
          <textarea
            value={formData.recommendation || ''}
            onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Recommandations supplémentaires pour les prochaines étapes..."
          />
        </div>

        {/* Conditions */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hasConditions}
              onChange={(e) => setFormData({ ...formData, hasConditions: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Il y a des conditions à l'approbation
            </span>
          </label>

          {formData.hasConditions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conditions (une par ligne)
              </label>
              <textarea
                value={formData.conditionsJson || ''}
                onChange={(e) => setFormData({ ...formData, conditionsJson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                placeholder="Ex: Fournir les états financiers trimestriels&#10;Installer un système de monitoring..."
              />
            </div>
          )}
        </div>

        {/* Higher Approval */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={formData.requiresHigherApproval || false}
              onChange={(e) => setFormData({ ...formData, requiresHigherApproval: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Escalade requise pour approbation supérieure
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <Send className="w-4 h-4" />
            {isSubmitting || isLoading ? 'Envoi...' : 'Soumettre la décision'}
          </button>
        </div>
      </form>
    </div>
  );
}
