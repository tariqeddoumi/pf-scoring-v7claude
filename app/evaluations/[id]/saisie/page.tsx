"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { EvaluationWorkspace } from "@/components/scoring/EvaluationWorkspace";
import type { AnswerValue } from "@/components/scoring/LiveScorePanel";
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";
import { apiGet } from "@/lib/api-client";

/**
 * Poste de saisie d'une évaluation, à une URL propre.
 *
 * La saisie vivait auparavant dans un état local de /evaluations/new, sans
 * changement d'URL : un rafraîchissement en cours de saisie ramenait au formulaire
 * de création, et aucun écran ne permettait de rouvrir un questionnaire commencé.
 * Chargée depuis GET .../form avec ses réponses, elle devient reprenable,
 * partageable et résistante au rechargement.
 */
export default function SaisieEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = String(params?.id ?? "");

  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);
  const [initialAnswers, setInitialAnswers] = useState<Record<string, AnswerValue>>({});
  const [projectName, setProjectName] = useState("Projet");
  const [modelVersionId, setModelVersionId] = useState("");
  const [status, setStatus] = useState<string>("brouillon");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!evaluationId) return;
    let annule = false;

    (async () => {
      try {
        const res = await apiGet(`/api/scoring/evaluations/${evaluationId}/form`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Évaluation introuvable");
        }
        const { data } = await res.json();
        if (annule) return;

        setQuestionnaire(data.form ?? []);
        setInitialAnswers(data.answers ?? {});
        setProjectName(data.projectName ?? "Projet");
        setModelVersionId(data.modelVersionId ?? "");
        setStatus(data.status ?? "brouillon");
      } catch (e: any) {
        if (!annule) setError(e.message);
      } finally {
        if (!annule) setLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [evaluationId]);

  const handleComplete = useCallback(
    (id: string) => {
      router.push(`/evaluations/${id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-cyan-400 mx-auto" size={40} />
          <p className="text-slate-400 text-sm">Chargement de la saisie…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-16 space-y-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-5">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
            <AlertCircle size={18} />
            Saisie indisponible
          </div>
          <p className="text-sm text-red-300/80">{error}</p>
        </div>
        <Link
          href="/evaluations"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Retour aux évaluations
        </Link>
      </div>
    );
  }

  // Une évaluation soumise ou validée ne se ressaisit pas : on renvoie vers sa fiche.
  if (status !== "brouillon") {
    return (
      <div className="max-w-xl mx-auto mt-16 space-y-4">
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-5">
          <p className="text-white font-semibold mb-1">Saisie clôturée</p>
          <p className="text-sm text-slate-400">
            Cette évaluation est au statut « {status} » et n&apos;est plus modifiable.
          </p>
        </div>
        <Link
          href={`/evaluations/${evaluationId}`}
          className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft size={16} />
          Voir la fiche d&apos;évaluation
        </Link>
      </div>
    );
  }

  return (
    <EvaluationWorkspace
      evaluationId={evaluationId}
      projectName={projectName}
      questionnaire={questionnaire}
      modelVersionId={modelVersionId}
      initialAnswers={initialAnswers}
      onComplete={handleComplete}
    />
  );
}
