"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, PlayCircle, Send, BarChart3 } from "lucide-react";
import { EvaluationForm } from "@/components/scoring/evaluation-form";

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [form, setForm] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, [evaluationId]);

  const loadForm = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/scoring/evaluations/${evaluationId}/form`);
      if (!res.ok) throw new Error("Failed to load form");
      const { data } = await res.json();
      setForm(data.form);
      setEvaluation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnswers = async (answers: any[]) => {
    const res = await fetch(`/api/scoring/evaluations/${evaluationId}/answers`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error("Failed to save answers");
    // Reload form to reflect saved answers
    await loadForm();
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/scoring/evaluations/${evaluationId}/calculate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Calculation failed");
      const { data } = await res.json();
      alert(`Calculation complete: ${data.rating} (${data.finalScore.toFixed(2)})`);
      // Reload evaluation to show new score
      await loadForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation error");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm("Submit evaluation for validation?")) return;
    try {
      const res = await fetch(`/api/scoring/evaluations/${evaluationId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });
      if (!res.ok) throw new Error("Submit failed");
      alert("Evaluation submitted");
      router.push(`/scoring/evaluations/${evaluationId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit error");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading evaluation...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{evaluation?.modelLabel}</h1>
            <p className="text-sm text-gray-400">
              Project: {evaluation?.projectId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded"
          >
            <PlayCircle className="w-4 h-4" />
            Calculate
          </button>
          <button
            onClick={() => router.push(`/scoring/evaluations/${evaluationId}/results`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            <BarChart3 className="w-4 h-4" />
            Results
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </div>

      {/* Status badge */}
      {evaluation?.status && (
        <div className="p-3 bg-gray-900 border border-gray-700 rounded text-sm">
          Status: <span className="font-semibold uppercase">{evaluation.status}</span>
          {evaluation.finalScore && (
            <span className="ml-4">
              Final Score: <span className="text-yellow-400">{evaluation.finalScore.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 text-red-400 border border-red-700 rounded">
          {error}
        </div>
      )}

      {/* Evaluation form */}
      {form && (
        <EvaluationForm
          evaluationId={evaluationId}
          form={form}
          onSave={handleSaveAnswers}
          isLoading={isCalculating}
        />
      )}
    </div>
  );
}
