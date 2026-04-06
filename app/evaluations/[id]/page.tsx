'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Check, AlertCircle, TrendingUp, ChevronRight, X } from 'lucide-react';
import { useEvaluationWorkflow, type EvaluationStatus } from '@/lib/evaluation-context';

const MOCK_EVALUATION = {
  id: 'ev1',
  projectId: 'p1',
  projectName: 'Parc Éolien Taourirt',
  type: 'Initiale',
  date: '2026-03-15',
  analyst: 'Ahmed Ben Selhami',
  status: 'Validé',
  modelVersion: 'V7++',
  globalScore: 8.08,
  rating: 'A',
  pdRange: { min: 0.1, max: 0.3 },
  riskClass: 'Modéré',
  noGo: false,
  noGoReasons: [] as string[],
  recommendation: '✅ Favorable',
  redFlags: [],
  strengths: ['✅ D1 (Sponsor): 8.5/10', '✅ D3 (Construction): 8.2/10', '✅ D7 (Financement): 8.1/10'],
  weaknesses: ['⚠️ D4 (Marché): 6.8/10'],
  domainScores: [
    { id: 'D1', name: 'Sponsor & Shareholders', score: 8.5, weight: 10 },
    { id: 'D2', name: 'Project Characteristics', score: 7.2, weight: 10 },
    { id: 'D3', name: 'Construction Risk', score: 8.2, weight: 15 },
    { id: 'D4', name: 'Market Risk', score: 6.8, weight: 10 },
    { id: 'D5', name: 'Operational Risk', score: 8.0, weight: 10 },
    { id: 'D6', name: 'Counterparty Risk', score: 7.9, weight: 10 },
    { id: 'D7', name: 'Financial Structure', score: 8.1, weight: 15 },
    { id: 'D8', name: 'Legal & Documentation', score: 8.3, weight: 10 },
    { id: 'D9', name: 'ESG & Climate', score: 8.0, weight: 10 },
  ],
};

export default function EvaluationDetailPage({ params }: { params: { id: string } }) {
  const colors = {
    AAA: 'from-green-600 to-green-700',
    AA: 'from-green-500 to-green-600',
    A: 'from-blue-500 to-blue-600',
    BBB: 'from-cyan-500 to-cyan-600',
    BB: 'from-yellow-500 to-yellow-600',
    B: 'from-red-500 to-red-600',
  };

  const ratingColor = colors[MOCK_EVALUATION.rating as keyof typeof colors] || colors.B;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/evaluations" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{MOCK_EVALUATION.projectName}</h1>
            <p className="text-slate-400 mt-1">{MOCK_EVALUATION.type} • {MOCK_EVALUATION.date} • Par {MOCK_EVALUATION.analyst}</p>
          </div>
        </div>
        <button className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          <Download size={20} />
          <span>Exporter PDF</span>
        </button>
      </div>

      {/* SCORE GLOBAL */}
      <div className={`rounded-lg bg-gradient-to-br ${ratingColor} p-8 text-white`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Score Global</p>
            <p className="text-4xl font-bold">{MOCK_EVALUATION.globalScore}</p>
            <p className="text-xs opacity-75 mt-1">/10</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Rating</p>
            <p className="text-4xl font-bold">{MOCK_EVALUATION.rating}</p>
            <p className="text-xs opacity-75 mt-1">{MOCK_EVALUATION.riskClass}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">PD Indicative</p>
            <p className="text-xl font-bold">{MOCK_EVALUATION.pdRange.min}% - {MOCK_EVALUATION.pdRange.max}%</p>
            <p className="text-xs opacity-75 mt-1">Probabilité défaut</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Recommandation</p>
            <p className="text-2xl font-bold">{MOCK_EVALUATION.recommendation}</p>
            <p className="text-xs opacity-75 mt-1">Attribution</p>
          </div>
        </div>
      </div>

      {/* SCORES PAR DOMAINE */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Scores par Domaine</h2>

        <div className="space-y-3">
          {MOCK_EVALUATION.domainScores.map((domain) => (
            <div key={domain.id} className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-white">{domain.id}: {domain.name}</p>
                  <p className="text-sm text-slate-400">Poids: {domain.weight}%</p>
                </div>
                <span className="text-2xl font-bold text-cyan-400">{domain.score}/10</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                  style={{ width: `${(domain.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORCES ET FAIBLESSES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Check size={24} className="text-green-400" />
            <span>Points Forts</span>
          </h2>
          <div className="space-y-3">
            {MOCK_EVALUATION.strengths.map((strength, i) => (
              <p key={i} className="text-white bg-slate-700 rounded px-3 py-2 text-sm">
                {strength}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <AlertCircle size={24} className="text-yellow-400" />
            <span>Points à Surveiller</span>
          </h2>
          <div className="space-y-3">
            {MOCK_EVALUATION.weaknesses.length > 0 ? (
              MOCK_EVALUATION.weaknesses.map((weakness, i) => (
                <p key={i} className="text-white bg-slate-700 rounded px-3 py-2 text-sm">
                  {weakness}
                </p>
              ))
            ) : (
              <p className="text-slate-400 italic">Aucun point faible majeur identifié</p>
            )}
          </div>
        </div>
      </div>

      {/* WORKFLOW - DYNAMIC */}
      <WorkflowSection evaluationId={params.id} />

      {/* ACTIONS - DYNAMIC */}
      <ActionButtons evaluationId={params.id} />
    </div>
  );
}

// ============ WORKFLOW COMPONENT ============
function WorkflowSection({ evaluationId }: { evaluationId: string }) {
  const { getEvaluation } = useEvaluationWorkflow();
  const [workflow, setWorkflow] = useState<any>(null);

  useEffect(() => {
    const evaluation = getEvaluation(evaluationId);
    setWorkflow(evaluation);
  }, [evaluationId, getEvaluation]);

  if (!workflow) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <p className="text-slate-400">Chargement du workflow...</p>
      </div>
    );
  }

  const statusColors: Record<EvaluationStatus, string> = {
    brouillon: 'text-yellow-400 bg-yellow-500/20',
    soumis: 'text-blue-400 bg-blue-500/20',
    valide: 'text-green-400 bg-green-500/20',
    rejete: 'text-red-400 bg-red-500/20',
  };

  const statusLabels: Record<EvaluationStatus, string> = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    valide: 'Validé',
    rejete: 'Rejeté',
  };

  const getStatusPosition = (status: EvaluationStatus): number => {
    const positions = { brouillon: 0, soumis: 1, valide: 2, rejete: 3 };
    return positions[status];
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Workflow d'Évaluation</h2>

      {/* Timeline */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {(['brouillon', 'soumis', 'valide'] as EvaluationStatus[]).map((status, idx) => {
            const isCompleted = getStatusPosition(status) < getStatusPosition(workflow.status);
            const isCurrent = status === workflow.status;

            return (
              <div key={status} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted || isCurrent
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                  } ${isCurrent ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <p className={`mt-2 font-semibold text-sm ${isCompleted || isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {statusLabels[status]}
                </p>
                {idx < 2 && (
                  <div className={`absolute w-12 h-0.5 mt-5 ml-24 ${isCompleted ? 'bg-green-500' : 'bg-slate-600'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Special status: Rejeté */}
        {workflow.status === 'rejete' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 font-semibold">Statut: Rejeté</p>
            {workflow.rejectionReason && (
              <p className="text-red-300 text-sm mt-2">Motif: {workflow.rejectionReason}</p>
            )}
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="font-semibold text-white mb-4">Historique des Transitions</h3>
        {workflow.history.map((event: any, idx: number) => {
          const status = (event.status as EvaluationStatus) || 'brouillon';
          return (
          <div key={idx} className="bg-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
                    {statusLabels[status]}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {new Date(event.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-white font-semibold">{event.action}</p>
                <p className="text-slate-400 text-sm mt-1">Par: {event.user}</p>
                {event.reason && (
                  <p className="text-slate-300 text-sm mt-2">Motif: {event.reason}</p>
                )}
              </div>
            </div>
          </div>
        );
        }
        )}
      </div>
    </div>
  );
}

// ============ ACTIONS COMPONENT ============
function ActionButtons({ evaluationId }: { evaluationId: string }) {
  const { getEvaluation, submitEvaluation, validateEvaluation, rejectEvaluation, canTransition } =
    useEvaluationWorkflow();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const evaluation = getEvaluation(evaluationId);
    setWorkflow(evaluation);
  }, [evaluationId, getEvaluation]);

  if (!workflow) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const success = await submitEvaluation(evaluationId, 'Utilisateur Actuel');
      if (success) {
        setMessage('✅ Évaluation soumise avec succès');
        setWorkflow(getEvaluation(evaluationId));
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    setMessage('');
    try {
      const success = await validateEvaluation(evaluationId, 'Manager Risk');
      if (success) {
        setMessage('✅ Évaluation validée avec succès');
        setWorkflow(getEvaluation(evaluationId));
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setMessage('⚠️ Veuillez indiquer un motif de rejet');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const success = await rejectEvaluation(evaluationId, 'Manager Risk', rejectReason);
      if (success) {
        setMessage('✅ Évaluation rejetée');
        setShowRejectModal(false);
        setRejectReason('');
        setWorkflow(getEvaluation(evaluationId));
      }
    } catch (error) {
      setMessage('❌ Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-lg p-4 text-center font-semibold ${
          message.startsWith('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-4">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all">
          ✏️ Modifier
        </button>

        {/* Submit Button (only if brouillon) */}
        {canTransition(workflow.status, 'soumis') && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-all"
          >
            {loading ? 'Soumission...' : '🔄 Soumettre'}
          </button>
        )}

        {/* Validate Button (only if soumis) */}
        {canTransition(workflow.status, 'valide') && (
          <button
            onClick={handleValidate}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-all"
          >
            {loading ? 'Validation...' : '✓ Valider'}
          </button>
        )}

        {/* Reject Button (if soumis or valide) */}
        {(canTransition(workflow.status, 'rejete')) && (
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
          >
            ✗ Rejeter
          </button>
        )}

        <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all">
          📊 Comparer
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Rejeter l'Évaluation</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indiquez le motif du rejet..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              rows={4}
            />

            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                {loading ? 'Rejet...' : 'Confirmer le Rejet'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
