"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, Info, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatMADCompact, formatDate } from "@/lib/utils";
import { libelleMois, type Analyses } from "@/lib/services/analytics-derivation";
import { ratingBadgeClass, scoreBarClass, scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note } from "@/components/ui/status-badge";

/**
 * Analyses du portefeuille.
 *
 * Les chiffres sont dérivés des évaluations réellement calculées. Ils incluaient
 * jusqu'ici les dossiers rejetés — un refus de mai tirait le score moyen vers le bas
 * et sa note figurait dans la répartition comme s'il avait été octroyé —, la
 * répartition se lisait par effectif (B avant BB, contre le barème), et rien ne
 * reliait un chiffre à un dossier : la seule barre rouge ne disait pas de quels
 * dossiers elle venait.
 */
export default function AnalytiquePage() {
  const [a, setA] = useState<Analyses | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/analytics");
      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(corps.error ?? "Chargement des analyses impossible.");
      }
      setA((await res.json()).data ?? null);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titre="Analytique"
        description="Lecture du portefeuille à partir des évaluations calculées."
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {a && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tuile
              libelle="Dossiers notés"
              valeur={String(a.effectif.calculees)}
              precision={
                a.effectif.rejetees > 0
                  ? `${a.effectif.rejetees} rejeté${a.effectif.rejetees > 1 ? "s" : ""} exclu${a.effectif.rejetees > 1 ? "s" : ""}`
                  : `sur ${a.effectif.total} évaluations`
              }
            />
            <Tuile
              libelle="Encours noté"
              valeur={a.encoursNote > 0 ? formatMADCompact(a.encoursNote) : "—"}
              precision="montants sollicités"
            />
            <Tuile
              libelle="Score moyen"
              valeur={
                a.scoreMoyen !== null
                  ? a.scoreMoyen.toFixed(1).replace(".", ",")
                  : "—"
              }
              precision={a.scoreMoyen !== null ? "sur 100" : "aucun calcul"}
              classe={a.scoreMoyen !== null ? scoreTextClass(a.scoreMoyen) : undefined}
            />
            <Tuile
              libelle="Notes BBB ou mieux"
              valeur={
                a.partInvestissement !== null
                  ? `${a.partInvestissement.toFixed(0)} %`
                  : "—"
              }
              precision="catégorie investissement"
            />
          </div>

          {a.sansDonnees ? (
            <SectionCard sansPadding>
              <EmptyState
                icone={<BarChart3 size={28} />}
                titre="Aucune évaluation n'a encore été calculée"
                description={
                  a.effectif.total === 0
                    ? "Le portefeuille ne comporte aucune évaluation."
                    : `Les ${a.effectif.total} évaluations du portefeuille sont encore en saisie. Une analyse de portefeuille n'a de sens qu'à partir de dossiers notés.`
                }
                action={{ href: "/evaluations", libelle: "Voir les évaluations" }}
              />
            </SectionCard>
          ) : (
            <>
              {a.effectif.calculees < 5 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Ces chiffres reposent sur {a.effectif.calculees} dossier
                    {a.effectif.calculees > 1 ? "s" : ""} noté
                    {a.effectif.calculees > 1 ? "s" : ""}. À cet effectif, ils décrivent
                    ces dossiers ; ils ne caractérisent pas un portefeuille.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <SectionCard
                  titre="Notes attribuées"
                  description="Dans l'ordre du barème ; seules les notes effectivement attribuées figurent."
                >
                  <ul className="space-y-2">
                    {a.distributionNotes.map((n) => (
                      <li key={n.note} className="flex items-center gap-3">
                        <span
                          className={`w-14 rounded-md border py-0.5 text-center text-[12.5px] font-bold ${ratingBadgeClass(n.note)}`}
                        >
                          {n.note}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${n.part}%` }}
                          />
                        </span>
                        <span className="w-20 text-right text-[12.5px] text-muted-foreground tabulaire">
                          {n.effectif} · {n.part.toFixed(0)} %
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard
                  titre="Score moyen par domaine"
                  description="Moyenne des scores de domaine sur les dossiers notés."
                >
                  <ul className="space-y-3">
                    {a.moyennesParDomaine.map((d) => (
                      <li key={d.code}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] text-foreground">
                            <span className="mr-2 text-muted-foreground">{d.code}</span>
                            {d.label}
                          </span>
                          <span
                            className={`text-[13px] font-semibold tabulaire ${scoreTextClass(d.scoreMoyen)}`}
                          >
                            {d.scoreMoyen.toFixed(1).replace(".", ",")}
                          </span>
                        </div>
                        <span className="block h-2 overflow-hidden rounded-full bg-muted">
                          <span
                            className={`block h-full rounded-full ${scoreBarClass(d.scoreMoyen)}`}
                            style={{
                              width: `${Math.min(100, Math.max(0, d.scoreMoyen))}%`,
                            }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>

              {/* Le tableau mensuel ne disait rien sur trois points ; la liste des
                  dossiers notés relie chaque chiffre à un dossier ouvrable. */}
              <SectionCard
                titre="Dossiers notés"
                description="Du mieux noté au moins bien noté."
                className="mt-4"
                sansPadding
              >
                <ul>
                  {a.dossiers.map((d) => (
                    <li key={d.evaluationId} className="border-b border-border last:border-b-0">
                      <Link
                        href={`/evaluations/${d.evaluationId}`}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface"
                      >
                        <span className="font-medium text-foreground">
                          {d.projectName}
                        </span>
                        <span className="flex items-center gap-4">
                          <span
                            className={`text-[13px] font-semibold tabulaire ${scoreTextClass(d.score)}`}
                          >
                            {d.score.toFixed(1).replace(".", ",")}
                          </span>
                          <Note note={d.note} />
                          <span className="w-20 text-right text-[12px] text-muted-foreground">
                            {formatDate(d.date)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              {a.tendance.length > 2 && (
                <SectionCard
                  titre="Évolution du score moyen"
                  description="Par mois de dernière mise à jour de l'évaluation."
                  className="mt-4"
                >
                  <ul className="space-y-2">
                    {a.tendance.map((p) => (
                      <li key={p.mois} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-[12.5px] text-muted-foreground">
                          {libelleMois(p.mois)}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className={`block h-full rounded-full ${scoreBarClass(p.scoreMoyen)}`}
                            style={{ width: `${Math.min(100, p.scoreMoyen)}%` }}
                          />
                        </span>
                        <span
                          className={`w-24 text-right text-[12.5px] font-semibold tabulaire ${scoreTextClass(p.scoreMoyen)}`}
                        >
                          {p.scoreMoyen.toFixed(1).replace(".", ",")}
                          <span className="ml-1 font-normal text-muted-foreground">
                            ({p.effectif})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Tuile({
  libelle,
  valeur,
  precision,
  classe,
}: {
  libelle: string;
  valeur: string;
  precision: string;
  classe?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p className={`mt-1 text-[19px] font-semibold tabulaire ${classe ?? "text-foreground"}`}>
        {valeur}
      </p>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{precision}</p>
    </div>
  );
}
