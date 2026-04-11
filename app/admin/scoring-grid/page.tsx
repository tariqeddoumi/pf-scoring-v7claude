"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Edit2, Info } from "lucide-react";

interface ScoringCriteria {
  id: string;
  name: string;
  category: string;
  weight: number;
  minScore: number;
  maxScore: number;
  description: string;
}

export default function ScoringGridPage() {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Financier",
    weight: 1,
    minScore: 0,
    maxScore: 100,
    description: "",
  });

  const categories = [
    { label: "Financier", value: "Financier" },
    { label: "Technique", value: "Technique" },
    { label: "Marché", value: "Marché" },
    { label: "Environnemental", value: "Environnemental" },
    { label: "Social", value: "Social" },
    { label: "Gouvernance", value: "Gouvernance" },
    { label: "Juridique", value: "Juridique" },
    { label: "Pays", value: "Pays" },
  ];

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      // Placeholder API call - will be implemented
      setCriteria([]);
      setError(null);
    } catch (err) {
      setError("Erreur lors du chargement des critères");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriteria = async () => {
    try {
      if (!formData.name) {
        setError("Le nom du critère est requis");
        return;
      }

      const newCriteria: ScoringCriteria = {
        id: Date.now().toString(),
        ...formData,
      };

      setCriteria([...criteria, newCriteria]);
      setFormData({
        name: "",
        category: "Financier",
        weight: 1,
        minScore: 0,
        maxScore: 100,
        description: "",
      });
      setError(null);
    } catch (err) {
      setError("Erreur lors de l'ajout du critère");
      console.error(err);
    }
  };

  const handleDeleteCriteria = async (id: string) => {
    try {
      setCriteria(criteria.filter((c) => c.id !== id));
    } catch (err) {
      setError("Erreur lors de la suppression");
      console.error(err);
    }
  };

  const handleSaveGrid = async () => {
    try {
      // Save to backend
      // await fetch('/api/admin/scoring-grid', { method: 'POST', body: JSON.stringify({ criteria }) })
      alert("Grille de scoring sauvegardée avec succès!");
    } catch (err) {
      setError("Erreur lors de la sauvegarde");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Paramétrage des grilles de scoring
          </h1>
          <p className="text-slate-400 mt-2">
            Configurez les critères et poids de scoring au niveau le plus fin
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-semibold mb-2">Structure de scoring</p>
            <p>
              Les critères sont organisés par catégorie (Financier, Technique,
              ESG, etc.) avec des poids définis pour chaque niveau de détail.
              Les scores vont de {formData.minScore} à {formData.maxScore}.
            </p>
          </div>
        </div>
      </div>

      {/* Add Criteria Form */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">Ajouter un critère</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom du critère
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Ratio d'endettement"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Poids (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Score maximum
            </label>
            <input
              type="number"
              value={formData.maxScore}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxScore: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description détaillée du critère..."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleAddCriteria}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Ajouter le critère
        </button>
      </div>

      {/* Criteria List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Critères définis ({criteria.length})
        </h2>

        {criteria.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center text-slate-400">
            Aucun critère défini. Commencez par en ajouter un.
          </div>
        ) : (
          <div className="space-y-3">
            {criteria.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-400">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleDeleteCriteria(item.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Poids</p>
                    <p className="text-white font-semibold">{item.weight}/10</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Score min</p>
                    <p className="text-white font-semibold">{item.minScore}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Score max</p>
                    <p className="text-white font-semibold">{item.maxScore}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveGrid}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <Save size={20} />
          Sauvegarder la grille
        </button>
        <p className="text-sm text-slate-400">
          {criteria.length} critère{criteria.length !== 1 ? "s" : ""} défini
          {criteria.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
