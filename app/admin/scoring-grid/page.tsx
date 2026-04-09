'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Save, Plus, Trash2, Edit2, ChevronDown, ChevronRight,
  GripVertical, ToggleLeft, ToggleRight, AlertTriangle, Check, X, Layers
} from 'lucide-react';

// === TYPES ===

interface ScoreOption {
  id?: string;
  label: string;
  score: number;
  orderIndex: number;
}

interface ScoreRange {
  id?: string;
  label?: string;
  minValue: number;
  maxValue: number;
  score: number;
  orderIndex: number;
}

interface Criterion {
  id: string;
  domainId: string;
  code: string;
  label: string;
  description?: string;
  type: 'OPTION' | 'RANGE';
  isActive: boolean;
  hardStopIfBelow?: number | null;
  orderIndex: number;
  options: ScoreOption[];
  ranges: ScoreRange[];
}

interface Domain {
  id: string;
  code: string;
  label: string;
  description?: string;
  weight: number;
  isActive: boolean;
  orderIndex: number;
  criteria: Criterion[];
}

// === CRITERION FORM ===

interface CriterionFormData {
  code: string;
  label: string;
  description: string;
  type: 'OPTION' | 'RANGE';
  hardStopIfBelow: string;
  options: { label: string; score: string }[];
  ranges: { label: string; minValue: string; maxValue: string; score: string }[];
}

const emptyCriterionForm: CriterionFormData = {
  code: '',
  label: '',
  description: '',
  type: 'OPTION',
  hardStopIfBelow: '',
  options: [
    { label: 'Excellent', score: '10' },
    { label: 'Bon', score: '8' },
    { label: 'Moyen', score: '6' },
    { label: 'Faible', score: '4' },
  ],
  ranges: [
    { label: '', minValue: '0', maxValue: '25', score: '4' },
    { label: '', minValue: '25', maxValue: '50', score: '6' },
    { label: '', minValue: '50', maxValue: '75', score: '8' },
    { label: '', minValue: '75', maxValue: '100', score: '10' },
  ],
};

// === MAIN COMPONENT ===

export default function ScoringGridPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // UI state
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  // Forms
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomain, setNewDomain] = useState({ code: '', label: '', description: '', weight: '10' });
  const [addingCriterionTo, setAddingCriterionTo] = useState<string | null>(null);
  const [criterionForm, setCriterionForm] = useState<CriterionFormData>(emptyCriterionForm);
  const [editingCriterion, setEditingCriterion] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'domain' | 'criterion'; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // === API CALLS ===

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/domains?include=full');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setDomains(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async () => {
    if (!newDomain.code || !newDomain.label) {
      setError('Code et label du domaine requis');
      return;
    }
    try {
      const res = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDomain, weight: parseFloat(newDomain.weight) || 10 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur');
      }
      setAddingDomain(false);
      setNewDomain({ code: '', label: '', description: '', weight: '10' });
      setSuccess('Domaine créé avec succès');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateDomain = async (domain: Domain) => {
    try {
      const res = await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: domain.code,
          label: domain.label,
          description: domain.description,
          weight: domain.weight,
          isActive: domain.isActive,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      setEditingDomain(null);
      setSuccess('Domaine mis à jour');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleDomain = async (domain: Domain) => {
    try {
      await fetch(`/api/admin/domains/${domain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !domain.isActive }),
      });
      setDomains(prev =>
        prev.map(d => d.id === domain.id ? { ...d, isActive: !d.isActive } : d)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/domains/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDeleteConfirm(null);
      setSuccess('Domaine supprimé');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateCriterion = async (domainId: string) => {
    if (!criterionForm.code || !criterionForm.label) {
      setError('Code et label du critère requis');
      return;
    }
    try {
      const payload: any = {
        code: criterionForm.code,
        label: criterionForm.label,
        description: criterionForm.description,
        type: criterionForm.type,
        hardStopIfBelow: criterionForm.hardStopIfBelow ? parseFloat(criterionForm.hardStopIfBelow) : null,
      };

      if (criterionForm.type === 'OPTION') {
        payload.options = criterionForm.options
          .filter(o => o.label.trim())
          .map(o => ({ label: o.label, score: parseFloat(o.score) || 0 }));
      } else {
        payload.ranges = criterionForm.ranges
          .filter(r => r.minValue !== '' && r.maxValue !== '')
          .map(r => ({
            label: r.label || null,
            minValue: parseFloat(r.minValue) || 0,
            maxValue: parseFloat(r.maxValue) || 0,
            score: parseFloat(r.score) || 0,
          }));
      }

      const res = await fetch(`/api/admin/domains/${domainId}/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de la création');

      setAddingCriterionTo(null);
      setCriterionForm(emptyCriterionForm);
      setSuccess('Critère créé avec succès');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateCriterion = async (criterionId: string) => {
    try {
      const payload: any = {
        code: criterionForm.code,
        label: criterionForm.label,
        description: criterionForm.description,
        type: criterionForm.type,
        hardStopIfBelow: criterionForm.hardStopIfBelow ? parseFloat(criterionForm.hardStopIfBelow) : null,
      };

      if (criterionForm.type === 'OPTION') {
        payload.options = criterionForm.options
          .filter(o => o.label.trim())
          .map(o => ({ label: o.label, score: parseFloat(o.score) || 0 }));
      } else {
        payload.ranges = criterionForm.ranges
          .filter(r => r.minValue !== '' && r.maxValue !== '')
          .map(r => ({
            label: r.label || null,
            minValue: parseFloat(r.minValue) || 0,
            maxValue: parseFloat(r.maxValue) || 0,
            score: parseFloat(r.score) || 0,
          }));
      }

      const res = await fetch(`/api/admin/criteria/${criterionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      setEditingCriterion(null);
      setCriterionForm(emptyCriterionForm);
      setSuccess('Critère mis à jour');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleCriterion = async (criterion: Criterion) => {
    try {
      await fetch(`/api/admin/criteria/${criterion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !criterion.isActive }),
      });
      setDomains(prev =>
        prev.map(d => ({
          ...d,
          criteria: d.criteria.map(c =>
            c.id === criterion.id ? { ...c, isActive: !c.isActive } : c
          ),
        }))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/criteria/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      setDeleteConfirm(null);
      setSuccess('Critère supprimé');
      await fetchDomains();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // === FORM HELPERS ===

  const startEditCriterion = (c: Criterion) => {
    setEditingCriterion(c.id);
    setAddingCriterionTo(null);
    setCriterionForm({
      code: c.code,
      label: c.label,
      description: c.description || '',
      type: c.type as 'OPTION' | 'RANGE',
      hardStopIfBelow: c.hardStopIfBelow != null ? String(c.hardStopIfBelow) : '',
      options: c.options.length > 0
        ? c.options.map(o => ({ label: o.label, score: String(o.score) }))
        : emptyCriterionForm.options,
      ranges: c.ranges.length > 0
        ? c.ranges.map(r => ({ label: r.label || '', minValue: String(r.minValue), maxValue: String(r.maxValue), score: String(r.score) }))
        : emptyCriterionForm.ranges,
    });
    setExpandedCriteria(prev => new Set(prev).add(c.id));
  };

  const toggleDomainExpand = (id: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalWeight = domains.reduce((sum, d) => sum + (d.isActive ? d.weight : 0), 0);

  // === RENDER ===

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Paramétrage des Grilles de Scoring</h1>
            <p className="text-slate-400 mt-1">Gérez les domaines, critères, options et plages de notation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${Math.abs(totalWeight - 100) < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            Poids total: {totalWeight.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-2 text-green-400">
          <Check size={16} /> {success}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400">Chargement de la grille de scoring...</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">Confirmer la suppression</h3>
            <p className="text-slate-400 mb-4">
              Supprimer {deleteConfirm.type === 'domain' ? 'le domaine' : 'le critère'}{' '}
              <span className="text-white font-semibold">{deleteConfirm.label}</span> ?
              {deleteConfirm.type === 'domain' && (
                <span className="block text-red-400 text-sm mt-2">
                  <AlertTriangle size={14} className="inline mr-1" />
                  Tous les critères associés seront supprimés.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} disabled={deleting} className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">Annuler</button>
              <button
                onClick={() => deleteConfirm.type === 'domain' ? handleDeleteDomain(deleteConfirm.id) : handleDeleteCriterion(deleteConfirm.id)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Domain Button */}
      {!loading && (
        <div>
          {!addingDomain ? (
            <button
              onClick={() => setAddingDomain(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus size={18} /> Ajouter un domaine
            </button>
          ) : (
            <div className="bg-slate-800 border border-cyan-500/50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Nouveau domaine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Code *</label>
                  <input type="text" value={newDomain.code} onChange={e => setNewDomain({ ...newDomain, code: e.target.value })} placeholder="D10" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Label *</label>
                  <input type="text" value={newDomain.label} onChange={e => setNewDomain({ ...newDomain, label: e.target.value })} placeholder="Nom du domaine" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description</label>
                  <input type="text" value={newDomain.description} onChange={e => setNewDomain({ ...newDomain, description: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Poids (%)</label>
                  <input type="number" value={newDomain.weight} onChange={e => setNewDomain({ ...newDomain, weight: e.target.value })} min="0" max="100" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreateDomain} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">Créer</button>
                <button onClick={() => { setAddingDomain(false); setNewDomain({ code: '', label: '', description: '', weight: '10' }); }} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">Annuler</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domains List */}
      {!loading && domains.map(domain => (
        <div key={domain.id} className={`rounded-lg border ${domain.isActive ? 'border-slate-700' : 'border-slate-700/50 opacity-60'} bg-slate-800 overflow-hidden`}>
          {/* Domain Header */}
          <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-750" onClick={() => toggleDomainExpand(domain.id)}>
            <GripVertical size={16} className="text-slate-500 flex-shrink-0" />
            {expandedDomains.has(domain.id) ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}

            <div className="flex-1 min-w-0">
              {editingDomain === domain.id ? (
                <div className="grid grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
                  <input value={domain.code} onChange={e => setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, code: e.target.value } : d))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none" />
                  <input value={domain.label} onChange={e => setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, label: e.target.value } : d))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm col-span-2 focus:border-cyan-500 focus:outline-none" />
                  <input type="number" value={domain.weight} onChange={e => setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, weight: parseFloat(e.target.value) || 0 } : d))} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:border-cyan-500 focus:outline-none" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-cyan-400 font-mono text-sm font-bold">{domain.code}</span>
                  <span className="text-white font-semibold">{domain.label}</span>
                  {domain.description && <span className="text-slate-500 text-sm hidden md:inline">- {domain.description}</span>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
              <span className="text-cyan-400 font-bold text-sm">{domain.weight}%</span>
              <span className="text-slate-500 text-xs">({domain.criteria.length} critères)</span>

              <button onClick={() => handleToggleDomain(domain)} className="p-1.5 rounded transition-colors" title={domain.isActive ? 'Désactiver' : 'Activer'}>
                {domain.isActive ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} className="text-slate-500" />}
              </button>

              {editingDomain === domain.id ? (
                <>
                  <button onClick={() => handleUpdateDomain(domain)} className="p-1.5 text-green-400 hover:bg-green-500/20 rounded transition-colors"><Check size={16} /></button>
                  <button onClick={() => { setEditingDomain(null); fetchDomains(); }} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded transition-colors"><X size={16} /></button>
                </>
              ) : (
                <button onClick={() => setEditingDomain(domain.id)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"><Edit2 size={14} /></button>
              )}
              <button
                onClick={() => setDeleteConfirm({ type: 'domain', id: domain.id, label: domain.label })}
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Domain Expanded Content */}
          {expandedDomains.has(domain.id) && (
            <div className="border-t border-slate-700 p-4 space-y-3">
              {/* Criteria List */}
              {domain.criteria.length === 0 && !addingCriterionTo && (
                <p className="text-slate-500 text-sm italic pl-6">Aucun critère défini pour ce domaine.</p>
              )}

              {domain.criteria.map(criterion => (
                <div key={criterion.id} className={`ml-6 rounded-lg border ${criterion.isActive ? 'border-slate-600 bg-slate-750' : 'border-slate-600/50 bg-slate-750/50 opacity-60'}`}>
                  {/* Criterion Header */}
                  <div className="flex items-center gap-3 p-3">
                    <button onClick={() => setExpandedCriteria(prev => { const n = new Set(prev); n.has(criterion.id) ? n.delete(criterion.id) : n.add(criterion.id); return n; })} className="text-slate-400">
                      {expandedCriteria.has(criterion.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400 font-mono text-xs">{criterion.code}</span>
                        <span className="text-white text-sm font-medium">{criterion.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${criterion.type === 'OPTION' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {criterion.type === 'OPTION' ? 'Qualitatif' : 'Quantitatif'}
                        </span>
                        {criterion.hardStopIfBelow != null && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                            NO-GO &lt; {criterion.hardStopIfBelow}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleToggleCriterion(criterion)} className="p-1 rounded transition-colors">
                        {criterion.isActive ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} className="text-slate-500" />}
                      </button>
                      <button onClick={() => startEditCriterion(criterion)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteConfirm({ type: 'criterion', id: criterion.id, label: criterion.label })} className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Criterion Details (expanded) */}
                  {expandedCriteria.has(criterion.id) && editingCriterion !== criterion.id && (
                    <div className="border-t border-slate-600 p-3 ml-8">
                      {criterion.description && <p className="text-slate-400 text-xs mb-2">{criterion.description}</p>}

                      {criterion.type === 'OPTION' && criterion.options.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-slate-300 text-xs font-semibold mb-1">Options de notation :</p>
                          {criterion.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span className={`w-8 text-center font-bold rounded px-1 py-0.5 ${opt.score >= 8 ? 'bg-green-500/20 text-green-400' : opt.score >= 6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                {opt.score}
                              </span>
                              <span className="text-slate-300">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {criterion.type === 'RANGE' && criterion.ranges.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-slate-300 text-xs font-semibold mb-1">Plages de notation :</p>
                          {criterion.ranges.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs">
                              <span className={`w-8 text-center font-bold rounded px-1 py-0.5 ${r.score >= 8 ? 'bg-green-500/20 text-green-400' : r.score >= 6 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                {r.score}
                              </span>
                              <span className="text-slate-300">{r.minValue} - {r.maxValue}</span>
                              {r.label && <span className="text-slate-500">({r.label})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Criterion Edit Form (inline) */}
                  {editingCriterion === criterion.id && (
                    <div className="border-t border-slate-600 p-4">
                      <CriterionFormComponent
                        form={criterionForm}
                        setForm={setCriterionForm}
                        onSave={() => handleUpdateCriterion(criterion.id)}
                        onCancel={() => { setEditingCriterion(null); setCriterionForm(emptyCriterionForm); }}
                        saveLabel="Mettre à jour"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add Criterion Form */}
              {addingCriterionTo === domain.id ? (
                <div className="ml-6 rounded-lg border border-cyan-500/30 bg-slate-750 p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Nouveau critère pour {domain.label}</h4>
                  <CriterionFormComponent
                    form={criterionForm}
                    setForm={setCriterionForm}
                    onSave={() => handleCreateCriterion(domain.id)}
                    onCancel={() => { setAddingCriterionTo(null); setCriterionForm(emptyCriterionForm); }}
                    saveLabel="Créer le critère"
                  />
                </div>
              ) : (
                <button
                  onClick={() => { setAddingCriterionTo(domain.id); setEditingCriterion(null); setCriterionForm(emptyCriterionForm); }}
                  className="ml-6 flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Ajouter un critère
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Empty State */}
      {!loading && domains.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center">
          <Layers size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Aucun domaine configuré</p>
          <p className="text-slate-500 text-sm mt-1">Commencez par créer un domaine de scoring.</p>
        </div>
      )}
    </div>
  );
}

// === CRITERION FORM SUB-COMPONENT ===

function CriterionFormComponent({
  form,
  setForm,
  onSave,
  onCancel,
  saveLabel,
}: {
  form: CriterionFormData;
  setForm: (f: CriterionFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const addOption = () => setForm({ ...form, options: [...form.options, { label: '', score: '0' }] });
  const removeOption = (i: number) => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) });
  const updateOption = (i: number, field: string, value: string) => {
    const opts = [...form.options];
    opts[i] = { ...opts[i], [field]: value };
    setForm({ ...form, options: opts });
  };

  const addRange = () => setForm({ ...form, ranges: [...form.ranges, { label: '', minValue: '', maxValue: '', score: '0' }] });
  const removeRange = (i: number) => setForm({ ...form, ranges: form.ranges.filter((_, idx) => idx !== i) });
  const updateRange = (i: number, field: string, value: string) => {
    const ranges = [...form.ranges];
    ranges[i] = { ...ranges[i], [field]: value };
    setForm({ ...form, ranges });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Code *</label>
          <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="D1.1.1" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Label *</label>
          <input type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Nom du critère" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Description</label>
        <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Type de notation</label>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'OPTION' | 'RANGE' })} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:border-cyan-500 focus:outline-none">
            <option value="OPTION">Qualitatif (options)</option>
            <option value="RANGE">Quantitatif (plages)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Seuil NO-GO (score min)</label>
          <input type="number" value={form.hardStopIfBelow} onChange={e => setForm({ ...form, hardStopIfBelow: e.target.value })} placeholder="Ex: 2" step="0.5" className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
        </div>
      </div>

      {/* Options (OPTION type) */}
      {form.type === 'OPTION' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400 font-semibold">Options de notation</label>
            <button onClick={addOption} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus size={12} /> Ajouter</button>
          </div>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} placeholder="Label" className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                <input type="number" value={opt.score} onChange={e => updateOption(i, 'score', e.target.value)} placeholder="Score" step="0.5" min="0" max="10" className="w-20 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-cyan-500 focus:outline-none" />
                <button onClick={() => removeOption(i)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranges (RANGE type) */}
      {form.type === 'RANGE' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-400 font-semibold">Plages de valeurs</label>
            <button onClick={addRange} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus size={12} /> Ajouter</button>
          </div>
          <div className="space-y-2">
            {form.ranges.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="number" value={r.minValue} onChange={e => updateRange(i, 'minValue', e.target.value)} placeholder="Min" className="w-20 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-cyan-500 focus:outline-none" />
                <span className="text-slate-500 text-sm">-</span>
                <input type="number" value={r.maxValue} onChange={e => updateRange(i, 'maxValue', e.target.value)} placeholder="Max" className="w-20 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-cyan-500 focus:outline-none" />
                <input type="text" value={r.label} onChange={e => updateRange(i, 'label', e.target.value)} placeholder="Label (opt.)" className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none" />
                <input type="number" value={r.score} onChange={e => updateRange(i, 'score', e.target.value)} placeholder="Score" step="0.5" min="0" max="10" className="w-20 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-cyan-500 focus:outline-none" />
                <button onClick={() => removeRange(i)} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button onClick={onSave} className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors font-medium">{saveLabel}</button>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors">Annuler</button>
      </div>
    </div>
  );
}
