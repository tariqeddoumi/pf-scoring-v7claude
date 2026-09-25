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
  system_admin: "bg-destructive/15 text-red-300 border-destructive/30",
  scoring_admin: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  risk_manager: "bg-primary/20 text-blue-300 border-ring/30",
  committee_member: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  risk_analyst: "bg-success/15 text-green-300 border-success/30",
  auditor: "bg-warning/15 text-yellow-300 border-warning/30",
  read_only: "bg-secondary/20 text-muted-foreground border-input/30",
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
    system_admin: "bg-destructive",
    scoring_admin: "bg-orange-600",
    risk_manager: "bg-primary",
    committee_member: "bg-purple-600",
    risk_analyst: "bg-success",
    auditor: "bg-yellow-600",
    read_only: "bg-secondary",
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-foreground font-semibold text-sm flex-shrink-0 ${bgMap[role] || "bg-secondary"}`}>
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
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              {mode === "create" ? <Plus size={18} className="text-primary" /> : <Edit2 size={18} className="text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {mode === "create" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mode === "create" ? "Créer un nouveau compte utilisateur" : `Édition de ${user?.prenom} ${user?.nom}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {fieldErrors.global && (
            <div className="bg-destructive/10 border border-destructive/40 rounded-lg p-3 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle size={16} />
              {fieldErrors.global}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1.5">Prénom</label>
              <input
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                placeholder="Mohamed"
                className="w-full bg-card text-foreground text-sm px-3 py-2 rounded-lg border border-input focus:border-blue-400 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-foreground mb-1.5">Nom *</label>
              <input
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Alaoui"
                className={`w-full bg-card text-foreground text-sm px-3 py-2 rounded-lg border focus:border-blue-400 outline-none transition-colors ${fieldErrors.nom ? "border-destructive" : "border-input"}`}
              />
              {fieldErrors.nom && <p className="text-destructive text-xs mt-1">{fieldErrors.nom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="m.alaoui@banque.ma"
              className={`w-full bg-card text-foreground text-sm px-3 py-2 rounded-lg border focus:border-blue-400 outline-none transition-colors ${fieldErrors.email ? "border-destructive" : "border-input"}`}
            />
            {fieldErrors.email && <p className="text-destructive text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-foreground mb-2">Rôle</label>
            <div className="grid grid-cols-2 gap-2">
              {(["system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.role === r
                      ? "border-ring bg-primary/10 text-blue-300"
                      : "border-input text-muted-foreground hover:border-ring"
                  }`}
                >
                  <span>{ROLE_ICONS[r]}</span>
                  <span>{ROLE_LABELS[r]}</span>
                  {form.role === r && <span className="ml-auto text-primary">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {mode === "edit" && (
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Compte actif</p>
                <p className="text-xs text-muted-foreground">L&apos;utilisateur peut se connecter</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-success" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-input text-secondary-foreground hover:text-foreground hover:border-ring rounded-lg text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary disabled:bg-muted text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-background/80 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-sm text-muted-foreground">Gérez les comptes, rôles et accès</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchUsers} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg" title="Rafraîchir">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} /> Nouvel utilisateur
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground", icon: "👥" },
            { label: "Actifs", value: stats.active, color: "text-success", icon: "✅" },
            { label: "Admins", value: stats.admins, color: "text-destructive", icon: "🔴" },
            { label: "Analystes", value: stats.analysts, color: "text-success", icon: "🟢" },
          ].map((s) => (
            <div key={s.label} className="bg-background border border-border rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/40 rounded-xl p-4 flex items-center gap-3 text-destructive">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
          </div>
        )}
        {success && (
          <div className="bg-success/10 border border-green-500/40 rounded-xl p-4 flex items-center gap-3 text-success">
            <UserCheck size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card text-foreground text-sm px-4 py-2 pl-9 rounded-lg border border-input focus:border-blue-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-card rounded-lg border border-input p-1">
            {["ALL", "system_admin", "scoring_admin", "risk_manager", "committee_member", "risk_analyst", "auditor", "read_only"].map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${roleFilter === r ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}>
                {r === "ALL" ? "Tous" : ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-card rounded-lg border border-input p-1">
            {[{ value: "active", label: "Actifs" }, { value: "all", label: "Tous" }].map((f) => (
              <button key={f.value} onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeFilter === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {filtered.length} utilisateur{filtered.length !== 1 ? "s" : ""}
              {(search || roleFilter !== "ALL") ? ` (filtrés sur ${users.length})` : ""}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
              <RefreshCw size={20} className="animate-spin" /> Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Shield size={36} />
              <p>{search || roleFilter !== "ALL" ? "Aucun résultat" : "Aucun utilisateur"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-2 bg-card/50">
                <span />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Utilisateur</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rôle</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statut</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dernière connexion</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</span>
              </div>

              {filtered.map((user) => (
                <div key={user.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-card/30 transition-colors">
                  <Avatar nom={user.nom} prenom={user.prenom} role={user.role} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{user.prenom} {user.nom}</span>
                      {!user.isActive && (
                        <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded">Inactif</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground truncate block">{user.email}</span>
                  </div>

                  <Badge className={ROLE_COLORS[user.role]}>
                    {ROLE_ICONS[user.role]} {ROLE_LABELS[user.role]}
                  </Badge>

                  <div className="flex items-center gap-1.5">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Actif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Inactif
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelative(user.lastLoginAt)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(user)} title="Modifier"
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteConfirm(user)} title="Supprimer"
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-accent rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
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
          <div className="relative bg-background border border-destructive/40 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/15 rounded-xl flex-shrink-0">
                <Trash2 size={20} className="text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">Supprimer l&apos;utilisateur</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold text-foreground">
                    {deleteConfirm.prenom} {deleteConfirm.nom}
                  </span>{" "}
                  ({deleteConfirm.email}) ? Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 border border-input text-secondary-foreground hover:text-foreground rounded-lg text-sm transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive disabled:bg-muted text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
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
