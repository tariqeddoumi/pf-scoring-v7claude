"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Save, RotateCcw, TrendingUp } from "lucide-react";

interface ScoringConfig {
  domains: DomainConfig[];
  noGoThresholds: {
    dscr: number;
    equity: number;
    leverage: number;
  };
  pdRanges: Record<string, { min: number; max: number }>;
}

interface DomainConfig {
  id: string;
  name: string;
  weight: number;
  minWeight: number;
  maxWeight: number;
  description: string;
}

const DEFAULT_CONFIG: ScoringConfig = {
  domains: [
    {
      id: "D1",
      name: "Sponsor & Actionnaires",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Qualité et stabilité du sponsor",
    },
    {
      id: "D2",
      name: "Caractéristiques Projet",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Profil technique et commercial",
    },
    {
      id: "D3",
      name: "Risque Construction",
      weight: 15,
      minWeight: 10,
      maxWeight: 20,
      description: "EPC et gestion construction",
    },
    {
      id: "D4",
      name: "Risque Marché",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Demand et contrats",
    },
    {
      id: "D5",
      name: "Risque Opérationnel",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "O&M et exploitation",
    },
    {
      id: "D6",
      name: "Risque Contrepartie",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Qualité acheteur/off-taker",
    },
    {
      id: "D7",
      name: "Structure Financière",
      weight: 15,
      minWeight: 10,
      maxWeight: 20,
      description: "Financement et gestion",
    },
    {
      id: "D8",
      name: "Risque Juridique",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Documentation et contrats",
    },
    {
      id: "D9",
      name: "ESG & Climat",
      weight: 10,
      minWeight: 5,
      maxWeight: 15,
      description: "Environnement, social, gouvernance",
    },
  ],
  noGoThresholds: {
    dscr: 1.1,
    equity: 20,
    leverage: 95,
  },
  pdRanges: {
    AAA: { min: 0, max: 0.1 },
    AA: { min: 0.1, max: 0.3 },
    A: { min: 0.3, max: 0.6 },
    BBB: { min: 0.6, max: 1.2 },
    BB: { min: 1.2, max: 2.5 },
    B: { min: 2.5, max: 5 },
  },
};

const STORAGE_KEY = "pf_scoring_config";

export default function ScoringConfigPage() {
  const [config, setConfig] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  }, []);

  const totalWeight = config.domains.reduce((sum, d) => sum + d.weight, 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (id: string, newWeight: number) => {
    setConfig((prev) => ({
      ...prev,
      domains: prev.domains.map((d) =>
        d.id === id
          ? {
              ...d,
              weight: Math.max(d.minWeight, Math.min(d.maxWeight, newWeight)),
            }
          : d
      ),
    }));
    setSaved(false);
    setError("");
  };

  const handleNoGoChange = (
    key: keyof typeof config.noGoThresholds,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      noGoThresholds: { ...prev.noGoThresholds, [key]: value },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!isWeightValid) {
      setError(
        `La somme des poids doit égaler 100% (actuellement: ${totalWeight}%)`
      );
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir réinitialiser la configuration par défaut ?"
      )
    ) {
      setConfig(DEFAULT_CONFIG);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Configuration du Scoring
        </h1>
        <p className="text-slate-400 mt-2">
          Personnalisez les poids des domaines et les seuils NO-GO
        </p>
      </div>

      {/* Alerts */}
      {saved && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-green-400">
          ✅ Configuration sauvegardée avec succès
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start space-x-3">
          <AlertCircle
            size={20}
            className="text-red-400 flex-shrink-0 mt-0.5"
          />
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
            <span
              className={`text-2xl font-bold ${isWeightValid ? "text-green-400" : "text-red-400"}`}
            >
              {totalWeight}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full ${isWeightValid ? "bg-green-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {config.domains.map((domain) => (
            <div key={domain.id} className="bg-slate-700 rounded-lg p-4">
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-white">
                      {domain.id}: {domain.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {domain.description}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-cyan-400">
                    {domain.weight}%
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={domain.minWeight}
                  max={domain.maxWeight}
                  value={domain.weight}
                  onChange={(e) =>
                    handleWeightChange(domain.id, parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min={domain.minWeight}
                  max={domain.maxWeight}
                  value={domain.weight}
                  onChange={(e) =>
                    handleWeightChange(domain.id, parseInt(e.target.value))
                  }
                  className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm text-center"
                />
                <span className="text-xs text-slate-400">
                  {domain.minWeight}% - {domain.maxWeight}%
                </span>
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
            <label className="text-sm font-semibold text-white block mb-3">
              DSCR Minimum
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.1"
                value={config.noGoThresholds.dscr}
                onChange={(e) =>
                  handleNoGoChange("dscr", parseFloat(e.target.value))
                }
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
              <span className="text-slate-400">x</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ratio couverture dette minimum
            </p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <label className="text-sm font-semibold text-white block mb-3">
              Equity Minimum
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="1"
                value={config.noGoThresholds.equity}
                onChange={(e) =>
                  handleNoGoChange("equity", parseFloat(e.target.value))
                }
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Fonds propres minimum</p>
          </div>

          <div className="bg-slate-700 rounded-lg p-4">
            <label className="text-sm font-semibold text-white block mb-3">
              Leverage Maximum
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="1"
                value={config.noGoThresholds.leverage}
                onChange={(e) =>
                  handleNoGoChange("leverage", parseFloat(e.target.value))
                }
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
              />
              <span className="text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Ratio d'endettement maximum
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={!isWeightValid}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          <Save size={20} />
          <span>Enregistrer la Configuration</span>
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all flex items-center justify-center space-x-2"
        >
          <RotateCcw size={20} />
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  );
}
