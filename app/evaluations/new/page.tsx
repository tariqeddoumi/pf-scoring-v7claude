'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { SCORING_MODEL } from '@/lib/scoring-model';
import { calculateEvaluation } from '@/lib/scoring-engine';

interface Responses {
  [criteriaId: string]: string | number;
}

export default function NewEvaluationPage() {
  const [projectId, setProjectId] = useState('p1');
  const [evaluationType, setEvaluationType] = useState('Initiale');
  const [analyst, setAnalyst] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<string[]>(['D1']);
  const [responses, setResponses] = useState<Responses>({});
  const [financialData] = useState({ dscr: 1.35, equity: 20, hasGuarantees: true, contractsSigned: true });

  const toggleDomain = (domainId: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainId)
        ? prev.filter((d) => d !== domainId)
        : [...prev, domainId]
    );
  };

  const handleResponseChange = (criteriaId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [criteriaId]: value }));
  };

  const handleSubmit = () => {
    const allResponses = Object.entries(responses).map(([criteriaId, value]) => ({
      criteriaId,
      value: typeof value === 'string' ? parseFloat(value) || value : value,
      comment: '',
    }));

    const result = calculateEvaluation(projectId, allResponses, financialData);
    console.log('Évaluation:', result);
    alert(`✅ Score: ${result.globalScore} | Rating: ${result.rating}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/evaluations" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Nouvelle Évaluation</h1>
          <p className="text-slate-400 mt-2">9 domaines • 27 sous-critères • Modèle V7++</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Paramètres</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-white block mb-2">Projet</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
              <option value="p1">Parc Éolien Taourirt</option>
              <option value="p2">Centrale Solaire Ouarzazate</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white block mb-2">Type</label>
            <select value={evaluationType} onChange={(e) => setEvaluationType(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
              <option>Initiale</option>
              <option>Annuelle</option>
              <option>Ad hoc</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white block mb-2">Analyste</label>
            <input type="text" value={analyst} onChange={(e) => setAnalyst(e.target.value)} placeholder="Nom" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SCORING_MODEL.map((domain) => (
          <div key={domain.id} className="rounded-lg border border-slate-700 bg-slate-800 overflow-hidden">
            <button
              onClick={() => toggleDomain(domain.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-cyan-400">{domain.id}</span>
                <span className="font-semibold text-white">{domain.name}</span>
                <span className="text-xs text-slate-400">({domain.weight}%)</span>
              </div>
              {expandedDomains.includes(domain.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedDomains.includes(domain.id) && (
              <div className="border-t border-slate-700 p-4 space-y-4">
                {domain.subCriteria.map((sub) => (
                  <div key={sub.id} className="bg-slate-700 rounded-lg p-3 space-y-3">
                    <h4 className="font-semibold text-white text-sm">{sub.label}</h4>
                    {sub.criteria.map((crit) => (
                      <div key={crit.id} className="flex flex-col space-y-1">
                        <label className="text-xs text-slate-300">{crit.label}</label>
                        {crit.scale === 'qualitative' ? (
                          <select
                            value={responses[crit.id] || ''}
                            onChange={(e) => handleResponseChange(crit.id, e.target.value)}
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="">-- Sélectionner --</option>
                            {crit.options?.map((opt) => (
                              <option key={opt.label} value={opt.label}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            value={responses[crit.id] || ''}
                            onChange={(e) => handleResponseChange(crit.id, e.target.value)}
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                            placeholder="Valeur"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
        >
          Calculer le Score
        </button>
        <Link href="/evaluations" className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-all text-center">
          Annuler
        </Link>
      </div>
    </div>
  );
}
