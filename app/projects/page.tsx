"use client";

import Link from "next/link";
import { Plus, Search, Eye, Edit2, Trash2, Filter, X, Lock } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/types/models";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { usePermission } from "@/lib/hooks/usePermission";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export default function ProjectsPage() {
  const router = useRouter();
  const { can } = usePermission();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSecteur, setFilterSecteur] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "Escape",
      callback: () => setDeleteConfirm(null),
      enabled: deleteConfirm !== null,
    },
    {
      key: "Enter",
      callback: () => deleteConfirm && handleDelete(deleteConfirm),
      enabled: deleteConfirm !== null && !deleting,
    },
  ]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      setProjects(projects.filter((p) => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const uniqueSecteurs = useMemo(() => [...new Set(projects.map((p) => p.secteur).filter(Boolean))].sort(), [projects]);
  const activeFilterCount = [filterStatus, filterSecteur].filter(Boolean).length;
  const clearFilters = () => { setFilterStatus(""); setFilterSecteur(""); };

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch = !searchTerm || project.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || project.status === filterStatus;
    const matchesSecteur = !filterSecteur || project.secteur === filterSecteur;
    return matchesSearch && matchesStatus && matchesSecteur;
  }), [projects, searchTerm, filterStatus, filterSecteur]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Projets</h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Gérez les projets et leur suivi
          </p>
        </div>
        {can("project", "create") ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all w-full md:w-auto justify-center md:justify-start"
          >
            <Plus size={20} />
            <span>Nouveau projet</span>
          </Link>
        ) : (
          <div className="inline-flex items-center space-x-2 bg-slate-700/50 text-slate-400 font-semibold px-4 py-2 rounded-lg w-full md:w-auto justify-center md:justify-start" title="Vous n'avez pas la permission de créer des projets">
            <Lock size={20} />
            <span>Nouveau projet</span>
          </div>
        )}
      </div>

      {/* Search Bar + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm md:text-base"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
            showFilters || activeFilterCount > 0
              ? "bg-blue-600 text-white"
              : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
          }`}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filtres</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 bg-white/20 text-xs rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Filtres avancés</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Statut</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                <option value="brouillon">Brouillon</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Secteur</label>
              <select value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="">Tous</option>
                {uniqueSecteurs.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <p className="text-sm text-slate-400">
          {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""} trouvé{filteredProjects.length !== 1 ? "s" : ""}
          {(searchTerm || activeFilterCount > 0) && ` sur ${projects.length}`}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton rows={6} columns={6} />}

      {/* Table View - Desktop */}
      {!loading && filteredProjects.length > 0 && (
        <div className="rounded-lg border border-slate-700 overflow-x-auto">
          <table className="w-full min-w-max md:min-w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Nom
                </th>
                <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Secteur
                </th>
                <th className="hidden md:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Pays
                </th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Montant
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs md:text-sm font-semibold text-slate-300">
                  Statut
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs md:text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-slate-800 transition-colors"
                >
                  <td className="px-4 md:px-6 py-4 font-semibold text-white text-sm md:text-base">
                    {project.nom}
                  </td>
                  <td className="hidden sm:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {project.secteur || "-"}
                  </td>
                  <td className="hidden md:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {project.pays || "-"}
                  </td>
                  <td className="hidden lg:table-cell px-4 md:px-6 py-4 text-slate-400 text-xs md:text-sm">
                    {project.montant
                      ? `${project.montant} ${project.devise || "MAD"}`
                      : "-"}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium inline-block ${
                        project.status === "Actif"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1 md:space-x-2">
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Consulter"
                      >
                        <Eye size={16} className="md:w-5 md:h-5" />
                      </button>
                      {can("project", "update") && (
                        <button
                          onClick={() =>
                            router.push(`/projects/${project.id}/edit`)
                          }
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 size={16} className="md:w-5 md:h-5" />
                        </button>
                      )}
                      {can("project", "delete") && (
                        <button
                          onClick={() => setDeleteConfirm(project.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="md:w-5 md:h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">Aucun projet trouvé</p>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            {searchTerm
              ? "Essayez une autre recherche"
              : "Créez votre premier projet"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirm !== null}
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
        isDeleting={deleting}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />
    </div>
  );
}
