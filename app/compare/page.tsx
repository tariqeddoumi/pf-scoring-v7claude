"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, Loader2, Scale, Search } from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { formatMADCompact, formatDate } from "@/lib/utils";
import { scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutProjet } from "@/components/ui/status-badge";

const MAXIMUM = 4;

interface Projet {
  id: string;
  nom: string;
  secteur?: string | null;
  pays?: string | null;
  montant: number;
  devise?: string | null;
  status: string;
  scoreGlobal: number | null;
  grade: string | null;
  coutTotal?: number | null;
  financement?: number | null;
  apportPropre?: number | null;
  tauxCouverture?: number | null;
  ratio?: number | null;
  taux?: number | null;
  dureeCredit?: number | null;
  capaciteInstallee?: number | null;
  debutConstruction?: string | null;
  finConstruction?: string | null;
  client?: { id: string; nom: string } | null;
}

/** Sens de lecture d'une ligne chiffrée : une valeur haute est-elle meilleure ? */
type Sens = "haut" | "bas" | "aucun";

interface Ligne {
  libelle: string;
  valeur: (p: Projet) => string | React.ReactNode;
  /** Valeur numérique comparable, pour souligner le meilleur et le moins bon. */
  nombre?: (p: Projet) => number | null;
  sens?: Sens;
  section: string;
}

/**
 * Comparaison de dossiers.
 *
 * Le tableau n'alignait que six lignes reprises de la liste — score, note, statut,
 * montant, devise, secteur — dont aucune n'aide à décider : ni structure de
 * financement, ni DSCR, ni levier, ni calendrier. Les scores s'affichaient sur une
 * échelle de 10 (« 74.40/10 »), le bouton « Exporter » n'était relié à rien, un
 * cinquième dossier cliqué était ignoré sans un mot, et un seul dossier produisait
 * un tableau à une colonne.
 */
export default function ComparaisonPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const [libelleSecteur, setLibelleSecteur] = useState<Record<string, string>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [res, resSecteurs] = await Promise.all([
          apiGet("/api/projects?limit=200"),
          apiGet("/api/reference/sectors"),
        ]);
        if (!res.ok) throw new Error(await messageErreurApi(res, "Chargement des projets impossible."));
        setProjets((await res.json()).data ?? []);
        if (resSecteurs.ok) {
          const liste: { code: string; label: string }[] =
            (await resSecteurs.json()).data ?? [];
          setLibelleSecteur(Object.fromEntries(liste.map((s) => [s.code, s.label])));
        }
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const basculer = (id: string) => {
    setAvis(null);
    setChoisis((prec) => {
      if (prec.includes(id)) return prec.filter((x) => x !== id);
      if (prec.length >= MAXIMUM) {
        // Le cinquième clic était ignoré sans aucun retour.
        setAvis(`Quatre dossiers au maximum : retirez-en un pour en ajouter un autre.`);
        return prec;
      }
      return [...prec, id];
    });
  };

  /**
   * La liste ne porte que l'essentiel : ni coût total, ni DSCR, ni levier. Le détail
   * du dossier n'est chargé que pour les quatre dossiers comparés, une fois chacun.
   */
  const [details, setDetails] = useState<Record<string, Projet>>({});
  const [chargementDetails, setChargementDetails] = useState(false);

  useEffect(() => {
    const manquants = choisis.filter((id) => !details[id]);
    if (manquants.length === 0) return;
    let annule = false;
    (async () => {
      setChargementDetails(true);
      const charges = await Promise.all(
        manquants.map(async (id) => {
          try {
            const res = await apiGet(`/api/projects/${id}`);
            if (!res.ok) return null;
            const corps = await res.json();
            // La route renvoie le projet à plat ; d'autres l'enveloppent dans data.
            return (corps.data ?? corps) as Projet;
          } catch {
            return null;
          }
        })
      );
      if (annule) return;
      setDetails((prec) => {
        const suite = { ...prec };
        for (const p of charges) if (p?.id) suite[p.id] = p;
        return suite;
      });
      setChargementDetails(false);
    })();
    return () => {
      annule = true;
    };
  }, [choisis, details]);

  const selection = useMemo(
    () =>
      choisis
        .map((id) => details[id] ?? projets.find((p) => p.id === id))
        .filter(Boolean) as Projet[],
    [choisis, projets, details]
  );

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return projets.filter((p) =>
      !q ? true : `${p.nom} ${p.client?.nom ?? ""}`.toLowerCase().includes(q)
    );
  }, [projets, recherche]);

  const secteur = (code?: string | null) =>
    code ? (libelleSecteur[code] ?? code) : "—";

  const partFondsPropres = (p: Projet) =>
    p.coutTotal && p.apportPropre != null && p.coutTotal > 0
      ? (p.apportPropre / p.coutTotal) * 100
      : null;

  const dureeConstruction = (p: Projet) => {
    if (!p.debutConstruction || !p.finConstruction) return null;
    const d = new Date(p.debutConstruction).getTime();
    const f = new Date(p.finConstruction).getTime();
    if (Number.isNaN(d) || Number.isNaN(f) || f <= d) return null;
    return Math.round((f - d) / (30.44 * 86_400_000));
  };

  const LIGNES: Ligne[] = [
    {
      section: "Dossier",
      libelle: "Client",
      valeur: (p) => p.client?.nom ?? "—",
    },
    { section: "Dossier", libelle: "Secteur", valeur: (p) => secteur(p.secteur) },
    { section: "Dossier", libelle: "Pays", valeur: (p) => p.pays ?? "—" },
    {
      section: "Dossier",
      libelle: "Statut",
      valeur: (p) => <StatutProjet statut={p.status} />,
    },
    {
      section: "Notation",
      libelle: "Note",
      valeur: (p) => <Note note={p.grade} />,
    },
    {
      section: "Notation",
      libelle: "Score sur 100",
      valeur: (p) =>
        p.scoreGlobal != null ? (
          <span className={`font-semibold ${scoreTextClass(p.scoreGlobal)}`}>
            {p.scoreGlobal.toFixed(1).replace(".", ",")}
          </span>
        ) : (
          "—"
        ),
      nombre: (p) => p.scoreGlobal,
      sens: "haut",
    },
    {
      section: "Financement",
      libelle: "Montant sollicité",
      valeur: (p) => (p.montant != null ? formatMADCompact(p.montant) : "—"),
      nombre: (p) => p.montant,
      sens: "aucun",
    },
    {
      section: "Financement",
      libelle: "Coût total",
      valeur: (p) => (p.coutTotal != null ? formatMADCompact(p.coutTotal) : "—"),
      nombre: (p) => p.coutTotal ?? null,
      sens: "aucun",
    },
    {
      section: "Financement",
      libelle: "Dette",
      valeur: (p) => (p.financement != null ? formatMADCompact(p.financement) : "—"),
      nombre: (p) => p.financement ?? null,
      sens: "aucun",
    },
    {
      section: "Financement",
      libelle: "Fonds propres",
      valeur: (p) => {
        const pct = partFondsPropres(p);
        return p.apportPropre != null
          ? `${formatMADCompact(p.apportPropre)}${
              pct != null ? ` · ${pct.toFixed(1).replace(".", ",")} %` : ""
            }`
          : "—";
      },
      nombre: partFondsPropres,
      sens: "haut",
    },
    {
      section: "Financement",
      libelle: "DSCR",
      valeur: (p) =>
        p.tauxCouverture != null
          ? `${p.tauxCouverture.toFixed(2).replace(".", ",")}x`
          : "—",
      nombre: (p) => p.tauxCouverture ?? null,
      sens: "haut",
    },
    {
      section: "Financement",
      libelle: "Levier dette / fonds propres",
      valeur: (p) => (p.ratio != null ? `${p.ratio.toFixed(2).replace(".", ",")}x` : "—"),
      nombre: (p) => p.ratio ?? null,
      sens: "bas",
    },
    {
      section: "Financement",
      libelle: "Taux",
      valeur: (p) => (p.taux != null ? `${String(p.taux).replace(".", ",")} %` : "—"),
      nombre: (p) => p.taux ?? null,
      sens: "bas",
    },
    {
      section: "Financement",
      libelle: "Durée du crédit",
      valeur: (p) => (p.dureeCredit != null ? `${p.dureeCredit} ans` : "—"),
      nombre: (p) => p.dureeCredit ?? null,
      sens: "aucun",
    },
    {
      section: "Projet",
      // L'unité dépend de la technologie — MW pour un parc éolien, m³/jour pour une
      // station de dessalement : l'écran affichait « 150000 MW » pour cette dernière.
      libelle: "Capacité installée",
      valeur: (p) =>
        p.capaciteInstallee != null
          ? p.capaciteInstallee.toLocaleString("fr-FR")
          : "—",
      nombre: (p) => p.capaciteInstallee ?? null,
      sens: "aucun",
    },
    {
      section: "Projet",
      libelle: "Construction",
      valeur: (p) => {
        const mois = dureeConstruction(p);
        return p.debutConstruction
          ? `${formatDate(p.debutConstruction)} → ${
              p.finConstruction ? formatDate(p.finConstruction) : "—"
            }${mois ? ` (${mois} mois)` : ""}`
          : "—";
      },
      nombre: dureeConstruction,
      sens: "bas",
    },
  ];

  const sections = [...new Set(LIGNES.map((l) => l.section))];

  /** Le bouton d'export n'était relié à rien : il produit un vrai fichier. */
  const exporter = () => {
    const entetes = ["Indicateur", ...selection.map((p) => p.nom)];
    const lignes = LIGNES.map((l) => [
      l.libelle,
      ...selection.map((p) => {
        const n = l.nombre?.(p);
        if (n !== undefined && n !== null) return String(n).replace(".", ",");
        const v = l.valeur(p);
        return typeof v === "string" ? v : "";
      }),
    ]);
    const csv = [entetes, ...lignes]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    // Point de code BOM : sans lui, Excel lit mal les accents.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `comparaison-${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

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
        titre="Comparaison"
        description={`Jusqu'à ${MAXIMUM} dossiers côte à côte.`}
        actions={
          selection.length >= 2 && (
            <button
              onClick={exporter}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download size={15} />
              Exporter en CSV
            </button>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <SectionCard
          titre="Dossiers"
          description={`${choisis.length}/${MAXIMUM} sélectionné${choisis.length > 1 ? "s" : ""}${
            chargementDetails ? " · chargement…" : ""
          }`}
          className="lg:col-span-1"
        >
          <div className="relative mb-2">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Filtrer…"
              aria-label="Filtrer les projets"
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          {avis && (
            <p className="mb-2 rounded-md bg-warning-subtle px-2.5 py-1.5 text-[12px] text-warning">
              {avis}
            </p>
          )}

          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {filtres.map((p) => {
              const actif = choisis.includes(p.id);
              return (
                <li key={p.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors ${
                      actif ? "bg-accent" : "hover:bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={actif}
                      onChange={() => basculer(p.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] text-foreground">{p.nom}</span>
                      <span className="block text-[11.5px] text-muted-foreground">
                        {[p.client?.nom, formatMADCompact(p.montant)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="lg:col-span-3">
          {selection.length < 2 ? (
            <SectionCard sansPadding>
              <EmptyState
                icone={<Scale size={28} />}
                titre="Choisissez deux dossiers"
                description="La comparaison s'affiche dès que deux dossiers sont sélectionnés ; quatre au maximum."
              />
            </SectionCard>
          ) : (
            <SectionCard sansPadding>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Indicateur
                      </th>
                      {selection.map((p) => (
                        <th key={p.id} className="px-4 py-2.5 text-left">
                          <Link
                            href={`/projects/${p.id}`}
                            className="text-[13px] font-semibold text-foreground hover:underline"
                          >
                            {p.nom}
                          </Link>
                          <span className="block text-[11.5px] font-normal text-muted-foreground">
                            {p.client?.nom ?? "—"}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section) => (
                      <Fragment key={section}>
                        <tr className="bg-surface">
                          <td
                            colSpan={selection.length + 1}
                            className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {section}
                          </td>
                        </tr>
                        {LIGNES.filter((l) => l.section === section).map((l) => {
                          const nombres = l.nombre
                            ? selection.map((p) => l.nombre!(p))
                            : [];
                          const valides = nombres.filter(
                            (n): n is number => n !== null && Number.isFinite(n)
                          );
                          // Une égalité n'a pas de gagnant : marquer les deux
                          // colonnes ferait croire à un avantage inexistant.
                          const extremum =
                            l.sens && l.sens !== "aucun" && valides.length > 1
                              ? l.sens === "haut"
                                ? Math.max(...valides)
                                : Math.min(...valides)
                              : null;
                          const meilleur =
                            extremum !== null &&
                            valides.filter((n) => n === extremum).length === 1
                              ? extremum
                              : null;
                          return (
                            <tr key={l.libelle} className="border-b border-border last:border-b-0">
                              <td className="px-4 py-2.5 text-[12.5px] text-muted-foreground">
                                {l.libelle}
                              </td>
                              {selection.map((p, i) => {
                                const estMeilleur =
                                  meilleur !== null && nombres[i] === meilleur;
                                return (
                                  <td
                                    key={p.id}
                                    className={`px-4 py-2.5 tabulaire ${
                                      estMeilleur ? "font-semibold text-foreground" : "text-foreground"
                                    }`}
                                    title={
                                      estMeilleur
                                        ? l.sens === "haut"
                                          ? "Valeur la plus favorable"
                                          : "Valeur la plus favorable (la plus basse)"
                                        : undefined
                                    }
                                  >
                                    {estMeilleur && (
                                      <span
                                        aria-hidden
                                        className="mr-1 text-success"
                                        title="Valeur la plus favorable"
                                      >
                                        ▲
                                      </span>
                                    )}
                                    {l.valeur(p)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border px-4 py-2 text-[12px] text-muted-foreground">
                Le triangle signale, pour chaque ligne chiffrée, la valeur la plus
                favorable. Montants en {selection[0]?.devise ?? "MAD"}.
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
