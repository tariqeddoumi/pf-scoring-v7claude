"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, FileText, CheckCircle } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

interface Evaluation {
  id: string;
  projectId: string;
  project?: { nom: string };
  recommendation: string;
  notes?: string;
  status: string;
}

export default function EditEvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evalId, setEvalId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Evaluation>>({
    recommendation: "APPROVE",
    notes: "",
    status: "brouillon",
  });

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setEvalId(id);
        const response = await fetch(`/api/evaluations/${id}`);
        if (!response.ok) throw new Error("Failed to fetch evaluation");
        const data = await response.json();
        const evaluation = data.data || data;
        setFormData(evaluation);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load evaluation");
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!evalId) throw new Error("Evaluation ID not found");

      const response = await fetch(`/api/evaluations/${evalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update evaluation");
      router.push(`/evaluations/${evalId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={evalId ? `/evaluations/${evalId}` : "/evaluations"}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">
            Modifier l'évaluation
          </h1>
          <p className="text-slate-400 mt-1">
            {formData.project?.nom || "Projet"}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Accordion>
          {/* Section 1: Statut et Recommandation */}
          <AccordionItem title="Statut et Recommandation" defaultOpen={true} icon={<CheckCircle size={18} />}>
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Statut *
                </label>
                <select
                  name="status"
                  value={formData.status || "brouillon"}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="soumis">Soumis</option>
                  <option value="valide">Validé</option>
                  <option value="rejete">Rejeté</option>
                </select>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Recommandation *
                </label>
                <select
                  name="recommendation"
                  value={formData.recommendation || "APPROVE"}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="APPROVE">Approuvé</option>
                  <option value="APPROVE_WITH_CONDITIONS">
                    Approuvé avec conditions
                  </option>
                  <option value="REJECT">Rejeté</option>
                </select>
              </div>
            </div>
          </AccordionItem>

          {/* Section 2: Notes */}
          <AccordionItem title="Notes et Observations" icon={<FileText size={18} />}>
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Notes d'évaluation..."
                />
              </div>
            </div>
          </AccordionItem>
        </Accordion>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-slate-700">
          <Link
            href={evalId ? `/evaluations/${evalId}` : "/evaluations"}
            className="flex-1 px-6 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white text-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
