"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Info, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import {
  libelleMois,
  type Analyses,
} from "@/lib/services/analytics-derivation";
import { ratingBadgeClass, scoreBarClass, scoreTextClass } from "@/lib/score-colors";

/**
 * Analyses du portefeuille.
 *
 * L'écran affichait trois tableaux codés en dur — distribution des notes, scores
 * moyens par domaine, carte de chaleur annotée « Mock domain scores » — sous un
 * commentaire « Calculate analytics data » qui ne calculait rien, alors qu'aucune
 * évaluation n'était calculée en base. Tout provient désormais des évaluations
 * réellement notées, et l'écran dit sur combien d'entre elles il se fonde.
 */
export default function AnalyticsPage() {
  const [analyses, setAnalyses] = useState<Analyses | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/analytics");
      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(corps.error ?? "Chargement impossible.");
      }
      setAnalyses((await res.json()).data ?? null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytique</h1>
        <p className="text-muted-foreground mt-2">
          Lecture du portefeuille à partir des évaluations calculées.
        </p>
      </div>

      {erreur && (
        <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {erreur}
        </Card>
      )}

      {analyses && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Indicateur
              label="Évaluations calculées"
              valeur={String(analyses.effectif.calculees)}
              precision={`sur ${analyses.effectif.total} au total`}
            />
            <Indicateur
              label="En cours de saisie"
              valeur={String(analyses.effectif.brouillons)}
              precision="non encore calculées"
            />
            <Indicateur
              label="Score moyen"
              valeur={
                analyses.scoreMoyen !== null
                  ? analyses.scoreMoyen.toFixed(1)
                  : "—"
              }
              precision={analyses.scoreMoyen !== null ? "sur 100" : "aucun calcul"}
              classe={
                analyses.scoreMoyen !== null
                  ? scoreTextClass(analyses.scoreMoyen)
                  : undefined
              }
            />
          </div>

          {analyses.sansDonnees ? (
            <Card className="p-8 text-center">
              <BarChart3 className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-foreground font-semibold">
                Aucune évaluation n&apos;a encore été calculée
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                {analyses.effectif.total === 0
                  ? "Le portefeuille ne comporte aucune évaluation."
                  : `Les ${analyses.effectif.total} évaluations du portefeuille sont ` +
                    "encore en saisie. Une analyse de portefeuille n'a de sens qu'à " +
                    "partir de dossiers notés."}
              </p>
              <Link
                href="/evaluations"
                className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
              >
                Voir les évaluations
                <ArrowRight size={14} />
              </Link>
            </Card>
          ) : (
            <>
              {analyses.effectif.calculees < 5 && (
                <Card className="border-warning/40 bg-warning/10 p-4">
                  <p className="text-sm text-warning inline-flex items-start gap-2">
                    <Info size={16} className="mt-0.5 shrink-0" />
                    Ces chiffres reposent sur {analyses.effectif.calculees} évaluation
                    {analyses.effectif.calculees > 1 ? "s" : ""} calculée
                    {analyses.effectif.calculees > 1 ? "s" : ""}. À cet effectif, ils
                    décrivent ces dossiers, ils ne caractérisent pas un portefeuille.
                  </p>
                </Card>
              )}

              {analyses.distributionNotes.length > 0 && (
                <Card className="p-5">
                  <h2 className="font-semibold text-foreground mb-4">
                    Notes attribuées
                  </h2>
                  <div className="space-y-2">
                    {analyses.distributionNotes.map((n) => (
                      <div key={n.note} className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded border w-16 text-center ${ratingBadgeClass(n.note)}`}
                        >
                          {n.note}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${n.part}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-24 text-right">
                          {n.effectif} ({n.part.toFixed(0)} %)
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Seules les notes effectivement attribuées figurent ici.
                  </p>
                </Card>
              )}

              {analyses.moyennesParDomaine.length > 0 && (
                <Card className="p-5">
                  <h2 className="font-semibold text-foreground mb-4">
                    Score moyen par domaine
                  </h2>
                  <div className="space-y-3">
                    {analyses.moyennesParDomaine.map((d) => (
                      <div key={d.code}>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-sm text-foreground truncate">
                            <span className="text-muted-foreground mr-2">{d.code}</span>
                            {d.label}
                          </span>
                          <span
                            className={`text-sm font-semibold ${scoreTextClass(d.scoreMoyen)}`}
                          >
                            {d.scoreMoyen.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBarClass(d.scoreMoyen)}`}
                            style={{
                              width: `${Math.min(100, Math.max(0, d.scoreMoyen))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {analyses.tendance.length > 1 && (
                <Card className="p-5">
                  <h2 className="font-semibold text-foreground mb-4">
                    Évolution du score moyen
                  </h2>
                  <table className="w-full text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium pb-2">Mois</th>
                        <th className="text-right font-medium pb-2">Évaluations</th>
                        <th className="text-right font-medium pb-2">Score moyen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyses.tendance.map((p) => (
                        <tr key={p.mois} className="border-t border-border">
                          <td className="py-2 text-foreground">
                            {libelleMois(p.mois)}
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            {p.effectif}
                          </td>
                          <td
                            className={`py-2 text-right font-medium ${scoreTextClass(p.scoreMoyen)}`}
                          >
                            {p.scoreMoyen.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Indicateur({
  label,
  valeur,
  precision,
  classe,
}: {
  label: string;
  valeur: string;
  precision: string;
  classe?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-bold ${classe ?? "text-foreground"}`}>{valeur}</p>
      <p className="text-xs text-muted-foreground mt-1">{precision}</p>
    </Card>
  );
}
