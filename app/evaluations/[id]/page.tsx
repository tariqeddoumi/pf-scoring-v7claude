'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Evaluation {
  id: string;
  projectId: string;
  project?: { nom: string };
  analystId: string;
  analyst?: { nom: string; prenom: string };
  finalScore: number;
  rating: string;
  recommendation: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evalId, setEvalId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setEvalId(id);
        const response = await fetch(`/api/evaluations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch evaluation');
        const data = await response.json();
        setEvaluation(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load evaluation');
        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement de l'évaluation...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-6">
        <Link href="/evaluations" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
          <span>Retour aux évaluations</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || 'Évaluation non trouvée'}
        </div>
      </div>
    );
  }

  const ratingColors: Record<string, string> = {
    'AAA': 'from-green-600 to-green-700',
    'AA': 'from-green-500 to-green-600',
    'A': 'from-blue-500 to-blue-600',
    'BBB': 'from-cyan-500 to-cyan-600',
    'BB': 'from-yellow-500 to-yellow-600',
    'B': 'from-orange-500 to-orange-600',
    'CCC': 'from-red-500 to-red-600',
    'D': 'from-red-700 to-red-800',
  };

  const statusColors: Record<string, string> = {
    'brouillon': 'bg-slate-500/20 text-slate-400',
    'soumis': 'bg-yellow-500/20 text-yellow-400',
    'valide': 'bg-green-500/20 text-green-400',
    'rejete': 'bg-red-500/20 text-red-400',
  };

  const ratingColor = ratingColors[evaluation.rating] || 'from-slate-600 to-slate-700';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/evaluations"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {evaluation.project?.nom || 'Projet inconnu'}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Évaluation • {new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <button className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all">
          <Download size={20} />
          <span>Exporter</span>
        </button>
      </div>

      {/* Score Card */}
      <div className={`rounded-lg bg-gradient-to-br ${ratingColor} p-8 text-white`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Score Global</p>
            <p className="text-4xl font-bold">{evaluation.finalScore.toFixed(2)}</p>
            <p className="text-xs opacity-75 mt-1">/10</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Rating</p>
            <p className="text-4xl font-bold">{evaluation.rating}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Statut</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColors[evaluation.status]}`}>
              {evaluation.status === 'brouillon' ? 'Brouillon' :
               evaluation.status === 'soumis' ? 'Soumis' :
               evaluation.status === 'valide' ? 'Validé' :
               'Rejeté'}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-90 mb-2">Recommandation</p>
            <div className="flex items-center justify-center space-x-2">
              {evaluation.recommendation === 'APPROVE' && <CheckCircle size={24} />}
              {evaluation.recommendation === 'APPROVE_WITH_CONDITIONS' && <AlertCircle size={24} />}
              {evaluation.recommendation === 'REJECT' && <XCircle size={24} />}
              <span className="text-lg font-semibold">
                {evaluation.recommendation === 'APPROVE' ? 'Approuvé' :
                 evaluation.recommendation === 'APPROVE_WITH_CONDITIONS' ? 'Conditionné' :
                 'Rejeté'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Analyste</p>
            <p className="mt-2 text-white">
              {evaluation.analyst
                ? `${evaluation.analyst.prenom} ${evaluation.analyst.nom}`
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Date d'évaluation</p>
            <p className="mt-2 text-white">{new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {evaluation.notes && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Notes</p>
            <p className="text-slate-300">{evaluation.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href={`/evaluations/${evalId}/edit`}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <span>Modifier</span>
        </Link>
        <Link
          href="/evaluations"
          className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>
    </div>
  );
}
