"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronRight, ChevronDown, Plus, Trash2, Edit2,
  Save, X, Settings2, BarChart2, List, Sliders, RefreshCw,
  AlertCircle, CheckCircle2, Info, GripVertical, Layers,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoringModel {
  id: string;
  code: string;
  label: string;
  description?: string;
}

interface ScoringVersion {
  id: string;
  modelId: string;
  versionNumber: number;
  label?: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
}

interface ScoringNodeOption {
  id: string;
  label: string;
  code?: string;
  score: number;
  orderIndex: number;
  isActive: boolean;
}

interface ScoringNodeRange {
  id: string;
  label?: string;
  minValue: number;
  maxValue: number;
  score: number;
  orderIndex: number;
  isActive: boolean;
}

interface ScoringNode {
  id: string;
  versionId: string;
  parentNodeId: string | null;
  nodeType: string;
  code: string;
  label: string;
  shortLabel?: string;
  description?: string;
  depth: number;
  orderIndex: number;
  weight?: number;
  weightMode?: string;
  aggregationMethod?: string;
  answerType?: string;
  isActive: boolean;
  isTerminal: boolean;
  isScoringLeaf: boolean;
  childNodes?: ScoringNode[];
  options?: ScoringNodeOption[];
  ranges?: ScoringNodeRange[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_TYPE_LABELS: Record<string, string> = {
  DOMAIN: "Domaine",
  GROUP: "Critère",
  CRITERION: "Critère",
  SUB_CRITERION: "Sous-critère",
  SUB_SUB_CRITERION: "Sous-sous-critère",
  LEAF: "Feuille",
  BLOCK: "Bloc",
};

const NODE_TYPE_COLORS: Record<string, string> = {
  DOMAIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  GROUP: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  CRITERION: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  SUB_CRITERION: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  SUB_SUB_CRITERION: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  LEAF: "bg-green-500/20 text-green-300 border-green-500/30",
};

const NODE_TYPE_INDENT: Record<number, string> = {
  0: "ml-0",
  1: "ml-6",
  2: "ml-12",
  3: "ml-18",
  4: "ml-24",
};

const ANSWER_TYPES = [
  { value: "OPTION_SINGLE", label: "Choix unique (options)" },
  { value: "OPTION_MULTI", label: "Choix multiples" },
  { value: "NUMERIC_RANGE", label: "Valeur numérique (plages)" },
  { value: "BOOLEAN", label: "Oui / Non" },
  { value: "TEXT", label: "Texte libre" },
  { value: "FORMULA", label: "Formule calculée" },
];

const AGG_METHODS = [
  { value: "AVERAGE", label: "Moyenne pondérée" },
  { value: "WEIGHTED_SUM", label: "Somme pondérée" },
  { value: "MIN", label: "Minimum" },
  { value: "MAX", label: "Maximum" },
  { value: "FIRST", label: "Premier" },
];

const CHILD_NODE_TYPES: Record<string, string> = {
  DOMAIN: "GROUP",
  GROUP: "SUB_CRITERION",
  CRITERION: "SUB_CRITERION",
  SUB_CRITERION: "SUB_SUB_CRITERION",
  SUB_SUB_CRITERION: "LEAF",
};

// ─── Helper: build tree from flat list ───────────────────────────────────────

function buildTree(nodes: ScoringNode[]): ScoringNode[] {
  const map = new Map<string, ScoringNode>();
  const roots: ScoringNode[] = [];
  nodes.forEach((n) => { map.set(n.id, { ...n, childNodes: [] }); });
  nodes.forEach((n) => {
    const node = map.get(n.id)!;
    if (n.parentNodeId && map.has(n.parentNodeId)) {
      map.get(n.parentNodeId)!.childNodes!.push(node);
    } else {
      roots.push(node);
    }
  });
  const sort = (arr: ScoringNode[]) => {
    arr.sort((a, b) => a.orderIndex - b.orderIndex);
    arr.forEach((n) => sort(n.childNodes || []));
  };
  sort(roots);
  return roots;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

function OptionEditor({
  nodeId,
  options,
  onRefresh,
}: {
  nodeId: string;
  options: ScoringNodeOption[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newScore, setNewScore] = useState<number>(50);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editScore, setEditScore] = useState<number>(50);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/admin/scoring/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, label: newLabel, code: newCode || undefined, score: newScore }),
      });
      setNewLabel(""); setNewCode(""); setNewScore(50); setAdding(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleEdit = async (optId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/scoring/options?optionId=${optId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel, score: editScore }),
      });
      setEditId(null);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (optId: string) => {
    if (!confirm("Supprimer cette option ?")) return;
    await fetch(`/api/admin/scoring/options?optionId=${optId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <List size={12} /> Options de notation ({options.length})
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      <div className="space-y-1">
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2 bg-slate-800/50 rounded px-2 py-1.5">
            {editId === opt.id ? (
              <>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="flex-1 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                />
                <input
                  type="number"
                  value={editScore}
                  onChange={(e) => setEditScore(Number(e.target.value))}
                  className="w-20 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                  min={0} max={100}
                />
                <button onClick={() => handleEdit(opt.id)} disabled={saving}
                  className="text-green-400 hover:text-green-300 p-1"><Save size={13} /></button>
                <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-white p-1">
                  <X size={13} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-200">{opt.label}</span>
                {opt.code && <span className="text-xs text-slate-500 font-mono">{opt.code}</span>}
                <div className="flex items-center gap-1">
                  <div
                    className="w-8 h-2 rounded-full"
                    style={{ background: `hsl(${opt.score * 1.2}, 70%, 50%)` }}
                  />
                  <span className="text-xs font-bold text-yellow-400 w-8 text-right">{opt.score}</span>
                </div>
                <button
                  onClick={() => { setEditId(opt.id); setEditLabel(opt.label); setEditScore(opt.score ?? 0); }}
                  className="text-slate-400 hover:text-blue-400 p-1"><Edit2 size={12} /></button>
                <button onClick={() => handleDelete(opt.id)} className="text-slate-400 hover:text-red-400 p-1">
                  <Trash2 size={12} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-2 bg-slate-800 border border-blue-500/30 rounded p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Libellé *"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="col-span-2 bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
            />
            <input
              placeholder="Code (opt.)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Score (0-100) :</label>
            <input
              type="range"
              min={0} max={100}
              value={newScore}
              onChange={(e) => setNewScore(Number(e.target.value))}
              className="flex-1 accent-yellow-400"
            />
            <span className="text-sm font-bold text-yellow-400 w-8">{newScore}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)}
              className="text-xs px-3 py-1.5 text-slate-400 hover:text-white border border-slate-600 rounded">
              Annuler
            </button>
            <button onClick={handleAdd} disabled={saving || !newLabel.trim()}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded flex items-center gap-1">
              {saving ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
              Ajouter l&apos;option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RangeEditor({
  nodeId,
  ranges,
  onRefresh,
}: {
  nodeId: string;
  ranges: ScoringNodeRange[];
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ minValue: 0, maxValue: 1, score: 50, label: "" });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ minValue: 0, maxValue: 1, score: 50, label: "" });

  const handleAdd = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/scoring/ranges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId, ...form }),
      });
      setForm({ minValue: 0, maxValue: 1, score: 50, label: "" });
      setAdding(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleEdit = async (rangeId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/scoring/ranges?rangeId=${rangeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async (rangeId: string) => {
    if (!confirm("Supprimer cette plage ?")) return;
    await fetch(`/api/admin/scoring/ranges?rangeId=${rangeId}`, { method: "DELETE" });
    onRefresh();
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sliders size={12} /> Plages numériques ({ranges.length})
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      <div className="space-y-1">
        {ranges.map((r) => (
          <div key={r.id} className="flex items-center gap-2 bg-slate-800/50 rounded px-2 py-1.5">
            {editId === r.id ? (
              <>
                <input type="number" value={editForm.minValue}
                  onChange={(e) => setEditForm({ ...editForm, minValue: Number(e.target.value) })}
                  className="w-20 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                />
                <span className="text-slate-400">à</span>
                <input type="number" value={editForm.maxValue}
                  onChange={(e) => setEditForm({ ...editForm, maxValue: Number(e.target.value) })}
                  className="w-20 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                />
                <input value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  placeholder="Libellé"
                  className="flex-1 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                />
                <input type="number" value={editForm.score} min={0} max={100}
                  onChange={(e) => setEditForm({ ...editForm, score: Number(e.target.value) })}
                  className="w-16 bg-slate-700 text-white text-sm px-2 py-1 rounded border border-slate-500"
                />
                <button onClick={() => handleEdit(r.id)} disabled={saving}
                  className="text-green-400 hover:text-green-300 p-1"><Save size={13} /></button>
                <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-white p-1">
                  <X size={13} /></button>
              </>
            ) : (
              <>
                <span className="text-xs font-mono text-slate-300 w-24">
                  [{r.minValue} → {r.maxValue}[
                </span>
                <span className="flex-1 text-sm text-slate-400 italic">{r.label || "—"}</span>
                <span className={`text-sm font-bold w-8 text-right ${scoreColor(r.score ?? 0)}`}>
                  {r.score}
                </span>
                <button
                  onClick={() => { setEditId(r.id); setEditForm({ minValue: r.minValue, maxValue: r.maxValue, score: r.score ?? 0, label: r.label || "" }); }}
                  className="text-slate-400 hover:text-blue-400 p-1"><Edit2 size={12} /></button>
                <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-400 p-1">
                  <Trash2 size={12} /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <div className="mt-2 bg-slate-800 border border-blue-500/30 rounded p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400">Valeur min *</label>
              <input type="number" value={form.minValue}
                onChange={(e) => setForm({ ...form, minValue: Number(e.target.value) })}
                className="w-full mt-1 bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Valeur max *</label>
              <input type="number" value={form.maxValue}
                onChange={(e) => setForm({ ...form, maxValue: Number(e.target.value) })}
                className="w-full mt-1 bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Libellé descriptif</label>
            <input value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex: DSCR excellent (≥ 2.0)"
              className="w-full mt-1 bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Score (0-100) :</label>
            <input type="range" min={0} max={100} value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              className="flex-1 accent-yellow-400"
            />
            <span className="text-sm font-bold text-yellow-400 w-8">{form.score}</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)}
              className="text-xs px-3 py-1.5 text-slate-400 hover:text-white border border-slate-600 rounded">
              Annuler
            </button>
            <button onClick={handleAdd} disabled={saving}
              className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded flex items-center gap-1">
              {saving ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
              Ajouter la plage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NodeRow: one node in the tree ───────────────────────────────────────────

function NodeRow({
  node,
  versionId,
  onRefresh,
}: {
  node: ScoringNode;
  versionId: string;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(node.depth < 2);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    label: node.label,
    shortLabel: node.shortLabel || "",
    description: node.description || "",
    weight: node.weight ?? 0,
    aggregationMethod: node.aggregationMethod || "AVERAGE",
    answerType: node.answerType || "",
  });
  const [saving, setSaving] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({ code: "", label: "", answerType: "OPTION_SINGLE" });
  const [addingSaving, setAddingSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasChildren = (node.childNodes?.length ?? 0) > 0;
  const childType = CHILD_NODE_TYPES[node.nodeType];
  const showAnswerEditor = node.answerType === "OPTION_SINGLE" || node.answerType === "OPTION_MULTI";
  const showRangeEditor = node.answerType === "NUMERIC_RANGE";
  const indentPx = node.depth * 24;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/scoring/nodes?nodeId=${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditing(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${node.label}" et tous ses enfants ?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/scoring/nodes?nodeId=${node.id}`, { method: "DELETE" });
      onRefresh();
    } finally { setDeleting(false); }
  };

  const handleAddChild = async () => {
    if (!childForm.code.trim() || !childForm.label.trim()) return;
    setAddingSaving(true);
    try {
      await fetch("/api/admin/scoring/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId,
          parentNodeId: node.id,
          nodeType: childType,
          code: childForm.code,
          label: childForm.label,
          depth: node.depth + 1,
          orderIndex: node.childNodes?.length ?? 0,
          answerType: childForm.answerType,
        }),
      });
      setChildForm({ code: "", label: "", answerType: "OPTION_SINGLE" });
      setShowAddChild(false);
      setExpanded(true);
      onRefresh();
    } finally { setAddingSaving(false); }
  };

  return (
    <div>
      {/* Row */}
      <div
        className={`group flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/60 transition-all ${editing ? "bg-slate-800 border border-blue-500/40" : ""}`}
        style={{ marginLeft: `${indentPx}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`mt-1 flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 transition-transform ${hasChildren ? "" : "opacity-0 pointer-events-none"}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Node content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Libellé *</label>
                  <input
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Libellé court</label>
                  <input
                    value={editForm.shortLabel}
                    onChange={(e) => setEditForm({ ...editForm, shortLabel: e.target.value })}
                    className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Poids (%)</label>
                  <input
                    type="number" min={0} max={1} step={0.001}
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Agrégation</label>
                  <select
                    value={editForm.aggregationMethod}
                    onChange={(e) => setEditForm({ ...editForm, aggregationMethod: e.target.value })}
                    className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
                  >
                    {AGG_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Type de réponse</label>
                  <select
                    value={editForm.answerType}
                    onChange={(e) => setEditForm({ ...editForm, answerType: e.target.value })}
                    className="w-full mt-1 bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-500 focus:border-blue-400 outline-none"
                  >
                    <option value="">— Aucun (nœud parent) —</option>
                    {ANSWER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)}
                  className="text-xs px-3 py-1.5 border border-slate-600 text-slate-400 hover:text-white rounded">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded flex items-center gap-1">
                  {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={NODE_TYPE_COLORS[node.nodeType] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}>
                    {NODE_TYPE_LABELS[node.nodeType] || node.nodeType}
                  </Badge>
                  <span className="font-mono text-xs text-slate-500">{node.code}</span>
                  <span className="font-medium text-white">{node.label}</span>
                  {node.shortLabel && (
                    <span className="text-slate-400 text-sm">({node.shortLabel})</span>
                  )}
                  {node.weight != null && (
                    <span className="text-xs text-yellow-400/80">
                      {(node.weight * 100).toFixed(1)}%
                    </span>
                  )}
                  {node.answerType && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                      {ANSWER_TYPES.find((t) => t.value === node.answerType)?.label || node.answerType}
                    </span>
                  )}
                  {node.aggregationMethod && !node.answerType && (
                    <span className="text-xs text-slate-500">∑ {node.aggregationMethod}</span>
                  )}
                </div>
                {node.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{node.description}</p>
                )}

                {/* Options / Ranges (only when expanded + has answer type) */}
                {expanded && (showAnswerEditor || showRangeEditor) && (
                  <div className="mt-2 pl-2 border-l-2 border-slate-700">
                    {showAnswerEditor && (
                      <OptionEditor
                        nodeId={node.id}
                        options={node.options || []}
                        onRefresh={onRefresh}
                      />
                    )}
                    {showRangeEditor && (
                      <RangeEditor
                        nodeId={node.id}
                        ranges={node.ranges || []}
                        onRefresh={onRefresh}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Actions (visible on hover) */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {childType && (
                  <button
                    onClick={() => setShowAddChild(!showAddChild)}
                    title={`Ajouter ${NODE_TYPE_LABELS[childType] || "enfant"}`}
                    className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <button
                  onClick={() => setEditing(true)}
                  title="Modifier"
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded"
                >
                  <Edit2 size={14} />
                </button>
                {node.depth > 0 && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Supprimer"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add child form */}
          {showAddChild && childType && (
            <div className="mt-2 bg-slate-800/80 border border-green-500/30 rounded-lg p-3 space-y-2">
              <p className="text-xs text-green-400 font-semibold">
                Nouveau {NODE_TYPE_LABELS[childType] || childType} sous "{node.code}"
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Code *"
                  value={childForm.code}
                  onChange={(e) => setChildForm({ ...childForm, code: e.target.value.toUpperCase() })}
                  className="bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-green-400 outline-none font-mono"
                />
                <input
                  placeholder="Libellé *"
                  value={childForm.label}
                  onChange={(e) => setChildForm({ ...childForm, label: e.target.value })}
                  className="col-span-2 bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-green-400 outline-none"
                />
              </div>
              <select
                value={childForm.answerType}
                onChange={(e) => setChildForm({ ...childForm, answerType: e.target.value })}
                className="w-full bg-slate-700 text-white text-sm px-2 py-1.5 rounded border border-slate-500 focus:border-green-400 outline-none"
              >
                <option value="">— Pas de réponse (nœud parent) —</option>
                {ANSWER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddChild(false)}
                  className="text-xs px-3 py-1.5 border border-slate-600 text-slate-400 hover:text-white rounded">
                  Annuler
                </button>
                <button
                  onClick={handleAddChild}
                  disabled={addingSaving || !childForm.code.trim() || !childForm.label.trim()}
                  className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white rounded flex items-center gap-1"
                >
                  {addingSaving ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
                  Créer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && node.childNodes && node.childNodes.length > 0 && (
        <div>
          {node.childNodes.map((child) => (
            <NodeRow key={child.id} node={child} versionId={versionId} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScoringGridV7ppPage() {
  const [models, setModels] = useState<ScoringModel[]>([]);
  const [versions, setVersions] = useState<ScoringVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState<ScoringModel | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ScoringVersion | null>(null);
  const [tree, setTree] = useState<ScoringNode[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [stats, setStats] = useState({ domains: 0, criteria: 0, subCriteria: 0, options: 0, ranges: 0 });

  // Load models on mount
  useEffect(() => {
    fetch("/api/admin/scoring/models")
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setModels(list);
        if (list.length > 0) setSelectedModel(list[0]);
      })
      .catch(() => setError("Impossible de charger les modèles"))
      .finally(() => setLoadingModels(false));
  }, []);

  // Load versions when model changes
  useEffect(() => {
    if (!selectedModel) return;
    setVersions([]);
    setSelectedVersion(null);
    setTree([]);
    fetch(`/api/admin/scoring/models/${selectedModel.id}/versions`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setVersions(list);
        const published = list.find((v: ScoringVersion) => v.isPublished) || list[0];
        if (published) setSelectedVersion(published);
      });
  }, [selectedModel]);

  // Load nodes when version changes
  const loadNodes = useCallback(async () => {
    if (!selectedVersion) return;
    setLoadingNodes(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/scoring/nodes?versionId=${selectedVersion.id}`);
      const d = await r.json();
      const flat: ScoringNode[] = d.data || [];
      const built = buildTree(flat);
      setTree(built);

      // Compute stats
      const domains = flat.filter((n) => n.nodeType === "DOMAIN").length;
      const criteria = flat.filter((n) => ["GROUP", "CRITERION"].includes(n.nodeType)).length;
      const subCriteria = flat.filter((n) => ["SUB_CRITERION", "SUB_SUB_CRITERION", "LEAF"].includes(n.nodeType)).length;
      const options = flat.reduce((acc, n) => acc + (n.options?.length ?? 0), 0);
      const ranges = flat.reduce((acc, n) => acc + (n.ranges?.length ?? 0), 0);
      setStats({ domains, criteria, subCriteria, options, ranges });
    } catch {
      setError("Impossible de charger les nœuds");
    } finally {
      setLoadingNodes(false);
    }
  }, [selectedVersion]);

  useEffect(() => { loadNodes(); }, [loadNodes]);

  // Filter tree by search/type
  const filterNodes = (nodes: ScoringNode[]): ScoringNode[] => {
    if (!searchQuery && filterType === "ALL") return nodes;
    return nodes.flatMap((n) => {
      const matchesSearch = !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "ALL" || n.nodeType === filterType;
      const filteredChildren = filterNodes(n.childNodes || []);
      if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
        return [{ ...n, childNodes: filteredChildren }];
      }
      return [];
    });
  };

  const filteredTree = filterNodes(tree);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Layers size={20} className="text-purple-400" />
                  Paramétrage Grille de Scoring V7++
                </h1>
                <p className="text-slate-400 text-sm">
                  Modèle hiérarchique IFC/EBRD/Basel — Paramétrage par domaine, critère, sous-critère
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Model selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Modèle</label>
                <select
                  value={selectedModel?.id || ""}
                  onChange={(e) => {
                    const m = models.find((x) => x.id === e.target.value);
                    setSelectedModel(m || null);
                  }}
                  className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded border border-slate-600 focus:border-purple-400 outline-none"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.label} ({m.code})</option>
                  ))}
                </select>
              </div>

              {/* Version selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Version</label>
                <select
                  value={selectedVersion?.id || ""}
                  onChange={(e) => {
                    const v = versions.find((x) => x.id === e.target.value);
                    setSelectedVersion(v || null);
                  }}
                  className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded border border-slate-600 focus:border-purple-400 outline-none"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      V{v.versionNumber} {v.label ? `— ${v.label}` : ""} {v.isPublished ? "✓" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadNodes}
                disabled={loadingNodes}
                className="mt-5 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw size={16} className={loadingNodes ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Domaines", value: stats.domains, color: "text-purple-400", icon: "🏛" },
            { label: "Critères", value: stats.criteria, color: "text-blue-400", icon: "📋" },
            { label: "Sous-critères", value: stats.subCriteria, color: "text-cyan-400", icon: "🔍" },
            { label: "Options", value: stats.options, color: "text-green-400", icon: "☑️" },
            { label: "Plages numériques", value: stats.ranges, color: "text-yellow-400", icon: "📊" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              placeholder="Rechercher par code ou libellé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm px-4 py-2 pl-9 rounded-lg border border-slate-600 focus:border-purple-400 outline-none"
            />
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 focus:border-purple-400 outline-none"
          >
            <option value="ALL">Tous les types</option>
            <option value="DOMAIN">Domaines uniquement</option>
            <option value="GROUP">Critères (GROUP)</option>
            <option value="SUB_CRITERION">Sous-critères</option>
            <option value="SUB_SUB_CRITERION">Sous-sous-critères</option>
          </select>
          {(searchQuery || filterType !== "ALL") && (
            <button
              onClick={() => { setSearchQuery(""); setFilterType("ALL"); }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-3 py-2 border border-slate-600 rounded-lg"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Tree ── */}
        {loadingModels || loadingNodes ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <RefreshCw size={24} className="animate-spin mr-3" />
            Chargement de la hiérarchie...
          </div>
        ) : !selectedVersion ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Info size={40} />
            <p>Sélectionnez un modèle et une version pour commencer</p>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Info size={40} />
            <p>{searchQuery ? "Aucun résultat pour cette recherche" : "Aucun nœud dans cette version"}</p>
            {!searchQuery && (
              <p className="text-sm">
                Exécutez <code className="bg-slate-800 px-2 py-0.5 rounded">SUPABASE_V3_COMPLETE_SEED.sql</code> dans Supabase pour peupler la structure
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
            <div className="border-b border-slate-700 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">
                Hiérarchie — {filteredTree.length} domaine(s) racine
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Edit2 size={11} /> Survoler pour éditer</span>
                <span className="flex items-center gap-1"><Plus size={11} /> Ajouter un enfant</span>
                <span className="flex items-center gap-1"><Sliders size={11} /> Options/Plages inline</span>
              </div>
            </div>
            <div className="p-4 space-y-1">
              {filteredTree.map((node) => (
                <NodeRow key={node.id} node={node} versionId={selectedVersion.id} onRefresh={loadNodes} />
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ── */}
        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold">Légende :</span>
          {Object.entries(NODE_TYPE_LABELS).map(([type, label]) => (
            <Badge key={type} className={NODE_TYPE_COLORS[type] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}>
              {label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
