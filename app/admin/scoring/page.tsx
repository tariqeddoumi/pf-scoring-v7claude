"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  BarChart3,
  Loader2,
  Settings,
  ListOrdered,
  Hash,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatPart, formatPoidsDetail, sommeFratrie } from "@/lib/weight-format";

interface ScoringNode {
  id: string;
  code: string;
  label: string;
  shortLabel?: string;
  description?: string;
  nodeType: string;
  depth: number;
  orderIndex: number;
  weight?: number;
  answerType?: string;
  children?: ScoringNode[];
  options?: { value: string; label: string; score: number }[];
  ranges?: { minValue: number; maxValue: number; score: number; label?: string }[];
}

interface ModelVersion {
  id: string;
  versionNumber: number;
  label: string;
  modelCode: string;
  modelLabel: string;
  domainCount: number;
  criteriaCount: number;
}

/**
 * Pastilles de domaine.
 *
 * Les icônes et les couleurs dataient d'un modèle antérieur : 💰 pour « Sponsor &
 * actionnaires », 🌿 pour « Risque de marché », 🗺️ pour « Structure financière »,
 * 🏗️ pour « Juridique » et 📊 pour « ESG ». Elles suivent maintenant les domaines
 * D1 à D9 du modèle publié, et les couleurs viennent des jetons du thème.
 */
const DOMAIN_META: Record<string, { icon: string; color: string }> = {
  D1: { icon: "🤝", color: "text-foreground bg-muted border-border" },
  D2: { icon: "🏗️", color: "text-foreground bg-muted border-border" },
  D3: { icon: "🧱", color: "text-foreground bg-muted border-border" },
  D4: { icon: "📈", color: "text-foreground bg-muted border-border" },
  D5: { icon: "⚙️", color: "text-foreground bg-muted border-border" },
  D6: { icon: "🏦", color: "text-foreground bg-muted border-border" },
  D7: { icon: "💰", color: "text-foreground bg-muted border-border" },
  D8: { icon: "⚖️", color: "text-foreground bg-muted border-border" },
  D9: { icon: "🌿", color: "text-foreground bg-muted border-border" },
};

/**
 * Couleur d'un score d'option ou de plage.
 *
 * Les seuils étaient fixés à 75 et 50, c'est-à-dire pour une échelle sur 100 ; or les
 * options de ce modèle sont notées sur l'échelle propre du nœud — 10, 8, 5, 2 — si
 * bien que la totalité des options s'affichait en rouge. La couleur se rapporte
 * désormais au meilleur score proposé par le nœud.
 */
function classeScoreRelatif(score: number, maximum: number): string {
  if (!Number.isFinite(maximum) || maximum <= 0) return "text-foreground";
  const part = (score / maximum) * 100;
  if (part >= 75) return "text-success";
  if (part >= 50) return "text-warning";
  return "text-destructive";
}

export default function ScoringAdminPage() {
  const [questionnaire, setQuestionnaire] = useState<ScoringNode[]>([]);
  // Les poids sont relatifs à leur fratrie : leur part n'a de sens que rapportée à ce total.
  const sommeDomaines = sommeFratrie(questionnaire);
  const [modelVersion, setModelVersion] = useState<ModelVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/scoring/questionnaire");
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Erreur chargement");
        }
        const data = await res.json();

        /*
         * Le questionnaire est tronqué au niveau critère : il ne montre que deux
         * étages, alors que ce sont les sous-critères qui portent les options et les
         * plages, et donc la notation. L'écran annonçait « Critères OPTION : 0 » tout
         * en affichant un badge « Options » sur chacun des vingt-huit critères, qui
         * sont pourtant des nœuds d'agrégation sans type de réponse.
         * L'arbre complet est reconstruit depuis la route d'administration.
         */
        let arbre: ScoringNode[] = data.data || [];
        const resNoeuds = await apiGet(
          `/api/admin/scoring/nodes?versionId=${data.modelVersionId}`
        );
        if (resNoeuds.ok) {
          const plats = ((await resNoeuds.json()).data ?? []) as (ScoringNode & {
            parentNodeId?: string | null;
            isActive?: boolean;
          })[];
          const actifs = plats.filter((n) => n.isActive !== false);
          const parId = new Map(actifs.map((n) => [n.id, { ...n, children: [] as ScoringNode[] }]));
          const racines: ScoringNode[] = [];
          for (const n of parId.values()) {
            const parent = n.parentNodeId ? parId.get(n.parentNodeId) : null;
            if (parent) parent.children!.push(n);
            else racines.push(n);
          }
          if (racines.length > 0) arbre = racines;
        }

        setQuestionnaire(arbre);
        setModelVersion({
          id: data.modelVersionId,
          versionNumber: data.modelVersion?.versionNumber ?? 1,
          label: data.modelVersion?.label ?? "V1",
          modelCode: "PF_V7PP",
          modelLabel: data.modelVersion?.model?.label ?? "Modèle Project Finance",
          domainCount: arbre.length,
          criteriaCount: arbre.reduce(
            (s: number, d: ScoringNode) => s + (d.children?.length ?? 0),
            0
          ),
        });
        // Expand all domains by default
        const ids = new Set<string>(arbre.map((d) => d.id));
        setExpandedDomains(ids);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCriterion = (id: string) => {
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-muted-foreground text-sm">Chargement du modèle de scoring…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-card rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Modèle de Scoring</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configuration du modèle actif
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/scoring/builder"
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Settings size={16} />
            Paramétrer
          </Link>
          <Link
            href="/evaluations/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <BarChart3 size={16} />
            Nouvelle Évaluation
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-destructive text-sm">
          {error === "No published scoring model found" ? (
            <>
              <strong>Aucun modèle publié.</strong> Exécutez le script SQL{" "}
              <code className="bg-card px-1 py-0.5 rounded">SUPABASE_INSERT_SCRIPT.sql</code>{" "}
              dans votre console Supabase.
            </>
          ) : (
            error
          )}
        </div>
      )}

      {/* Model banner */}
      {modelVersion && (
        <div className="rounded-xl border border-primary/30 bg-cyan-500/5 p-5 flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Modèle actif</div>
            <div className="text-foreground font-bold text-lg">{modelVersion.modelCode}</div>
            <div className="text-muted-foreground text-sm">{modelVersion.modelLabel}</div>
          </div>
          <div className="h-10 w-px bg-muted hidden sm:block" />
          <div className="flex gap-6 flex-wrap">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Version</div>
              <div className="text-primary font-semibold">Version {modelVersion.versionNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Domaines</div>
              <div className="text-foreground font-semibold">{modelVersion.domainCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Critères</div>
              <div className="text-foreground font-semibold">{modelVersion.criteriaCount}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Statut</div>
              <div className="flex items-center gap-1.5 text-success font-semibold">
                <CheckCircle2 size={14} />
                Publié
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain tree */}
      {questionnaire.length > 0 ? (
        <div className="space-y-3">
          {questionnaire.map((domain) => {
            const meta = DOMAIN_META[domain.code] ?? { icon: "📋", color: "text-muted-foreground bg-muted/50 border-input" };
            const isExpanded = expandedDomains.has(domain.id);
            const criteriaCount = domain.children?.length ?? 0;

            return (
              <div
                key={domain.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Domain header */}
                <button
                  onClick={() => toggleDomain(domain.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-accent/30 transition-colors text-left"
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${meta.color}`}>
                        {domain.code}
                      </span>
                      <span className="text-foreground font-semibold truncate">{domain.label}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span>{criteriaCount} critères</span>
                      <span title={formatPoidsDetail(domain.weight, sommeDomaines)}>
                        Poids :{" "}
                        <strong className="text-secondary-foreground">
                          {formatPart(domain.weight, sommeDomaines) ?? "—"}
                        </strong>
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>

                {/* Criteria list */}
                {isExpanded && domain.children && domain.children.length > 0 && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {domain.children.map((criterion) => {
                      const isExpCrit = expandedCriteria.has(criterion.id);
                      // Un critère se déplie s'il porte des options, des plages ou
                      // des sous-critères — ce dernier cas, le plus fréquent dans ce
                      // modèle, n'était pas prévu : aucun critère n'était dépliable.
                      const sousCriteres = criterion.children ?? [];
                      const hasDetails =
                        (criterion.options?.length ?? 0) > 0 ||
                        (criterion.ranges?.length ?? 0) > 0 ||
                        sousCriteres.length > 0;

                      return (
                        <div key={criterion.id}>
                          <button
                            onClick={() => hasDetails && toggleCriterion(criterion.id)}
                            className={`w-full flex items-start gap-4 px-5 py-3.5 transition-colors text-left ${
                              hasDetails ? "hover:bg-accent/20 cursor-pointer" : "cursor-default"
                            }`}
                          >
                            <div className="flex-1 min-w-0 ml-10">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground font-mono">{criterion.code}</span>
                                <span className="text-foreground text-sm font-medium">{criterion.label}</span>
                                {/* Le badge de type ne vaut que pour un nœud qui se
                                    saisit : il s'affichait « Options » sur les nœuds
                                    d'agrégation, qui n'ont pas de type de réponse. */}
                                {criterion.answerType ? (
                                  <span className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                    criterion.answerType === "NUMERIC_RANGE"
                                      ? "bg-warning-subtle text-warning"
                                      : "bg-accent text-accent-foreground"
                                  }`}>
                                    {criterion.answerType === "NUMERIC_RANGE" ? (
                                      <><Hash size={10} /> Numérique</>
                                    ) : (
                                      <><ListOrdered size={10} /> Options</>
                                    )}
                                  </span>
                                ) : sousCriteres.length > 0 ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    {sousCriteres.length} sous-critère
                                    {sousCriteres.length > 1 ? "s" : ""}
                                  </span>
                                ) : null}
                              </div>
                              {criterion.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{criterion.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground mt-0.5">
                              <span title={formatPoidsDetail(criterion.weight, sommeFratrie(domain.children))}>
                                Poids{" "}
                                {formatPart(criterion.weight, sommeFratrie(domain.children)) ?? "—"}
                              </span>
                              {hasDetails && (
                                isExpCrit
                                  ? <ChevronDown size={14} />
                                  : <ChevronRight size={14} />
                              )}
                            </div>
                          </button>

                          {/* Sous-critères : ce sont eux qui portent la notation. */}
                          {isExpCrit && sousCriteres.length > 0 && (
                            <div className="ml-24 mr-5 mb-3 space-y-2">
                              {sousCriteres.map((sc) => (
                                <div
                                  key={sc.id}
                                  className="rounded-lg border border-border overflow-hidden"
                                >
                                  <div className="flex flex-wrap items-baseline justify-between gap-2 bg-muted/40 px-3 py-2">
                                    <span className="text-xs">
                                      <span className="font-mono text-muted-foreground">
                                        {sc.code}
                                      </span>{" "}
                                      <span className="text-foreground">{sc.label}</span>
                                    </span>
                                    <span
                                      className="text-[11px] text-muted-foreground"
                                      title={formatPoidsDetail(sc.weight, sommeFratrie(sousCriteres))}
                                    >
                                      Poids {formatPart(sc.weight, sommeFratrie(sousCriteres)) ?? "—"}
                                    </span>
                                  </div>
                                  {(sc.options?.length ?? 0) > 0 && (
                                    <table className="w-full text-xs">
                                      <tbody className="divide-y divide-border/50">
                                        {sc.options!.map((opt, i) => (
                                          <tr key={`${sc.id}-${i}`} className="text-secondary-foreground">
                                            <td className="px-3 py-1.5">{opt.label}</td>
                                            <td className={`px-3 py-1.5 text-right font-bold ${classeScoreRelatif(
                                              opt.score,
                                              Math.max(...sc.options!.map((o) => o.score))
                                            )}`}>{opt.score} pts</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                  {(sc.ranges?.length ?? 0) > 0 && (
                                    <table className="w-full text-xs">
                                      <tbody className="divide-y divide-border/50">
                                        {sc.ranges!.map((r, i) => (
                                          <tr key={`${sc.id}-r-${i}`} className="text-secondary-foreground">
                                            <td className="px-3 py-1.5">{r.label ?? "—"}</td>
                                            <td className="px-3 py-1.5 text-center font-mono">
                                              {r.minValue} → {r.maxValue === 999 ? "∞" : r.maxValue}
                                            </td>
                                            <td className={`px-3 py-1.5 text-right font-bold ${classeScoreRelatif(
                                              r.score,
                                              Math.max(...sc.ranges!.map((x) => x.score))
                                            )}`}>{r.score} pts</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                  {(sc.options?.length ?? 0) === 0 &&
                                    (sc.ranges?.length ?? 0) === 0 && (
                                      <p className="px-3 py-2 text-xs text-muted-foreground">
                                        Aucune option ni plage : ce sous-critère n&apos;est pas
                                        notable en l&apos;état.
                                      </p>
                                    )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Options ou plages portées par le critère lui-même */}
                          {isExpCrit && sousCriteres.length === 0 && (
                            <div className="ml-24 mr-5 mb-3 rounded-lg border border-border overflow-hidden">
                              {criterion.options && criterion.options.length > 0 && (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50 text-muted-foreground">
                                      <th className="text-left px-3 py-2 font-medium">Option</th>
                                      <th className="text-right px-3 py-2 font-medium">Score</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {criterion.options.map((opt) => (
                                      <tr key={opt.value} className="text-secondary-foreground">
                                        <td className="px-3 py-2">{opt.label}</td>
                                        <td className={`px-3 py-2 text-right font-bold ${classeScoreRelatif(
                                          opt.score,
                                          Math.max(...criterion.options!.map((o) => o.score))
                                        )}`}>{opt.score} pts</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              {criterion.ranges && criterion.ranges.length > 0 && (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/50 text-muted-foreground">
                                      <th className="text-left px-3 py-2 font-medium">Plage</th>
                                      <th className="text-center px-3 py-2 font-medium">Min</th>
                                      <th className="text-center px-3 py-2 font-medium">Max</th>
                                      <th className="text-right px-3 py-2 font-medium">Score</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {criterion.ranges.map((r, i) => (
                                      <tr key={i} className="text-secondary-foreground">
                                        <td className="px-3 py-2">{r.label ?? "—"}</td>
                                        <td className="px-3 py-2 text-center font-mono">{r.minValue}</td>
                                        <td className="px-3 py-2 text-center font-mono">{r.maxValue === 999 ? "∞" : r.maxValue}</td>
                                        <td className={`px-3 py-2 text-right font-bold ${classeScoreRelatif(
                                          r.score,
                                          Math.max(...criterion.ranges!.map((x) => x.score))
                                        )}`}>{r.score} pts</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !error && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Settings size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun modèle de scoring configuré</p>
            <p className="text-muted-foreground text-sm mt-1">
              Exécutez le fichier{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-primary">SUPABASE_INSERT_SCRIPT.sql</code>{" "}
              dans la console Supabase pour initialiser le modèle.
            </p>
          </div>
        )
      )}

      {/* Footer summary */}
      {questionnaire.length > 0 && (
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground flex flex-wrap gap-6">
          <span title="Les poids sont relatifs : le moteur divise chacun par ce total.">
            Total des poids de domaine :{" "}
            <strong className="text-secondary-foreground">
              {String(sommeDomaines).replace(".", ",")}
            </strong>
          </span>
          <span>
            Critères OPTION :{" "}
            <strong className="text-secondary-foreground">
              {questionnaire.reduce(
                (s, d) => s + (d.children?.filter((c) => c.answerType === "OPTION_SINGLE").length ?? 0),
                0
              )}
            </strong>
          </span>
          <span>
            Critères NUMÉRIQUE :{" "}
            <strong className="text-secondary-foreground">
              {questionnaire.reduce(
                (s, d) => s + (d.children?.filter((c) => c.answerType === "NUMERIC_RANGE").length ?? 0),
                0
              )}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
