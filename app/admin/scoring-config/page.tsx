'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Save, RotateCcw, TrendingUp, Check } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DomainConfig {
  id: string;
  code: string;
  label: string;
  description: string;
  weight: number;
  isActive: boolean;
}

interface ScoringConfig {
  domains: DomainConfig[];
  noGoThresholds: {
    dscr: number;
    equity: number;
    leverage: number;
  };
}

const DEFAULT_THRESHOLDS = { dscr: 1.1, equity: 20, leverage: 95 };

export default function ScoringConfigPage() {
  const [config, setConfig] = useState<ScoringConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/scoring-config');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setConfig(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-white">Configuration du Scoring</h1>
        </div>
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">{error || 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  const totalWeight = config.domains.reduce((sum, d) => sum + d.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  const handleWeightChange = (id: string, newWeight: number) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        domains: prev.domains.map(d =>
          d.id === id ? { ...d, weight: Math.max(0, Math.min(100, newWeight)) } : d
        ),
      };
    });
    setSaved(false);
    setError('');
  };

  const handleNoGoChange = (key: keyof typeof config.noGoThresholds, value: number) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        noGoThresholds: { ...prev.noGoThresholds, [key]: value },
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!isWeightValid) {
      setError(`La somme des poids doit égaler 100% (actuellement: ${totalWeight.toFixed(1)}%)`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/scoring-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domains: config.domains.map(d => ({ id: d.id, weight: d.weight })),
          noGoThresholds: config.noGoThresholds,
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Réinitialiser les seuils NO-GO par défaut ?')) {
      setConfig(prev => prev ? { ...prev, noGoThresholds: DEFAULT_THRESHOLDS } : prev);
      setSaved(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Configuration du Scoring</h1>
          <p className="text-slate-400 mt-1">Personnalisez les poids des domaines et les seuils NO-GO</p>
        </div>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 flex items-center gap-2 text-green-400">
          <Check size={18} /> Configuration sauvegardée en base de données
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Domain Weights Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <TrendingUp size={24} />
          <span>Poids des Domaines</span>
        </h2>

        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Somme totale des poids:</span>
            <span className={`text-2xl font-bold ${isWeightValid ? 'text-green-400' : 'text-red-400'}`}>
              {totalWeight.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full ${isWeightValid ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {config.domains.map(domain => (
            <div key={domain.id} className="bg-slate-700 rounded-lg p-4">
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{domain.code}: {domain.label}</h3>
                    <p className="text-sm text-slate-400">{domain.description}</p>
                  </div>
                  <span className="text-2xl font-bold text-cyan-400">{domain.weight}%</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={0.5}
                  value={domain.weight}
                  onChange={(e) => handleWeightChange(domain.id, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={domain.weight}
                  onChange={(e) => handleWeightChange(domain.id, parseFloat(e.target.value))}
                  className="w-20 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm text-center focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NO-GO Thresholds Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Seuils NO-GO</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-700 rounded-lg p-4">
            <label className="text-sm font-semibold text-white block mb-3">DSCR Minimum</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.1"
                value={config.noGoThresholds.dscr}
                onChange={(e) => handleNoGoChange('dscr', parseFloat(e.target.value))}
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-400">x</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Ratio couverture dette minimum</p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <label className="text-sm font-semibold text-white block mb-3">Equity Minimum</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="1"
                value={config.noGoThresholds.equity}
                onChange={(e) => handleNoGoChange('equity', parseFloat(e.target.value))}
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Fonds propres minimum</p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <label className="text-sm font-semibold text-white block mb-3">Leverage Maximum</label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="1"
                value={config.noGoThresholds.leverage}
                onChange={(e) => handleNoGoChange('leverage', parseFloat(e.target.value))}
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Ratio d'endettement maximum</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={!isWeightValid || saving}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>{saving ? 'Sauvegarde...' : 'Enregistrer la Configuration'}</span>
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Réinitialiser Seuils</span>
        </button>
      </div>
    </div>
  );
}
