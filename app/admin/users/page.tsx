"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Edit2, Shield, Search, X, RefreshCw,
  UserCheck, Save, AlertCircle,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "system_admin" | "scoring_admin" | "risk_manager" | "committee_member" | "risk_analyst" | "auditor" | "read_only";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type FormMode = "create" | "edit";

interface UserForm {
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  isActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  system_admin: "Super Admin",
  scoring_admin: "Admin Scoring",
  risk_manager: "Gestionnaire Risque",
  committee_member: "Membre Comité",
  risk_analyst: "Analyste Risque",
  auditor: "Auditeur",
  read_only: "Lecture seule",
};

const ROLE_COLORS: Record<string, string> = {
  system_admin: "bg-red-500/20 text-red-300 border-red-500/30",
  scoring_admin: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  risk_manager: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  committee_member: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  risk_analyst: "bg-green-500/20 text-green-300 border-green-500/30",
  auditor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  read_only: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const ROLE_ICONS: Record<string, string> = {
  system_admin: "🔴",
  scoring_admin: "🟠",
  risk_manager: "🔵",
  committee_member: "🟣",
  risk_analyst: "🟢",
  auditor: "🟡",
  read_only: "⚪",
};

const EMPTY_FORM: UserForm = {
  email: "",
  nom: "",
  prenom: "",
  role: "risk_analyst",
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

function Avatar({ nom, prenom, role }: { nom: string; prenom: string; role: string }) {
  const initials = `${prenom[0] || ""}${nom[0] || ""}`.toUpperCase() || "?";
  const bgMap: Record<string, string> = {
    system_admin: "bg-red-600",
    scoring_admin: "bg-orange-600",
    risk_manager: "bg-blue-600",
    committee_member: "bg-purple-600",
    risk_analyst: "bg-green-600",
    auditor: "bg-yellow-600",
    read_only: "bg-slate-600",
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${bgMap[role] || "bg-slate-600"}`}>
      {initials}
    </div>
  );
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "Jamais";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Il y a ${days}j`;
  return d.toLocaleDateString("fr-FR");
}

// ─── Modal component ──────────────────────────────────────────────────────────

function UserModal({
  mode,
  user,
  onSave,
  onClose,
}: {
  mode: FormMode;
  user: User | null;
  onSave: (form: UserForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<UserForm>(
    user
      ? { email: user.email, nom: user.nom, prenom: user.prenom, role: user.role, isActive: user.isActive }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UserForm | "global", string>>>({});

  const validate = (): boolean => {
    const errs: typeof fieldErrors = {};
    if (!form.email.trim()) errs.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Format invalide";
    if (!form.nom.trim()) errs.nom = "Nom requis";
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setFieldErrors({});
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setFieldErrors({ global: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              {mode === "create" ? <Plus size={18} className="text-blue-400" /> : <Edit2 size={18} className="text-blue-400" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {mode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === "create" ? "Créer un nouveau compte utilisateur" : `Édition de ${user?.prenom} ${user?.nom}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {fieldErrors.global && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {fieldErrors.global}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
              <input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Mohamed"
                className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom *</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Alaoui"
                className={`w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border focus:border-blue-400 outline-none transition-colors ${fieldErrors.nom ? "border-red-500" : "border-slate-600"}`}
              />
              {fieldErrors.nom && <p className="text-red-400 text-xs mt-1">{fieldErrors.nom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="m.alaoui@banque.ma"
              className={`w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border focus:border-blue-400 outline-none transition-colors ${fieldErrors.email ? "border-red-500" : "border-slate-600"}`}
            />
            {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rôle</label>
            <div className="grid grid-cols-2 gap-2">
              {(["system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.role === r
                      ? "border-blue-500 bg-blue-500/10 text-blue-300"
                      : "border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span>{ROLE_ICONS[r]}</span>
                  <span>{ROLE_LABELS[r]}</span>
                  {form.role === r && <span className="ml-auto text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {mode === "edit" && (
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div>
                <p className="text-sm font-medium text-white">Compte actif</p>
                <p className="text-xs text-slate-400">L&apos;utilisateur peut se connecter</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-slate-600"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 rounded-lg text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {mode === "create" ? "Créer l'utilisateur" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<FormMode>("create");
  const [modalUser, setModalUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("active");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("active", activeFilter === "active" ? "true" : "false");
      const response = await apiGet(`/api/admin/users?${params}`);
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
    } catch {
      setError("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreate = async (form: UserForm) => {
    const res = await apiPost("/api/admin/users", form);
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Erreur lors de la création");
    }
    await fetchUsers();
    showSuccessMsg("Utilisateur créé avec succès");
  };

  const handleEdit = async (form: UserForm) => {
    if (!modalUser) return;
    const res = await apiPut(`/api/admin/users/${modalUser.id}`, form);
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Erreur lors de la mise à jour");
    }
    await fetchUsers();
    showSuccessMsg("Utilisateur mis à jour");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await apiDelete(`/api/admin/users/${deleteConfirm.id}`);
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      showSuccessMsg("Utilisateur supprimé");
    } catch {
      setError("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => { setModalMode("create"); setModalUser(null); setShowModal(true); };
  const openEdit = (u: User) => { setModalMode("edit"); setModalUser(u); setShowModal(true); };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === "system_admin" || u.role === "scoring_admin").length,
    analysts: users.filter((u) => u.role === "risk_analyst").length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield size={20} className="text-blue-400" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-sm text-slate-400">Gérez les comptes, rôles et accès</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="Rafraîchir">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-white", icon: "👥" },
            { label: "Actifs", value: stats.active, color: "text-green-400", icon: "✅" },
            { label: "Admins", value: stats.admins, color: "text-red-400", icon: "🔴" },
            { label: "Analystes", value: stats.analysts, color: "text-green-400", icon: "🟢" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 flex items-center gap-3 text-green-400">
            <UserCheck size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 text-white text-sm px-4 py-2 pl-9 rounded-lg border border-slate-600 focus:border-blue-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-600 p-1">
            {["ALL", "system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${roleFilter === r ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {r === "ALL" ? "Tous" : ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg border border-slate-600 p-1">
            {[{ value: "active", label: "Actifs" }, { value: "all", label: "Tous" }].map((f) => (
              <button key={f.value} onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeFilter === f.value ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="border-b border-slate-700 px-4 py-3">
            <span className="text-sm text-slate-400">
              {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
              {(search || roleFilter !== "ALL") ? ` (filtrés sur ${users.length})` : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
              <RefreshCw size={20} className="animate-spin" /> Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Shield size={36} />
              <p>{search || roleFilter !== "ALL" ? "Aucun résultat" : "Aucun utilisateur"}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2 bg-slate-800/50">
                <span />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Utilisateur</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Rôle</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Statut</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dernière connexion</span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</span>
              </div>

              {filtered.map((user) => (
                <div key={user.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-slate-800/30 transition-colors">
                  <Avatar nom={user.nom} prenom={user.prenom} role={user.role} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{user.prenom} {user.nom}</span>
                      {!user.isActive && (
                        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Inactif</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-400 truncate block">{user.email}</span>
                  </div>

                  <Badge className={ROLE_COLORS[user.role]}>
                    {ROLE_ICONS[user.role]} {ROLE_LABELS[user.role]}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Actif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Inactif
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatRelative(user.lastLoginAt)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(user)} title="Modifier"
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(user)} title="Supprimer"
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-slate-500">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <span key={role} className="flex items-center gap-1.5">
              <span>{ROLE_ICONS[role]}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <UserModal
          mode={modalMode}
          user={modalUser}
          onSave={modalMode === "create" ? handleCreate : handleEdit}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 border border-red-500/40 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl flex-shrink-0">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Supprimer l&apos;utilisateur</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold text-white">
                    {deleteConfirm.prenom} {deleteConfirm.nom}
                  </span>{" "}
                  ({deleteConfirm.email}) ? Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 hover:text-white rounded-lg text-sm transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
