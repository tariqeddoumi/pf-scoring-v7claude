"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2, MessageSquare, Send } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { formatMADCompact, formatDateTime } from "@/lib/utils";
import { scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { Note } from "@/components/ui/status-badge";
import { usePermission } from "@/lib/hooks/usePermission";
import { GRADE_THRESHOLDS } from "@/lib/constants";

interface Utilisateur {
  id?: string;
  nom?: string | null;
  prenom?: string | null;
  email?: string | null;
}

interface Commentaire {
  id: string;
  content: string;
  commentType?: string;
  isInternal?: boolean;
  createdAt: string;
  createdByUser?: Utilisateur | null;
  replies?: Commentaire[];
}

interface Etape {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType?: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  dueDate?: string | null;
}

interface Workflow {
  id: string;
  status: string;
  currentStep: number;
  createdAt: string;
  submittedAt?: string | null;
  steps?: Etape[];
  comments?: Commentaire[];
  approvals?: { id: string; approvalType: string; status: string; dueDate?: string | null }[];
  decisions?: {
    id: string;
    decisionType: string;
    riskRating?: string | null;
    justification?: string | null;
    decidedAt?: string | null;
    decidedByUser?: Utilisateur | null;
  }[];
  evaluation?: {
    id: string;
    finalScore?: number | null;
    rating?: string | null;
    recommendation?: string | null;
    project?: {
      id: string;
      nom: string;
      montant?: number | null;
      client?: { id: string; nom: string } | null;
    } | null;
    analyst?: Utilisateur | null;
  } | null;
}

const ETATS_ETAPE: Record<string, { libelle: string; ton: string }> = {
  PENDING: { libelle: "À venir", ton: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { libelle: "En cours", ton: "bg-warning-subtle text-warning" },
  COMPLETED: { libelle: "Terminée", ton: "bg-success-subtle text-success" },
  SKIPPED: { libelle: "Passée", ton: "bg-muted text-muted-foreground" },
  FAILED: { libelle: "Échouée", ton: "bg-destructive-subtle text-destructive" },
};

const DECISIONS = [
  { valeur: "APPROVE", libelle: "Approuver" },
  { valeur: "APPROVE_WITH_CONDITIONS", libelle: "Approuver sous conditions" },
  { valeur: "REJECT", libelle: "Rejeter" },
];

/** Les types d'approbation étaient affichés en code : ANALYST_SIGN_OFF. */
const APPROBATIONS: Record<string, string> = {
  ANALYST_SIGN_OFF: "Validation de l'analyste",
  RISK_MANAGER_REVIEW: "Revue du responsable des risques",
  COMMITTEE_APPROVAL: "Approbation du comité",
  FINAL_APPROVAL: "Approbation finale",
};

const nomDe = (u?: Utilisateur | null) =>
  u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || u.email || "—" : "—";

/**
 * Instruction d'un dossier dans son circuit.
 *
 * L'écran renvoyait « 404 Page not found » : composant serveur, il appelait l'API par
 * une URL absolue construite sur NEXT_PUBLIC_API_URL avec un jeton interne, deux
 * variables absentes du déploiement. Ses actions — soumettre la décision, envoyer un
 * commentaire, joindre une pièce — étaient des actions serveur vides, commentées
 * « will be handled by client component ». Toutes ses sections étaient en `bg-white`
 * codé en dur, illisibles dans le thème sombre. Les réponses aux commentaires
 * apparaissaient deux fois, l'API renvoyant à la fois les racines et leurs réponses.
 */
export default function CircuitPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { can } = usePermission();

  const [w, setW] = useState<Workflow | null>(null);
  const [documents, setDocuments] = useState<
    { id: string; fileName: string; documentType?: string; uploadedAt?: string }[]
  >([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [reponseA, setReponseA] = useState<string | null>(null);

  const [decision, setDecision] = useState("APPROVE");
  const [note, setNote] = useState("");
  const [justification, setJustification] = useState("");
  const [enDecision, setEnDecision] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet(`/api/admin/scoring/workflows/${id}`);
      if (!res.ok) {
        throw new Error(
          res.status === 403
            ? "Vos droits ne permettent pas de consulter ce circuit."
            : "Ce circuit de validation est introuvable."
        );
      }
      const corps = await res.json();
      const workflow: Workflow = corps.data ?? corps;
      setW(workflow);
      setNote((n) => n || workflow.evaluation?.rating || "");
      setErreur(null);

      if (workflow.evaluation?.id) {
        const resDocs = await apiGet(
          `/api/admin/scoring/documents?evaluationId=${workflow.evaluation.id}`
        );
        if (resDocs.ok) setDocuments((await resDocs.json()).data ?? []);
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) charger();
  }, [id, charger]);

  const commentaires = useMemo(() => w?.comments ?? [], [w]);

  const envoyer = async () => {
    if (!message.trim()) return;
    setEnvoi(true);
    try {
      const res = await apiPost(`/api/admin/scoring/workflows/${id}/comments`, {
        content: message.trim(),
        commentType: "GENERAL",
        isInternal: false,
        parentCommentId: reponseA,
      });
      if (!res.ok) throw new Error("Envoi du message impossible.");
      setMessage("");
      setReponseA(null);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnvoi(false);
    }
  };

  const decider = async () => {
    if (!justification.trim() || !note) return;
    setEnDecision(true);
    try {
      const res = await apiPost(`/api/admin/scoring/workflows/${id}/approve`, {
        decisionType: decision,
        riskRating: note,
        justification: justification.trim(),
        hasConditions: decision === "APPROVE_WITH_CONDITIONS",
      });
      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(
          res.status === 403
            ? "Seul un responsable habilité peut rendre la décision."
            : corps.error || "Enregistrement de la décision impossible."
        );
      }
      setJustification("");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Décision impossible.");
    } finally {
      setEnDecision(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (erreur && !w) {
    return (
      <div>
        <PageHeader
          titre="Circuit de validation"
          retour={{ href: "/workflows", libelle: "Validations" }}
        />
        <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      </div>
    );
  }

  if (!w) return null;

  const projet = w.evaluation?.project;
  const clos = w.status === "APPROVED" || w.status === "REJECTED";
  const derniere = w.decisions?.[0];

  return (
    <div>
      <PageHeader
        titre={projet?.nom ?? "Dossier"}
        description={[
          projet?.client?.nom,
          projet?.montant != null ? formatMADCompact(projet.montant) : null,
          w.evaluation?.analyst ? `analyste ${nomDe(w.evaluation.analyst)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        retour={{ href: "/workflows", libelle: "Validations" }}
        meta={
          <div className="flex flex-wrap items-center gap-3">
            <Note note={w.evaluation?.rating} score={w.evaluation?.finalScore} taille="grande" />
            {w.evaluation?.recommendation && (
              <span className="text-[12.5px] text-muted-foreground">
                {w.evaluation.recommendation}
              </span>
            )}
          </div>
        }
        actions={
          w.evaluation?.id && (
            <Link
              href={`/evaluations/${w.evaluation.id}`}
              className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Voir l&apos;évaluation
            </Link>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {/* Frise des étapes : elles s'empilaient en grandes cartes verticales colorées. */}
      {w.steps && w.steps.length > 0 && (
        <SectionCard titre="Progression" className="mb-4">
          <ol className="flex flex-wrap gap-2">
            {w.steps
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((e) => {
                const etat = ETATS_ETAPE[e.status] ?? {
                  libelle: e.status,
                  ton: "bg-muted text-muted-foreground",
                };
                return (
                  <li
                    key={e.id}
                    className="min-w-[160px] flex-1 rounded-md border border-border px-3 py-2"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-medium text-foreground">
                        {e.stepNumber}. {e.stepName}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${etat.ton}`}
                      >
                        {etat.libelle}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11.5px] text-muted-foreground">
                      {e.completedAt
                        ? `Terminée le ${formatDateTime(e.completedAt)}`
                        : e.startedAt
                          ? `Ouverte le ${formatDateTime(e.startedAt)}`
                          : e.dueDate
                            ? `Échéance ${formatDateTime(e.dueDate)}`
                            : "—"}
                    </span>
                  </li>
                );
              })}
          </ol>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            titre={`Échanges (${commentaires.length})`}
            description="Questions du comité et réponses de l'analyste."
          >
            {commentaires.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun échange pour l&apos;instant.</p>
            ) : (
              <ul className="space-y-4">
                {commentaires.map((c) => (
                  <li key={c.id}>
                    <Message c={c} />
                    {c.replies && c.replies.length > 0 && (
                      <ul className="mt-2 space-y-2 border-l-2 border-border pl-4">
                        {c.replies.map((r) => (
                          <li key={r.id}>
                            <Message c={r} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => setReponseA(reponseA === c.id ? null : c.id)}
                      className="mt-1 text-[12px] font-medium text-primary hover:underline"
                    >
                      {reponseA === c.id ? "Annuler la réponse" : "Répondre"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-border pt-3">
              {reponseA && (
                <p className="mb-1.5 text-[12px] text-muted-foreground">
                  Réponse à un message du fil.
                </p>
              )}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Écrire un message…"
                aria-label="Nouveau message"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={envoyer}
                  disabled={envoi || !message.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {envoi ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  Envoyer
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            titre={`Pièces du dossier (${documents.length})`}
            description="Documents attachés à l'évaluation."
          >
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune pièce attachée à ce dossier.
              </p>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-[13px]">
                    <FileText size={15} className="shrink-0 text-muted-foreground" />
                    <span className="text-foreground">{d.fileName}</span>
                    {d.documentType && (
                      <span className="text-[11.5px] text-muted-foreground">
                        {d.documentType}
                      </span>
                    )}
                    {d.uploadedAt && (
                      <span className="ml-auto text-[11.5px] text-muted-foreground">
                        {formatDateTime(d.uploadedAt)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          {clos ? (
            <SectionCard titre="Décision rendue">
              {derniere ? (
                <dl className="space-y-2 text-[12.5px]">
                  <div>
                    <dt className="text-muted-foreground">Sens</dt>
                    <dd className="text-foreground">
                      {DECISIONS.find((d) => d.valeur === derniere.decisionType)?.libelle ??
                        derniere.decisionType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Note retenue</dt>
                    <dd className="text-foreground">{derniere.riskRating ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Motivation</dt>
                    <dd className="text-foreground">{derniere.justification ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rendue par</dt>
                    <dd className="text-foreground">
                      {nomDe(derniere.decidedByUser)}
                      {derniere.decidedAt && ` · ${formatDateTime(derniere.decidedAt)}`}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Le circuit est clos, sans décision consignée.
                </p>
              )}
            </SectionCard>
          ) : (
            can("evaluation", "approve") && (
              <SectionCard
                titre="Rendre la décision"
                description="La motivation est conservée au dossier."
              >
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="champ-decision"
                      className="mb-1 block text-[12.5px] font-medium text-foreground"
                    >
                      Sens de la décision
                    </label>
                    <select
                      id="champ-decision"
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                      {DECISIONS.map((d) => (
                        <option key={d.valeur} value={d.valeur}>
                          {d.libelle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="champ-note"
                      className="mb-1 block text-[12.5px] font-medium text-foreground"
                    >
                      Note retenue
                    </label>
                    <select
                      id="champ-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                      <option value="">— Choisir —</option>
                      {Object.keys(GRADE_THRESHOLDS).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {w.evaluation?.rating && note && note !== w.evaluation.rating && (
                      <p className="mt-1 text-[12px] text-warning">
                        Note différente de celle calculée ({w.evaluation.rating}) :
                        justifiez l&apos;écart.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="champ-justification"
                      className="mb-1 block text-[12.5px] font-medium text-foreground"
                    >
                      Motivation
                    </label>
                    <textarea
                      id="champ-justification"
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={decider}
                    disabled={enDecision || !justification.trim() || !note}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {enDecision && <Loader2 size={15} className="animate-spin" />}
                    Enregistrer la décision
                  </button>
                </div>
              </SectionCard>
            )
          )}

          <SectionCard titre="Évaluation">
            <dl className="space-y-2 text-[12.5px]">
              <div>
                <dt className="text-muted-foreground">Score final</dt>
                <dd
                  className={`text-[19px] font-semibold tabulaire ${scoreTextClass(w.evaluation?.finalScore)}`}
                >
                  {w.evaluation?.finalScore != null
                    ? `${w.evaluation.finalScore.toFixed(1).replace(".", ",")}/100`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Note calculée</dt>
                <dd className="text-foreground">{w.evaluation?.rating ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Soumis le</dt>
                <dd className="text-foreground">
                  {w.submittedAt ? formatDateTime(w.submittedAt) : "—"}
                </dd>
              </div>
            </dl>
          </SectionCard>

          {w.approvals && w.approvals.length > 0 && (
            <SectionCard titre={`Approbations (${w.approvals.length})`}>
              <ul className="space-y-2 text-[12.5px]">
                {w.approvals.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="text-foreground">
                      {APPROBATIONS[a.approvalType] ?? a.approvalType}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        a.status === "APPROVED"
                          ? "bg-success-subtle text-success"
                          : a.status === "REJECTED"
                            ? "bg-destructive-subtle text-destructive"
                            : "bg-warning-subtle text-warning"
                      }`}
                    >
                      {a.status === "APPROVED"
                        ? "Accordée"
                        : a.status === "REJECTED"
                          ? "Refusée"
                          : "En attente"}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ c }: { c: Commentaire }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="mb-1 flex flex-wrap items-baseline gap-2">
        <MessageSquare size={13} className="text-muted-foreground" />
        <span className="text-[12.5px] font-medium text-foreground">
          {nomDe(c.createdByUser)}
        </span>
        <span className="text-[11.5px] text-muted-foreground">
          {formatDateTime(c.createdAt)}
        </span>
        {c.isInternal && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
            Interne
          </span>
        )}
      </div>
      <p className="whitespace-pre-line text-[13px] text-foreground">{c.content}</p>
    </div>
  );
}
