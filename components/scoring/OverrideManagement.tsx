'use client';

import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export interface OverrideRecord {
  id: string;
  nodeId: string;
  nodeName?: string;
  originalScore?: number;
  overriddenScore?: number;
  reason: string;
  justification?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERTED';
  overriddenBy: string;
  overriddenByName?: string;
  overriddenAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
}

interface OverrideManagementProps {
  evaluationId: string;
  overrides: OverrideRecord[];
  onCreateOverride?: (data: any) => Promise<void>;
  onApproveOverride?: (overrideId: string) => Promise<void>;
  onRejectOverride?: (overrideId: string) => Promise<void>;
  onDeleteOverride?: (overrideId: string) => Promise<void>;
  isLoading?: boolean;
  nodes?: Array<{ id: string; label: string; code: string }>;
}

const RISK_LEVEL_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  APPROVED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-500" />,
  REVERTED: <XCircle className="w-4 h-4 text-gray-500" />
};

export function OverrideManagement({
  evaluationId,
  overrides,
  onCreateOverride,
  onApproveOverride,
  onRejectOverride,
  onDeleteOverride,
  isLoading = false,
  nodes = []
}: OverrideManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nodeId: '',
    reason: '',
    justification: '',
    riskLevel: 'MEDIUM' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.nodeId) newErrors.nodeId = 'Nœud requis';
    if (!formData.reason.trim()) newErrors.reason = 'Raison requise';
    if (!formData.riskLevel) newErrors.riskLevel = 'Niveau de risque requis';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onCreateOverride) {
        await onCreateOverride({
          evaluationId,
          ...formData
        });
        setShowForm(false);
        setFormData({
          nodeId: '',
          reason: '',
          justification: '',
          riskLevel: 'MEDIUM'
        });
      }
    } catch (error) {
      console.error('Failed to create override:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overrides Summary */}
      {overrides.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{overrides.length}</p>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-medium text-gray-600">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {overrides.filter(o => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-medium text-gray-600">Approuvées</p>
            <p className="text-2xl font-bold text-green-600">
              {overrides.filter(o => o.status === 'APPROVED').length}
            </p>
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-medium text-gray-600">Rejetées</p>
            <p className="text-2xl font-bold text-red-600">
              {overrides.filter(o => o.status === 'REJECTED').length}
            </p>
          </div>
        </div>
      )}

      {/* Overrides List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Surcharges {overrides.length > 0 && `(${overrides.length})`}
          </h3>
          {onCreateOverride && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une surcharge
            </button>
          )}
        </div>

        {overrides.length === 0 && !showForm && (
          <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucune surcharge de score</p>
          </div>
        )}

        {/* Overrides Table */}
        {overrides.length > 0 && (
          <div className="space-y-3">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {override.nodeName || override.nodeId}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${RISK_LEVEL_COLORS[override.riskLevel]}`}>
                        Risque {override.riskLevel}
                      </span>
                      <div className="flex items-center gap-1">
                        {STATUS_ICONS[override.status]}
                        <span className="text-xs text-gray-600">
                          {override.status === 'PENDING' && 'En attente'}
                          {override.status === 'APPROVED' && 'Approuvée'}
                          {override.status === 'REJECTED' && 'Rejetée'}
                          {override.status === 'REVERTED' && 'Annulée'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      {override.originalScore !== undefined && (
                        <div>
                          <p className="text-xs text-gray-600">Score original</p>
                          <p className="font-medium text-gray-900">{override.originalScore.toFixed(1)}</p>
                        </div>
                      )}
                      {override.overriddenScore !== undefined && (
                        <div>
                          <p className="text-xs text-gray-600">Score surchargé</p>
                          <p className="font-medium text-gray-900">{override.overriddenScore.toFixed(1)}</p>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Raison:</span> {override.reason}
                    </p>

                    {override.justification && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Justification:</span> {override.justification}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Créée par {override.overriddenByName} le{' '}
                        {new Date(override.overriddenAt).toLocaleDateString('fr-FR')}</span>
                      {override.approvedAt && (
                        <span>Approuvée par {override.approvedByName} le{' '}
                          {new Date(override.approvedAt).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>

                  {override.status === 'PENDING' && (
                    <div className="flex gap-2 flex-shrink-0">
                      {onApproveOverride && (
                        <button
                          onClick={() => onApproveOverride(override.id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 disabled:opacity-50 transition-colors"
                        >
                          Approuver
                        </button>
                      )}
                      {onRejectOverride && (
                        <button
                          onClick={() => onRejectOverride(override.id)}
                          disabled={isLoading}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                        >
                          Rejeter
                        </button>
                      )}
                    </div>
                  )}

                  {onDeleteOverride && override.status === 'REJECTED' && (
                    <button
                      onClick={() => onDeleteOverride(override.id)}
                      disabled={isLoading}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Override Form */}
      {showForm && onCreateOverride && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">Créer une surcharge</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nœud de scoring
              </label>
              <select
                value={formData.nodeId}
                onChange={(e) => setFormData({ ...formData, nodeId: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nodeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Sélectionner un nœud --</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label} ({node.code})
                  </option>
                ))}
              </select>
              {errors.nodeId && <p className="text-red-500 text-xs mt-1">{errors.nodeId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Raison de la surcharge..."
              />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justification
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Justification détaillée..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de risque
              </label>
              <select
                value={formData.riskLevel}
                onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Bas</option>
                <option value="MEDIUM">Moyen</option>
                <option value="HIGH">Élevé</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting || isLoading ? 'Création...' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
