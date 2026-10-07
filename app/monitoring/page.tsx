"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { formatMAD, formatMADCompact, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note } from "@/components/ui/status-badge";
import { useVoirScores } from "@/components/providers/visibilite-scores";

/** Plancher de couverture du service de la dette, condition rédhibitoire du modèle. */
const DSCR_PLANCHER = 1.1;

interface Projet {
  id: string;
  nom: string;
  status: string;
  secteur?: string | null;
  montant: number;
  scoreGlobal: number | null;
  grade: string | null;
  client?: { id: string; nom: string } | null;
  coutTotal?: number | null;
  tauxCouverture?: number | null;
  ratio?: number | null;
  dureeCredit?: number | null;
  debutConstruction?: string | null;
  finConstruction?: string | null;
  dateMiseAJour?: string | null;
}

/** Avancement de la construction entre ses deux bornes, en pourcentage. */
function avancement(p: Projet): number | null {
  if (!p.debutConstruction || !p.finConstruction) return null;
  const debut = new Date(p.debutConstruction).getTime();
  const fin = new Date(p.finConstruction).getTime();
  if (Number.isNaN(debut) || Number.isNaN(fin) || fin <= debut) return null;
  const maintenant = Date.now();
  if (maintenant <= debut) return 0;
  if (maintenant >= fin) return 100;
  return ((maintenant - debut) / (fin - debut)) * 100;
}

/**
 * Suivi des projets financés.
 *
 * L'écran s'intitulait « Suivi post-clôture » mais listait les six projets, brouillons
 * et dossiers rejetés compris, et ouvrait par défaut sur un brouillon. Ses seuils
 * étaient calibrés pour une échelle sur 10 — « ≥ 7 » pour un score qui va jusqu'à 100 —
 * si bien qu'un dossier noté 41,3 et rejeté s'affichait en vert. Les « indicateurs de
 * suivi » n'étaient que le score, la note et le statut répétés trois fois, alors que
 * le dossier porte un DSCR, un levier, une durée de crédit et un calendrier de
 * construction.
 */
export default function MonitoringPage() {
  const voirScores = useVoirScores();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [details, setDetails] = useState<Record<string, Projet>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/projects?limit=200");
        if (!res.ok) throw new Error(await messageErreurApi(res, "Chargement des projets impossible."));
        const liste: Projet[] = (await res.json()).data ?? [];
        setProjets(liste);

        // La liste ne porte ni DSCR ni calendrier : le détail n'est chargé que pour
        // les dossiers effectivement suivis.
        const suivis = liste.filter((p) => p.status === "approuve");
        const charges = await Promise.all(
          suivis.map(async (p) => {
            try {
              const r = await apiGet(`/api/projects/${p.id}`);
              if (!r.ok) return null;
              const corps = await r.json();
              return (corps.data ?? corps) as Projet;
            } catch {
              return null;
            }
          })
        );
        setDetails(
          Object.fromEntries(
            charges.filter((p): p is Projet => Boolean(p?.id)).map((p) => [p.id, p])
          )
        );
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const suivis = useMemo(
    () =>
      projets
        .filter((p) => p.status === "approuve")
        .map((p) => details[p.id] ?? p)
        .sort((a, b) => (a.scoreGlobal ?? 0) - (b.scoreGlobal ?? 0)),
    [projets, details]
  );

  const encours = suivis.reduce((s, p) => s + (p.montant ?? 0), 0);
  const sousPlancher = suivis.filter(
    (p) => p.tauxCouverture != null && p.tauxCouverture < DSCR_PLANCHER
  ).length;
  const enConstruction = suivis.filter((p) => {
    const a = avancement(p);
    return a !== null && a < 100;
  }).length;

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
        titre="Suivi des projets financés"
        description="Dossiers approuvés : couverture de la dette, avancement de la construction, dérive de la note."
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {suivis.length === 0 ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<Activity size={28} />}
            titre="Aucun dossier financé"
            description="Le suivi porte sur les projets approuvés ; aucun ne l'est pour l'instant."
            action={{ href: "/projects", libelle: "Voir les projets" }}
          />
        </SectionCard>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tuile libelle="Dossiers suivis" valeur={String(suivis.length)} />
            <Tuile libelle="Encours" valeur={formatMADCompact(encours)} />
            <Tuile
              libelle="En construction"
              valeur={String(enConstruction)}
              precision="chantier non achevé"
            />
            <Tuile
              libelle="DSCR sous plancher"
              valeur={String(sousPlancher)}
              precision={`seuil ${DSCR_PLANCHER.toFixed(2).replace(".", ",")}x`}
              classe={sousPlancher > 0 ? "text-destructive" : "text-foreground"}
            />
          </div>

          <SectionCard sansPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { t: "Dossier", a: "left" },
                      { t: "Encours", a: "right" },
                      ...(voirScores ? [{ t: "Note à l'octroi", a: "left" }] : []),
                      { t: "DSCR", a: "right" },
                      { t: "Levier", a: "right" },
                      { t: "Construction", a: "left" },
                      { t: "Dernière mise à jour", a: "left" },
                    ].map((c, i) => (
                      <th
                        key={i}
                        className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                          c.a === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        {c.t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suivis.map((p) => {
                    const a = avancement(p);
                    const dscrFaible =
                      p.tauxCouverture != null && p.tauxCouverture < DSCR_PLANCHER;
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-border last:border-b-0 hover:bg-surface"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {p.nom}
                          </Link>
                          {p.client?.nom && (
                            <span className="block text-[11.5px] text-muted-foreground">
                              {p.client.nom}
                            </span>
                          )}
                        </td>
                        <td
                          className="whitespace-nowrap px-4 py-3 text-right tabulaire"
                          title={formatMAD(p.montant)}
                        >
                          {formatMADCompact(p.montant)}
                        </td>
                        {voirScores && (
                          <td className="px-4 py-3">
                            <Note note={p.grade} score={p.scoreGlobal} />
                          </td>
                        )}
                        {/* Le seuil est celui du modèle, sur la bonne échelle : les
                            couleurs se calaient auparavant sur un score sur 10. */}
                        <td
                          className={`px-4 py-3 text-right tabulaire ${
                            dscrFaible ? "font-semibold text-destructive" : "text-foreground"
                          }`}
                          title={
                            dscrFaible
                              ? `Sous le plancher de ${DSCR_PLANCHER}x`
                              : undefined
                          }
                        >
                          {p.tauxCouverture != null
                            ? `${p.tauxCouverture.toFixed(2).replace(".", ",")}x`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabulaire text-foreground">
                          {p.ratio != null
                            ? `${p.ratio.toFixed(2).replace(".", ",")}x`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {a === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="block min-w-[140px]">
                              <span className="mb-1 flex items-baseline justify-between gap-2 text-[11.5px] text-muted-foreground">
                                <span>
                                  {a >= 100 ? "Achevée" : `${a.toFixed(0)} %`}
                                </span>
                                <span>
                                  {p.finConstruction ? formatDate(p.finConstruction) : ""}
                                </span>
                              </span>
                              <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <span
                                  className="block h-full rounded-full bg-primary"
                                  style={{ width: `${a}%` }}
                                />
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12.5px] text-muted-foreground">
                          {p.dateMiseAJour ? formatDate(p.dateMiseAJour) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <p className="mt-3 text-[12px] text-muted-foreground">
            Les dossiers en instruction, en revue ou rejetés ne figurent pas ici : ils
            se suivent depuis la liste des projets. Le score affiché est celui de
            l&apos;octroi ;{" "}
            <Link href="/evaluations" className="text-primary hover:underline">
              une réévaluation
            </Link>{" "}
            le met à jour.
          </p>
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
  precision?: string;
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
      {precision && (
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{precision}</p>
      )}
    </div>
  );
}
