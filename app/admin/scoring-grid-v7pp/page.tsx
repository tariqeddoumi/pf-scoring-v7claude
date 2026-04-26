"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { VersionHeaderBar } from "./components/VersionHeaderBar";
import { ScoringGridSplit } from "./components/ScoringGridSplit";
import { StatsDashboard } from "./components/StatsDashboard";
import type { ScoringModel, ScoringModelVersion, ScoringNode, GridStatistics } from "@/lib/types/scoring-grid";

export default function ScoringGridRefactoredPage() {
  const [models, setModels] = useState<ScoringModel[]>([]);
  const [versions, setVersions] = useState<ScoringModelVersion[]>([]);
  const [nodes, setNodes] = useState<ScoringNode[]>([]);
  const [stats, setStats] = useState<GridStatistics | null>(null);
  const [activeModel, setActiveModel] = useState<ScoringModel | null>(null);
  const [activeVersion, setActiveVersion] = useState<ScoringModelVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  // Charger les modèles au montage
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/admin/scoring/models", {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Impossible de charger les modèles");
        const data = await res.json();
        setModels(data.data || []);

        // Charger le modèle PF_V7PP par défaut
        const v7pp = data.data?.find((m: any) => m.code === "PF_V7PP");
        if (v7pp) {
          setActiveModel(v7pp);
          await loadVersions(v7pp.id);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const loadVersions = async (modelId: string) => {
    try {
      const res = await fetch(`/api/admin/scoring/models/${modelId}/versions`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Impossible de charger les versions");
      const data = await res.json();
      const versionsList = data.data || [];
      setVersions(versionsList);

      // Charger la version publiée ou la plus récente
      const published = versionsList.find((v: any) => v.isPublished);
      const target = published || versionsList[0];
      if (target) {
        setActiveVersion(target);
        await loadNodes(target.id);
        await loadStats(target.id);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadNodes = async (versionId: string) => {
    try {
      const res = await fetch(`/api/admin/scoring/nodes?versionId=${versionId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Impossible de charger les nœuds");
      const data = await res.json();
      setNodes(buildHierarchy(data.data || []));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadStats = async (versionId: string) => {
    try {
      const res = await fetch(`/api/admin/scoring/grid-stats?versionId=${versionId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Impossible de charger les stats");
      const data = await res.json();
      setStats(data.data);
    } catch (e) {
      console.error("Stats load error:", e);
    }
  };

  const buildHierarchy = (flat: any[]): ScoringNode[] => {
    const map = new Map<string, ScoringNode>();
    const roots: ScoringNode[] = [];

    flat.forEach((n) => {
      map.set(n.id, { ...n, childNodes: [] });
    });

    flat.forEach((n) => {
      const node = map.get(n.id)!;
      if (n.parentNodeId && map.has(n.parentNodeId)) {
        map.get(n.parentNodeId)!.childNodes!.push(node);
      } else {
        roots.push(node);
      }
    });

    roots.sort((a, b) => a.orderIndex - b.orderIndex);
    return roots;
  };

  const handleVersionChange = async (versionId: string) => {
    if (dirty && !confirm("Vous avez des changements non sauvegardés. Continuer ?")) return;
    const version = versions.find((v) => v.id === versionId);
    if (version) {
      setActiveVersion(version);
      setDirty(false);
      await loadNodes(versionId);
      await loadStats(versionId);
    }
  };

  const handleCreateVersion = async () => {
    if (!activeModel) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/scoring/models/${activeModel.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeReason: "Nouvelle version de brouillon" }),
      });
      if (!res.ok) throw new Error("Erreur lors de la création");
      await loadVersions(activeModel.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVersion = async () => {
    if (!activeModel || !activeVersion) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/scoring/models/${activeModel.id}/versions/${activeVersion.id}/publish`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la publication");
      await loadVersions(activeModel.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin text-cyan-400 mx-auto mb-4" size={40} />
          <p className="text-slate-400">Chargement de la grille de scoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="hover:text-cyan-400 transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Paramétrage Grille de Scoring V7++</h1>
      </div>

      {/* Error bar */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-xs underline">
            Fermer
          </button>
        </div>
      )}

      {/* Version Bar */}
      {activeModel && activeVersion && (
        <VersionHeaderBar
          model={activeModel}
          versions={versions}
          activeVersionId={activeVersion.id}
          onVersionChange={handleVersionChange}
          onCreateVersion={handleCreateVersion}
          onPublish={handlePublishVersion}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {nodes.length > 0 && activeVersion && (
          <ScoringGridSplit
            nodes={nodes}
            versionId={activeVersion.id}
            onDirtyChange={setDirty}
            onNodesChange={(newNodes) => setNodes(newNodes)}
          />
        )}
      </div>

      {/* Stats footer */}
      {stats && <StatsDashboard stats={stats} />}
    </div>
  );
}
