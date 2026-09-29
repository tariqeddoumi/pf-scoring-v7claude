"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  FileText,
  Loader2,
  Sliders,
} from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { formatMAD, formatMADCompact } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutProjet } from "@/components/ui/status-badge";
import { ratingBadgeClass, scoreTone } from "@/lib/score-colors";

interface Projet {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
  dateCreation: string;
  client?: { nom: string } | null;
}

interface Evaluation {
  id: string;
  projectId: string;
  finalScore: number | null;
  rating: string | null;
  status: string;
  updatedAt?: string;
  submittedAt?: string | null;
  project?: { nom: string } | null;
}

interface Alerte {
  id: string;
  type: string;
  severite: "critique" | "vigilance" | "information";
  titre: string;
  message: string;
  projectName: string;
  lienAction: string;
}

/** Échelle complète du barème : on montre aussi les paliers vides. */
const ECHELLE = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "CC", "C", "D"];

/**
 * Tableau de bord du portefeuille.
 *
 * L'écran précédent répondait « combien ? » — quatre aplats en dégradé donnant des
 * totaux — là où un chargé d'affaires ouvre son outil pour savoir « qu'ai-je à
 * faire ? ». Il additionnait par ailleurs tous les montants, dossiers rejetés
 * compris, sous le libellé « Exposition totale », affichait le score moyen « sur 10 »
 * alors que l'échelle est passée sur 100, et déversait le JSON brut du journal
 * d'audit dans « Activités récentes ».
 *
 * L'écran part maintenant des dossiers qui demandent une décision, puis donne la
 * lecture du portefeuille. Chaque chiffre dit ce qu'il recouvre.
 */
export default function DashboardPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const [rProjets, rEvals, rAlertes] = await Promise.all([
        apiGet("/api/projects?limit=200"),
        apiGet("/api/evaluations?limit=200"),
        apiGet("/api/alerts"),
      ]);
      // Un appel en échec était ignoré sans un mot : l'écran affichait des zéros,
      // qu'on lisait comme un portefeuille vide plutôt que comme une panne.
      const echecs: string[] = [];
      if (rProjets.ok) setProjets((await rProjets.json()).data ?? []);
      else echecs.push(await messageErreurApi(rProjets, "Projets :"));
      if (rEvals.ok) setEvaluations((await rEvals.json()).data ?? []);
      else echecs.push(await messageErreurApi(rEvals, "Évaluations :"));
      if (rAlertes.ok) setAlertes((await rAlertes.json()).data ?? []);
      else echecs.push(await messageErreurApi(rAlertes, "Alertes :"));
      setErreur(echecs.join(" · "));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const chiffres = useMemo(() => {
    // Un dossier rejeté n'est pas un engagement : l'inclure gonflait le total.
    const enInstruction = projets.filter((p) => p.status !== "rejete");
    const engagements = enInstruction.reduce((s, p) => s + (p.montant || 0), 0);

    const calculees = evaluations.filter(
      (e) => e.finalScore !== null && Number.isFinite(e.finalScore)
    );
    const scoreMoyen = calculees.length
      ? calculees.reduce((s, e) => s + (e.finalScore as number), 0) / calculees.length
      : null;

    const bloquees = alertes.filter((a) => a.type === "blocage");
    // L'énumération en base utilise « soumis » ; la forme féminine circule dans
    // quelques écrans et dans les jeux d'essai.
    const aValider = evaluations.filter(
      (e) => e.status === "soumis" || e.status === "soumise"
    );
    const brouillons = evaluations.filter((e) => e.status === "brouillon");

    const parNote = new Map<string, number>();
    for (const e of calculees) {
      if (e.rating) parNote.set(e.rating, (parNote.get(e.rating) ?? 0) + 1);
    }

    const parSecteur = new Map<string, number>();
    for (const p of enInstruction) {
      parSecteur.set(p.secteur || "Non renseigné",
        (parSecteur.get(p.secteur || "Non renseigné") ?? 0) + (p.montant || 0));
    }

    return {
      enInstruction, engagements, calculees, scoreMoyen,
      bloquees, aValider, brouillons, parNote,
      parSecteur: [...parSecteur.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [projets, evaluations, alertes]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  const aFaire =
    chiffres.bloquees.length + chiffres.aValider.length + chiffres.brouillons.length;

  return (
    <div>
      <PageHeader
        titre="Tableau de bord"
        description="Portefeuille Project Finance"
        actions={
          <>
            <Link
              href="/dashboard-config"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Sliders size={15} />
              Personnaliser
            </Link>
            <Link
              href="/projects/new"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Nouveau projet
            </Link>
          </>
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          libelle="Engagements en instruction"
          valeur={formatMADCompact(chiffres.engagements).replace(" MAD", "")}
          unite="MAD"
          precision={`${chiffres.enInstruction.length} projets · hors dossiers rejetés`}
        />
        <KpiCard
          libelle="À traiter"
          valeur={aFaire}
          ton={chiffres.bloquees.length ? "alerte" : aFaire ? "vigilance" : "favorable"}
          precision={
            aFaire
              ? `${chiffres.bloquees.length} blocage · ${chiffres.aValider.length} à valider · ${chiffres.brouillons.length} en saisie`
              : "Aucun dossier en attente"
          }
        />
        <KpiCard
          libelle="Score moyen"
          valeur={
            chiffres.scoreMoyen !== null
              ? chiffres.scoreMoyen.toFixed(1).replace(".", ",")
              : "—"
          }
          unite={chiffres.scoreMoyen !== null ? "/ 100" : undefined}
          ton={chiffres.scoreMoyen !== null ? scoreTone(chiffres.scoreMoyen) === "success" ? "favorable" : scoreTone(chiffres.scoreMoyen) === "warning" ? "vigilance" : scoreTone(chiffres.scoreMoyen) === "destructive" ? "alerte" : "neutre" : "neutre"}
          precision={`sur ${chiffres.calculees.length} évaluation${chiffres.calculees.length > 1 ? "s" : ""} calculée${chiffres.calculees.length > 1 ? "s" : ""}`}
        />
        <KpiCard
          libelle="Projets suivis"
          valeur={projets.length}
          precision={`${projets.filter((p) => p.status === "approuve").length} approuvés · ${projets.filter((p) => p.status === "rejete").length} rejetés`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          <SectionCard
            titre="Dossiers demandant une action"
            actions={<span className="text-[12px] text-muted-foreground">{aFaire} dossiers</span>}
            sansPadding
          >
            {aFaire === 0 ? (
              <EmptyState
                icone={<CheckCircle2 size={28} className="text-success" />}
                titre="Rien en attente"
                description="Aucun seuil rédhibitoire, aucune évaluation à valider ni en cours de saisie."
              />
            ) : (
              <div>
                {chiffres.bloquees.map((a) => (
                  <Tache
                    key={a.id}
                    href={a.lienAction}
                    marque="alerte"
                    titre={a.projectName}
                    detail={a.message}
                    badge={<span className="inline-flex items-center gap-1 rounded-full bg-destructive-subtle px-2.5 py-0.5 text-[11.5px] font-semibold text-destructive"><Ban size={11} />Bloqué</span>}
                  />
                ))}
                {chiffres.aValider.map((e) => (
                  <Tache
                    key={e.id}
                    href={`/evaluations/${e.id}`}
                    marque="vigilance"
                    titre={e.project?.nom ?? "Projet"}
                    detail="Évaluation soumise, en attente de validation"
                    badge={<Note note={e.rating} score={e.finalScore} />}
                  />
                ))}
                {chiffres.brouillons.map((e) => (
                  <Tache
                    key={e.id}
                    href={`/evaluations/${e.id}/saisie`}
                    titre={e.project?.nom ?? "Projet"}
                    detail="Saisie en cours"
                    badge={<span className="rounded-full bg-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground">Brouillon</span>}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            titre="Portefeuille"
            actions={
              <Link href="/projects" className="text-[12.5px] font-semibold text-primary hover:underline">
                Tout voir →
              </Link>
            }
            sansPadding
          >
            {projets.length === 0 ? (
              <EmptyState
                icone={<FileText size={28} />}
                titre="Aucun projet"
                description="Créez un premier projet pour lancer une évaluation."
                action={{ href: "/projects/new", libelle: "Nouveau projet" }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {["Projet", "Client", "Montant", "Note", "Statut"].map((h, i) => (
                        <th
                          key={h}
                          className={`px-4 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${i === 2 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projets.slice(0, 8).map((p) => (
                      <tr key={p.id} className="border-t border-border transition-colors hover:bg-surface">
                        <td className="px-4 py-2.5">
                          <Link href={`/projects/${p.id}`} className="font-medium text-foreground hover:text-primary">
                            {p.nom}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-[12.5px] text-muted-foreground">
                          {p.client?.nom ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right" title={formatMAD(p.montant)}>
                          {formatMADCompact(p.montant)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Note note={p.grade} score={p.scoreGlobal} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatutProjet statut={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            titre="Notes attribuées"
            actions={
              <span className="text-[12px] text-muted-foreground">
                {chiffres.calculees.length} évaluations
              </span>
            }
          >
            {chiffres.calculees.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune évaluation calculée.
              </p>
            ) : (
              <>
                {ECHELLE.map((n) => {
                  const c = chiffres.parNote.get(n) ?? 0;
                  const pc = (c / chiffres.calculees.length) * 100;
                  return (
                    <div key={n} className="mb-1.5 flex items-center gap-2.5">
                      <span className={`w-10 rounded border px-1 text-center text-[11.5px] font-bold ${ratingBadgeClass(n)}`}>
                        {n}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${pc}%` }} />
                      </span>
                      <span className="w-4 text-right text-[11.5px] text-muted-foreground tabulaire">
                        {c || "—"}
                      </span>
                    </div>
                  );
                })}
                <p className="mt-3 border-t border-border pt-2.5 text-[11.5px] text-muted-foreground">
                  Barème de la banque · AAA ≥ 95 · D &lt; 25
                </p>
              </>
            )}
          </SectionCard>

          <SectionCard titre="Engagements par secteur">
            {chiffres.parSecteur.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucun projet en instruction.
              </p>
            ) : (
              chiffres.parSecteur.map(([s, v]) => {
                const max = chiffres.parSecteur[0][1];
                return (
                  <div key={s} className="mb-3 last:mb-0">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-[13px] text-foreground">{s}</span>
                      <span className="shrink-0 text-[12px] text-muted-foreground tabulaire">
                        {formatMADCompact(v)}
                      </span>
                    </div>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-chart-2" style={{ width: `${(v / max) * 100}%` }} />
                    </span>
                  </div>
                );
              })
            )}
          </SectionCard>

          {alertes.filter((a) => a.type !== "blocage").length > 0 && (
            <SectionCard
              titre="Autres alertes"
              actions={
                <Link href="/alerts" className="text-[12.5px] font-semibold text-primary hover:underline">
                  Toutes →
                </Link>
              }
              sansPadding
            >
              {alertes
                .filter((a) => a.type !== "blocage")
                .slice(0, 4)
                .map((a) => (
                  <Link
                    key={a.id}
                    href={a.lienAction}
                    className="flex gap-2.5 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-surface"
                  >
                    <AlertTriangle
                      size={15}
                      className={a.severite === "vigilance" ? "mt-0.5 shrink-0 text-warning" : "mt-0.5 shrink-0 text-muted-foreground"}
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">{a.titre}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {a.projectName}
                      </span>
                    </span>
                  </Link>
                ))}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Tache({
  href,
  titre,
  detail,
  badge,
  marque,
}: {
  href: string;
  titre: string;
  detail: string;
  badge: React.ReactNode;
  marque?: "alerte" | "vigilance";
}) {
  const barre =
    marque === "alerte" ? "bg-destructive" : marque === "vigilance" ? "bg-warning" : "bg-border";
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface"
    >
      <span className={`h-9 w-[3px] shrink-0 rounded-full ${barre}`} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">{titre}</span>
        <span className="block truncate text-[12px] text-muted-foreground">{detail}</span>
      </span>
      {badge}
      <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
    </Link>
  );
}
