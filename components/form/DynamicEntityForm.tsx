"use client";

import { useEffect, useState } from "react";
import { DynamicForm } from "./DynamicForm";
import { FormSection, FieldConfig } from "@/lib/field-config";

interface DynamicEntityFormProps {
  entity: "project" | "client" | "evaluation";
  formData: Record<string, any>;
  fieldErrors?: Record<string, string>;
  onChange: (e: React.ChangeEvent<any>) => void;
  fallback?: React.ReactNode;
}

export function DynamicEntityForm({
  entity,
  formData,
  fieldErrors = {},
  onChange,
  fallback,
}: DynamicEntityFormProps) {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/forms/configuration/${entity}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch form configuration for ${entity}`);
        }

        const json = await response.json();

        if (!json.success || !json.data?.sections) {
          throw new Error("Invalid configuration response");
        }

        setSections(json.data.sections);
        setShouldUseFallback(false);
      } catch (err) {
        console.error(`[DynamicEntityForm] Error loading ${entity} configuration:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setShouldUseFallback(true);
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, [entity]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || shouldUseFallback || sections.length === 0) {
    console.warn(
      `[DynamicEntityForm] Falling back to hardcoded form for ${entity}`
    );
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg text-yellow-100 text-sm">
        Configuration non disponible. Utilisation du formulaire standard.
      </div>
    );
  }

  const layout = sections[0]?.layout || "accordion";

  return (
    <DynamicForm
      sections={sections as any}
      formData={formData}
      fieldErrors={fieldErrors}
      onChange={onChange}
      layout={layout as "accordion" | "tabs"}
    />
  );
}
