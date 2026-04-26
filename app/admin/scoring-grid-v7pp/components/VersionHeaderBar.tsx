"use client";

import { useState } from "react";
import { ChevronDown, Plus, Upload, Loader2 } from "lucide-react";
import type { ScoringModel, ScoringModelVersion } from "@/lib/types/scoring-grid";

interface VersionHeaderBarProps {
  model: ScoringModel;
  versions: ScoringModelVersion[];
  activeVersionId: string;
  onVersionChange: (versionId: string) => Promise<void>;
  onCreateVersion: () => Promise<void>;
  onPublish: () => Promise<void>;
}

export function VersionHeaderBar({
  model,
  versions,
  activeVersionId,
  onVersionChange,
  onCreateVersion,
  onPublish,
}: VersionHeaderBarProps) {
  const activeVersion = versions.find((v) => v.id === activeVersionId);
  const [isLoading, setIsLoading] = useState(false);

  const handleVersionChange = async (versionId: string) => {
    setIsLoading(true);
    try {
      await onVersionChange(versionId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    setIsLoading(true);
    try {
      await onCreateVersion();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await onPublish();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1">
        <div>
          <p className="text-xs text-slate-400">Modèle</p>
          <p className="text-sm font-semibold text-white">{model.code}</p>
        </div>

        <div className="border-l border-slate-700" />

        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400">Version</p>
          <div className="relative group">
            <button
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:opacity-50 rounded border border-slate-600 text-sm text-white transition-colors"
            >
              {activeVersion?.label || "Sélectionner"}
              <ChevronDown size={16} />
            </button>

            {/* Version dropdown */}
            <div className="absolute left-0 mt-1 w-48 bg-slate-800 border border-slate-600 rounded shadow-lg hidden group-hover:block z-50">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVersionChange(v.id)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 hover:bg-slate-700 disabled:opacity-50 text-sm text-white border-b border-slate-700 last:border-b-0 flex items-center justify-between"
                >
                  <span>{v.label}</span>
                  <span className={`text-xs px-2 py-1 rounded ${v.isPublished ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"}`}>
                    {v.isPublished ? "PUBLISHED" : "DRAFT"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Version badge */}
          {activeVersion && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                activeVersion.isPublished ? "bg-green-900 text-green-200" : "bg-yellow-900 text-yellow-200"
              }`}
            >
              {activeVersion.isPublished ? "PUBLISHED" : "DRAFT"}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCreateVersion}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600 disabled:opacity-50 rounded text-sm text-white transition-colors"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Nouvelle Version
        </button>

        {activeVersion && !activeVersion.isPublished && (
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:opacity-50 rounded text-sm text-white transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Publier
          </button>
        )}
      </div>
    </div>
  );
}
