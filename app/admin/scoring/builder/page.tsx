"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import NodeModal from "@/components/scoring/NodeModal";
import OptionModal from "@/components/scoring/OptionModal";
import RangeModal from "@/components/scoring/RangeModal";
import { ModelConfigurationPanel } from "@/components/admin/ModelConfigurationPanel";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

interface ScoringOption {
  id: string;
  nodeId: string;
  value: string;
  label: string;
  score: number;
  orderIndex: number;
}

interface ScoringRange {
  id: string;
  nodeId: string;
  minValue: number;
  maxValue: number;
  score: number;
  label?: string;
  orderIndex: number;
}

interface ScoringNode {
  id: string;
  code: string;
  label: string;
  shortLabel?: string;
  description?: string;
  nodeType: string;
  depth: number;
  orderIndex: number;
  weight?: number;
  answerType?: string;
  children?: ScoringNode[];
  options?: ScoringOption[];
  ranges?: ScoringRange[];
}

interface ModelVersion {
  id: string;
  versionNumber: number;
  label: string;
}

const DOMAIN_META: Record<string, { icon: string; color: string }> = {
  D1: { icon: "💰", color: "text-blue-400 bg-blue-400/10" },
  D2: { icon: "⚙️", color: "text-purple-400 bg-purple-400/10" },
  D3: { icon: "📈", color: "text-green-400 bg-green-400/10" },
  D4: { icon: "🌿", color: "text-emerald-400 bg-emerald-400/10" },
  D5: { icon: "🏛️", color: "text-amber-400 bg-amber-400/10" },
  D6: { icon: "⚖️", color: "text-orange-400 bg-orange-400/10" },
  D7: { icon: "🗺️", color: "text-cyan-400 bg-cyan-400/10" },
  D8: { icon: "🏗️", color: "text-pink-400 bg-pink-400/10" },
  D9: { icon: "📊", color: "text-red-400 bg-red-400/10" },
};

export default function ScoringBuilderPage() {
  const [questionnaire, setQuestionnaire] = useState<ScoringNode[]>([]);
  const [modelVersion, setModelVersion] = useState<ModelVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Modal states
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [nodeModalData, setNodeModalData] = useState<Partial<ScoringNode> | undefined>(undefined);
  const [nodeModalType, setNodeModalType] = useState<"DOMAIN" | "CRITERION">("DOMAIN");
  const [selectedDomainId, setSelectedDomainId] = useState("");

  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [optionModalData, setOptionModalData] = useState<Partial<ScoringOption> | undefined>(undefined);
  const [selectedCriterionId, setSelectedCriterionId] = useState("");
  const [selectedCriterionCode, setSelectedCriterionCode] = useState("");

  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [rangeModalData, setRangeModalData] = useState<Partial<ScoringRange> | undefined>(undefined);

  useEffect(() => {
    loadModel();
  }, []);

  const openCreateDomainModal = () => {
    setNodeModalType("DOMAIN");
    setNodeModalData(undefined);
    setSelectedDomainId("");
    setNodeModalOpen(true);
  };

  const openCreateCriterionModal = (domainId: string) => {
    setNodeModalType("CRITERION");
    setNodeModalData(undefined);
    setSelectedDomainId(domainId);
    setNodeModalOpen(true);
  };

  const openEditNodeModal = (node: ScoringNode) => {
    setNodeModalType(node.nodeType as "DOMAIN" | "CRITERION");
    setNodeModalData(node);
    if (node.nodeType === "CRITERION") {
      setSelectedDomainId(node.id);
    }
    setNodeModalOpen(true);
  };

  const handleNodeSubmit = async (data: Record<string, unknown>) => {
    if (nodeModalData?.id) {
      // Edit
      const res = await apiPut(`/api/admin/scoring/nodes?nodeId=${nodeModalData.id}`, data);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur mise à jour");
      }
    } else {
      // Create
      const payload = {
        ...data,
        versionId: modelVersion?.id,
        nodeType: nodeModalType,
        depth: nodeModalType === "DOMAIN" ? 0 : 1,
        parentNodeId: nodeModalType === "CRITERION" ? selectedDomainId : null,
        orderIndex: 0,
      };

      const res = await apiPost("/api/admin/scoring/nodes", payload);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création");
      }
    }

    await loadModel();
  };

  const openCreateOptionModal = (criterionId: string, criterionCode: string) => {
    setSelectedCriterionId(criterionId);
    setSelectedCriterionCode(criterionCode);
    setOptionModalData(undefined);
    setOptionModalOpen(true);
  };

  const openEditOptionModal = (option: ScoringOption, criterionCode: string) => {
    setSelectedCriterionId(option.nodeId);
    setSelectedCriterionCode(criterionCode);
    setOptionModalData(option);
    setOptionModalOpen(true);
  };

  const handleOptionSubmit = async (data: Record<string, unknown>) => {
    if (optionModalData?.id) {
      // Edit
      const res = await apiPut(`/api/admin/scoring/options?optionId=${optionModalData.id}`, data);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur mise à jour");
      }
    } else {
      // Create
      const payload = {
        ...data,
        nodeId: selectedCriterionId,
      };

      const res = await apiPost("/api/admin/scoring/options", payload);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création");
      }
    }

    await loadModel();
  };

  const openCreateRangeModal = (criterionId: string, criterionCode: string) => {
    setSelectedCriterionId(criterionId);
    setSelectedCriterionCode(criterionCode);
    setRangeModalData(undefined);
    setRangeModalOpen(true);
  };

  const openEditRangeModal = (range: ScoringRange, criterionCode: string) => {
    setSelectedCriterionId(range.nodeId);
    setSelectedCriterionCode(criterionCode);
    setRangeModalData(range);
    setRangeModalOpen(true);
  };

  const handleRangeSubmit = async (data: Record<string, unknown>) => {
    if (rangeModalData?.id) {
      // Edit
      const res = await apiPut(`/api/admin/scoring/ranges?rangeId=${rangeModalData.id}`, data);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur mise à jour");
      }
    } else {
      // Create
      const payload = {
        ...data,
        nodeId: selectedCriterionId,
      };

      const res = await apiPost("/api/admin/scoring/ranges", payload);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur création");
      }
    }

    await loadModel();
  };

  const loadModel = async () => {
    try {
      setLoading(true);
      const res = await apiGet("/api/scoring/questionnaire");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur chargement");
      }
      const data = await res.json();
      setQuestionnaire(data.data || []);
      setModelVersion({
        id: data.modelVersionId,
        versionNumber: data.modelVersion?.versionNumber ?? 1,
        label: data.modelVersion?.label ?? "V1",
      });
      const ids = new Set<string>((data.data || []).map((d: ScoringNode) => d.id));
      setExpandedDomains(ids);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm("Êtes-vous sûr ? Cette action est irréversible.")) return;

    try {
      setSaving(true);
      const res = await apiDelete(`/api/admin/scoring/nodes?nodeId=${nodeId}`);

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur suppression");
      }

      await loadModel();
    } catch (e: unknown) {
      alert(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm("Supprimer cette option ?")) return;

    try {
      setSaving(true);
      const res = await apiDelete(`/api/admin/scoring/options?optionId=${optionId}`);

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur suppression");
      }

      await loadModel();
    } catch (e: unknown) {
      alert(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRange = async (rangeId: string) => {
    if (!confirm("Supprimer cette plage ?")) return;

    try {
      setSaving(true);
      const res = await apiDelete(`/api/admin/scoring/ranges?rangeId=${rangeId}`);

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur suppression");
      }

      await loadModel();
    } catch (e: unknown) {
      alert(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCriterion = (id: string) => {
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalWeight = questionnaire.reduce((s, d) => s + (d.weight ?? 0), 0);
  const weightValid = Math.abs(totalWeight - 1.0) < 0.01;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-cyan-400 mx-auto" size={40} />
          <p className="text-slate-400 text-sm">Chargement du modèle…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/scoring" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Constructeur de Modèle</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Créez et modifiez le modèle de scoring PF V7++
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Validation Panel */}
      {modelVersion && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-3">
          <div className="flex items-center gap-2">
            {weightValid ? (
              <CheckCircle2 size={18} className="text-green-400" />
            ) : (
              <AlertCircle size={18} className="text-yellow-400" />
            )}
            <span className="font-medium">
              Poids total: <strong>{(totalWeight * 100).toFixed(1)}%</strong>
            </span>
          </div>
          <div className="text-xs text-slate-400 grid grid-cols-3 gap-4">
            <span>Domaines: {questionnaire.length}</span>
            <span>Critères: {questionnaire.reduce((s, d) => s + (d.children?.length ?? 0), 0)}</span>
            <span>Options: {questionnaire.reduce((s, d) => s + (d.children?.reduce((cs, c) => cs + (c.options?.length ?? 0), 0) ?? 0), 0)}</span>
          </div>
        </div>
      )}

      {/* Model Configuration Panel */}
      {modelVersion && (
        <ModelConfigurationPanel
          versionId={modelVersion.id}
          onConfigUpdate={loadModel}
        />
      )}

      {/* Domains List */}
      {questionnaire.length > 0 ? (
        <div className="space-y-3">
          {questionnaire.map((domain) => {
            const meta = DOMAIN_META[domain.code] ?? { icon: "📋", color: "text-slate-400 bg-slate-700/50" };
            const isExpanded = expandedDomains.has(domain.id);

            return (
              <div key={domain.id} className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
                {/* Domain header */}
                <button
                  onClick={() => toggleDomain(domain.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-slate-700/30 transition-colors text-left"
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${meta.color}`}>
                        {domain.code}
                      </span>
                      <span className="text-white font-semibold">{domain.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Poids: <strong>{((domain.weight ?? 0) * 100).toFixed(0)}%</strong> • {domain.children?.length ?? 0} critères
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditNodeModal(domain);
                      }}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(domain.id);
                      }}
                      disabled={saving}
                      className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Criteria list */}
                {isExpanded && (
                  <div className={`border-t border-slate-700 ${domain.children && domain.children.length > 0 ? 'divide-y divide-slate-700/50' : ''}`}>
                    {(!domain.children || domain.children.length === 0) && (
                      <div className="px-5 py-4 text-center">
                        <p className="text-xs text-slate-500 mb-3">Aucun critère dans ce domaine</p>
                        <button
                          onClick={() => openCreateCriterionModal(domain.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded text-xs transition-colors"
                        >
                          <Plus size={14} />
                          Ajouter Critère
                        </button>
                      </div>
                    )}
                    {domain.children && domain.children.length > 0 && domain.children.map((criterion) => {
                      const isExpCrit = expandedCriteria.has(criterion.id);
                      const hasDetails = (criterion.options?.length ?? 0) > 0 || (criterion.ranges?.length ?? 0) > 0;

                      return (
                        <div key={criterion.id}>
                          <button
                            onClick={() => hasDetails && toggleCriterion(criterion.id)}
                            className={`w-full flex items-start gap-4 px-5 py-3.5 transition-colors text-left ${
                              hasDetails ? "hover:bg-slate-700/20" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0 ml-10">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-slate-500 font-mono">{criterion.code}</span>
                                <span className="text-slate-200 text-sm font-medium">{criterion.label}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  criterion.answerType === "NUMERIC_RANGE"
                                    ? "bg-purple-500/10 text-purple-400"
                                    : "bg-blue-500/10 text-blue-400"
                                }`}>
                                  {criterion.answerType === "NUMERIC_RANGE" ? "Numérique" : "Options"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditNodeModal(criterion);
                                }}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(criterion.id);
                                }}
                                disabled={saving}
                                className="p-1.5 hover:bg-red-500/10 rounded text-red-400 hover:text-red-300 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                              {hasDetails && (
                                isExpCrit ? (
                                  <ChevronDown size={14} className="text-slate-400" />
                                ) : (
                                  <ChevronRight size={14} className="text-slate-400" />
                                )
                              )}
                            </div>
                          </button>

                          {/* Options and Ranges */}
                          {isExpCrit && (
                            <div className="ml-24 mr-5 mb-3 space-y-3">
                              {criterion.options && criterion.options.length > 0 && (
                                <div className="rounded-lg border border-slate-700 overflow-hidden">
                                  <div className="bg-slate-700/50 px-4 py-2 text-xs font-medium text-slate-400 flex justify-between items-center">
                                    <span>Options</span>
                                    <button
                                      onClick={() => openCreateOptionModal(criterion.id, criterion.code)}
                                      className="p-1 hover:bg-slate-600 rounded text-slate-300"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-slate-700/30 text-slate-400">
                                        <th className="text-left px-3 py-2 font-medium">Option</th>
                                        <th className="text-right px-3 py-2 font-medium">Score</th>
                                        <th className="text-right px-3 py-2 w-16">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                      {criterion.options.map((opt) => (
                                        <tr key={opt.id} className="text-slate-300 hover:bg-slate-700/20">
                                          <td className="px-3 py-2">{opt.label}</td>
                                          <td className="px-3 py-2 text-right font-bold text-green-400">{opt.score}</td>
                                          <td className="px-3 py-2 text-right space-x-1">
                                            <button
                                              onClick={() => openEditOptionModal(opt, criterion.code)}
                                              className="text-slate-400 hover:text-slate-200"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteOption(opt.id)}
                                              disabled={saving}
                                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {criterion.ranges && criterion.ranges.length > 0 && (
                                <div className="rounded-lg border border-slate-700 overflow-hidden">
                                  <div className="bg-slate-700/50 px-4 py-2 text-xs font-medium text-slate-400 flex justify-between items-center">
                                    <span>Plages</span>
                                    <button
                                      onClick={() => openCreateRangeModal(criterion.id, criterion.code)}
                                      className="p-1 hover:bg-slate-600 rounded text-slate-300"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-slate-700/30 text-slate-400">
                                        <th className="text-left px-3 py-2 font-medium">Plage</th>
                                        <th className="text-center px-3 py-2 font-medium w-12">Min</th>
                                        <th className="text-center px-3 py-2 font-medium w-12">Max</th>
                                        <th className="text-right px-3 py-2 font-medium">Score</th>
                                        <th className="text-right px-3 py-2 w-16">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                      {criterion.ranges.map((r) => (
                                        <tr key={r.id} className="text-slate-300 hover:bg-slate-700/20">
                                          <td className="px-3 py-2">{r.label ?? "—"}</td>
                                          <td className="px-3 py-2 text-center font-mono">{r.minValue}</td>
                                          <td className="px-3 py-2 text-center font-mono">{r.maxValue === 999 ? "∞" : r.maxValue}</td>
                                          <td className="px-3 py-2 text-right font-bold text-green-400">{r.score}</td>
                                          <td className="px-3 py-2 text-right space-x-1">
                                            <button
                                              onClick={() => openEditRangeModal(r, criterion.code)}
                                              className="text-slate-400 hover:text-slate-200"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteRange(r.id)}
                                              disabled={saving}
                                              className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {domain.children && domain.children.length > 0 && <div className="px-5 py-3 border-t border-slate-700 bg-slate-700/20">
                      <button
                        onClick={() => openCreateCriterionModal(domain.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 rounded transition-colors text-sm"
                      >
                        <Plus size={14} />
                        Ajouter Critère
                      </button>
                    </div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !error && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-12 text-center">
            <p className="text-slate-400 font-medium">Aucun modèle configuré</p>
          </div>
        )
      )}

      {/* Action Buttons */}
      {questionnaire.length > 0 && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={openCreateDomainModal}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            Ajouter Domaine
          </button>
        </div>
      )}

      {/* Modals */}
      <NodeModal
        isOpen={nodeModalOpen}
        nodeType={nodeModalType}
        initialData={nodeModalData && 'code' in nodeModalData && 'label' in nodeModalData && typeof nodeModalData.code === 'string' && typeof nodeModalData.label === 'string' ? {
          id: nodeModalData.id,
          code: nodeModalData.code,
          label: nodeModalData.label,
          shortLabel: nodeModalData.shortLabel,
          description: nodeModalData.description,
          weight: nodeModalData.weight,
          answerType: nodeModalData.answerType,
        } : undefined}
        parentDomainCode={selectedDomainId ? questionnaire.find(d => d.id === selectedDomainId)?.code : undefined}
        onClose={() => setNodeModalOpen(false)}
        onSubmit={handleNodeSubmit}
        versionId={modelVersion?.id}
      />

      <OptionModal
        isOpen={optionModalOpen}
        criterionCode={selectedCriterionCode}
        initialData={optionModalData && 'label' in optionModalData && 'score' in optionModalData && typeof optionModalData.label === 'string' && typeof optionModalData.score === 'number' ? {
          id: optionModalData.id,
          label: optionModalData.label,
          score: optionModalData.score,
          description: undefined,
        } : undefined}
        onClose={() => setOptionModalOpen(false)}
        onSubmit={handleOptionSubmit}
      />

      <RangeModal
        isOpen={rangeModalOpen}
        criterionCode={selectedCriterionCode}
        initialData={rangeModalData && 'minValue' in rangeModalData && 'maxValue' in rangeModalData && 'score' in rangeModalData && typeof rangeModalData.minValue === 'number' && typeof rangeModalData.maxValue === 'number' && typeof rangeModalData.score === 'number' ? {
          id: rangeModalData.id,
          minValue: rangeModalData.minValue,
          maxValue: rangeModalData.maxValue,
          score: rangeModalData.score,
          label: rangeModalData.label,
        } : undefined}
        onClose={() => setRangeModalOpen(false)}
        onSubmit={handleRangeSubmit}
      />
    </div>
  );
}
