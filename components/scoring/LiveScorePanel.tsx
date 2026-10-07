"use client";

import { Clock, TrendingUp, AlertTriangle, Loader2, Ban } from "lucide-react";
import { scoreClasses as getScoreColors } from "@/lib/score-colors";

export interface AnswerValue {
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  comment?: string;
}

/** Résultat renvoyé par le moteur en mode aperçu. */
export interface ServerScore {
  finalScore: number;
  rating: string;
  malusTotal: number;
  blocked: boolean;
  blockingRuleCodes: string[];
  domains: Array<{ nodeId: string; code: string; label: string; score: number | null }>;
  /** Une règle interdit la publication. */
  publicationBlocked?: boolean;
  /** Donnée obligatoire ou règle critique indisponible : note provisoire. */
  incomplet?: boolean;
  donneesObligatoiresManquantes?: string[];
  reglesCritiquesNonEvaluees?: string[];
  /** Critères notés sur une valeur par défaut. */
  valeursParDefaut?: string[];
  /** Règles dont la condition n'a pas pu être évaluée. */
  ruleDiagnosticCount?: number;
  derogations?: Array<{ nodeCode: string; scoreCalcule: number; scoreRetenu: number }>;
  recommendation?: string;
}

/** Lecture tolérante de la réponse du moteur (aperçu ou calcul). */
export function lireServerScore(data: Record<string, any>): ServerScore {
  const liste = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  return {
    finalScore: data.finalScore,
    rating: data.rating,
    malusTotal: data.malusTotal ?? 0,
    blocked: !!data.blocked,
    blockingRuleCodes: liste(data.blockingRuleCodes),
    domains: data.domains ?? [],
    publicationBlocked: !!data.publicationBlocked,
    incomplet: !!data.incomplet,
    donneesObligatoiresManquantes: liste(data.donneesObligatoiresManquantes),
    reglesCritiquesNonEvaluees: liste(data.reglesCritiquesNonEvaluees),
    valeursParDefaut: liste(data.valeursParDefaut),
    ruleDiagnosticCount: Number(data.ruleDiagnosticCount ?? 0),
    derogations: Array.isArray(data.derogations) ? data.derogations : [],
    recommendation: data.recommendation,
  };
}

/** Statut de validité du résultat affiché, du plus restrictif au plus favorable. */
export function statutValidite(score: ServerScore | null, isStale?: boolean): { libelle: string; ton: "danger" | "alerte" | "ok" | "neutre" } {
  if (!score) return { libelle: "Non calculé", ton: "neutre" };
  if (isStale) return { libelle: "Calcul à refaire", ton: "alerte" };
  if (score.blocked) return { libelle: "Bloqué", ton: "danger" };
  if (score.incomplet) return { libelle: "Provisoire — incomplet", ton: "alerte" };
  if (score.publicationBlocked) return { libelle: "Publication bloquée", ton: "alerte" };
  return { libelle: "Complet", ton: "ok" };
}

interface LiveScorePanelProps {
  /** Dernier résultat du moteur. null tant qu'aucun calcul n'a eu lieu. */
  score: ServerScore | null;
  /** Un calcul d'aperçu est en cours. */
  isScoring?: boolean;
  /** Des réponses non enregistrées rendent le score affiché obsolète. */
  isStale?: boolean;
  isSaving?: boolean;
  lastSaved?: Date | null;
  /** Rôle qui ne voit pas les scores : statut et manques seulement, sans note. */
  masquerScores?: boolean;
}

export function LiveScorePanel({
  score,
  isScoring,
  isStale,
  isSaving,
  lastSaved,
  masquerScores = false,
}: LiveScorePanelProps) {
  const total = score?.finalScore ?? null;
  const colors = getScoreColors(total);

  return (
    <div className="h-full bg-background border-l border-border flex flex-col w-56 flex-shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-primary" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {masquerScores ? "État du dossier" : "Score du moteur"}
          </h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={10} />
          {isSaving
            ? "Sauvegarde…"
            : lastSaved
              ? lastSaved.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
              : "—"}
        </div>
      </div>

      {!masquerScores && (
      <div className="p-4 border-b border-border text-center">
        <div className={`text-5xl font-bold tabular-nums ${colors.text}`}>
          {total !== null ? total.toFixed(1) : "—"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">/ 100 pts</div>

        {score?.rating && (
          <div
            className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider ${colors.badge}`}
          >
            {score.rating}
          </div>
        )}

        {total !== null && (
          <div className="mt-3 bg-card rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${colors.bar}`}
              style={{ width: `${Math.min(100, total)}%` }}
            />
          </div>
        )}

        <div className="mt-3 min-h-[1.25rem]">
          {isScoring ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary">
              <Loader2 size={11} className="animate-spin" />
              Calcul en cours…
            </span>
          ) : isStale ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-warning">
              <AlertTriangle size={11} />
              Réponses non enregistrées
            </span>
          ) : total === null ? (
            <span className="text-xs text-muted-foreground">En attente d&apos;un premier calcul</span>
          ) : null}
        </div>
      </div>
      )}
      {masquerScores && (
        <div className="p-4 border-b border-border text-xs leading-relaxed text-muted-foreground">
          {isScoring
            ? "Contrôle en cours…"
            : isStale
              ? "Réponses non enregistrées."
              : "La note n'est pas affichée pendant la saisie : elle est calculée par le moteur et communiquée aux décideurs."}
        </div>
      )}

      {(() => {
        const st = statutValidite(score, isStale);
        const classes = {
          danger: "bg-destructive/10 text-destructive border-destructive/30",
          alerte: "bg-warning/10 text-warning border-warning/30",
          ok: "bg-success/10 text-success border-success/30",
          neutre: "bg-card text-muted-foreground border-border",
        }[st.ton];
        return (
          <div className={`mx-4 mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${classes}`}>
            Statut : {st.libelle}
          </div>
        );
      })()}

      {score?.incomplet && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-foreground space-y-1">
          {(score.donneesObligatoiresManquantes?.length ?? 0) > 0 && (
            <p>
              <span className="font-semibold">Données obligatoires manquantes :</span>{" "}
              {score.donneesObligatoiresManquantes!.join(", ")}
            </p>
          )}
          {(score.reglesCritiquesNonEvaluees?.length ?? 0) > 0 && (
            <p>
              <span className="font-semibold">Règles critiques non évaluables :</span>{" "}
              {score.reglesCritiquesNonEvaluees!.join(", ")}
            </p>
          )}
          <p className="text-muted-foreground">La soumission attend ces compléments.</p>
        </div>
      )}

      {score !== null && ((score.ruleDiagnosticCount ?? 0) > 0 || (score.valeursParDefaut?.length ?? 0) > 0) && (
        <div className="mx-4 mt-3 space-y-1 text-xs text-muted-foreground">
          {(score.ruleDiagnosticCount ?? 0) > 0 && (
            <p>{score.ruleDiagnosticCount} règle(s) non évaluée(s) — voir la trace.</p>
          )}
          {(score.valeursParDefaut?.length ?? 0) > 0 && (
            <p>Valeur par défaut utilisée : {score.valeursParDefaut!.join(", ")}.</p>
          )}
        </div>
      )}

      {!masquerScores && (score?.derogations?.length ?? 0) > 0 && (
        <div className="mx-4 mt-3 text-xs">
          <p className="font-semibold text-foreground">Dérogations appliquées</p>
          {score!.derogations!.map((d) => (
            <p key={d.nodeCode} className="tabular-nums text-muted-foreground">
              {d.nodeCode} : {d.scoreCalcule.toFixed(1)} → {d.scoreRetenu.toFixed(1)}
            </p>
          ))}
        </div>
      )}

      {score?.blocked && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive mb-1">
            <Ban size={12} />
            Condition rédhibitoire
          </div>
          <p className="text-xs text-destructive/80 leading-relaxed">
            {score.blockingRuleCodes.join(", ")} — le dossier ne peut être approuvé
            quelle que soit la note.
          </p>
        </div>
      )}

      {!masquerScores && score !== null && score.malusTotal > 0 && (
        <div className="mx-4 mt-3 flex justify-between text-xs">
          <span className="text-muted-foreground">Malus appliqués</span>
          <span className="font-bold text-warning">− {score.malusTotal.toFixed(1)}</span>
        </div>
      )}

      {!masquerScores && (
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Par domaine
        </h3>
        {score === null ? (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Les scores par domaine s&apos;affichent après le premier calcul.
          </p>
        ) : (
          score.domains.map((d) => {
            const c = getScoreColors(d.score);
            return (
              <div key={d.nodeId}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground truncate flex-1 pr-2">{d.label}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${c.text}`}>
                    {d.score !== null ? d.score.toFixed(0) : "—"}
                  </span>
                </div>
                <div className="bg-card rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${c.bar}`}
                    style={{ width: d.score !== null ? `${Math.min(100, d.score)}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
      {masquerScores && <div className="flex-1" />}

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {masquerScores
            ? "Répondez d'après les pièces du dossier : la note est établie par le moteur."
            : "Score calculé par le moteur sur les réponses enregistrées : poids, malus, règles et calibrage sectoriel compris."}
        </p>
      </div>
    </div>
  );
}
