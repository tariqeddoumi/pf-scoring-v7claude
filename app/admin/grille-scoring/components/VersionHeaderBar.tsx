"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, Plus, Upload, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api-client";
import type {
  GridValidationError,
  ScoringModel,
  ScoringModelVersion,
} from "@/lib/types/scoring-grid";
import { nomModele, sansGeneration } from "@/lib/libelle-modele";

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
  const [confirmation, setConfirmation] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: GridValidationError[];
  } | null>(null);

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

  /**
   * Publication.
   *
   * « Publier » archivait aussitôt la version en production : sans confirmation, sans
   * validation préalable et sans dire ce que la publication emporte. Une version
   * publiée devient le modèle appliqué à toutes les évaluations calculées ensuite ;
   * la précédente est archivée. La grille est donc validée d'abord, et la
   * confirmation dit ce qui va se passer.
   */
  const ouvrirPublication = async () => {
    setIsLoading(true);
    setValidation(null);
    try {
      const res = await apiPost("/api/admin/scoring/validate-grid", {
        versionId: activeVersionId,
      });
      const data = await res.json();
      setValidation({
        valid: data.data?.valid ?? false,
        errors: data.data?.errors ?? [],
      });
      setConfirmation(true);
    } catch {
      setValidation({ valid: false, errors: [] });
      setConfirmation(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      await onPublish();
      setConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background border-b border-border px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
        <div>
          <p className="text-xs text-muted-foreground">Modèle</p>
          <p className="text-sm font-semibold text-foreground">{nomModele(model.label)}</p>
        </div>

        <div className="border-l border-border" />

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">Version</p>
          <div className="relative group">
            <button
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-accent disabled:bg-card disabled:opacity-50 rounded border border-input text-sm text-foreground max-w-full transition-colors"
            >
              {sansGeneration(activeVersion?.label) || "Sélectionner"}
              <ChevronDown size={16} />
            </button>

            {/* Version dropdown */}
            <div className="absolute left-0 mt-1 w-48 bg-card border border-input rounded shadow-lg hidden group-hover:block z-50">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVersionChange(v.id)}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 hover:bg-accent disabled:opacity-50 text-sm text-foreground border-b border-border last:border-b-0 flex items-center justify-between"
                >
                  <span>{sansGeneration(v.label)}</span>
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleCreateVersion}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary disabled:opacity-50 rounded text-sm text-white transition-colors"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Nouvelle Version
        </button>

        {activeVersion && !activeVersion.isPublished && (
          <button
            onClick={ouvrirPublication}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-success hover:bg-green-700 disabled:bg-success disabled:opacity-50 rounded text-sm text-white transition-colors"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Publier
          </button>
        )}
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-lg">
            <h2 className="text-base font-semibold text-foreground">
              Publier la version {sansGeneration(activeVersion?.label)} ?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              La version publiée devient le modèle appliqué à toutes les évaluations
              calculées ensuite ; la version actuellement publiée est archivée. Les
              évaluations déjà calculées gardent la version qui les a produites, et
              leur note ne change pas. Une version publiée ne se modifie plus.
            </p>

            {validation && !validation.valid && (
              <div className="mt-3 rounded-md border border-destructive/40 bg-destructive-subtle px-3 py-2 text-sm text-destructive">
                <p className="inline-flex items-center gap-2 font-semibold">
                  <AlertTriangle size={15} />
                  {validation.errors.filter((e) => e.severity === "error").length} anomalie(s)
                  bloquante(s)
                </p>
                <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-5 text-[12.5px]">
                  {validation.errors
                    .filter((e) => e.severity === "error")
                    .slice(0, 10)
                    .map((e, i) => (
                      <li key={i}>
                        {e.nodePath} — {e.message}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {validation?.valid && (
              <p className="mt-3 rounded-md border border-success/40 bg-success-subtle px-3 py-2 text-sm text-success">
                La grille ne présente aucune anomalie bloquante.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setConfirmation(false)}
                className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Annuler
              </button>
              <button
                onClick={handlePublish}
                disabled={isLoading || !validation?.valid}
                title={
                  validation?.valid
                    ? undefined
                    : "Corrigez les anomalies bloquantes avant de publier"
                }
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading && <Loader2 size={15} className="animate-spin" />}
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
