"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Loader2, PlayCircle, Search } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { formatMADCompact } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatutProjet } from "@/components/ui/status-badge";
import { ORDRE_DOMAINES, PARAMETRES_DEFAUT } from "@/lib/modele-pf/parametres";

interface Projet {
  id: string;
  nom: string;
  secteur?: string | null;
  montant: number;
  status: string;
  client?: { id: string; nom: string } | null;
}

interface Brouillon {
  id: string;
  projectId: string;
}

/**
 * Démarrage d'une évaluation.
 *
 * L'écran demandait de choisir le projet dans une liste déroulante ne montrant que
 * son nom : ni client, ni montant, ni statut, et surtout aucune trace des brouillons
 * déjà ouverts — on pouvait ainsi créer un second brouillon sur un dossier à moitié
 * saisi. Il proposait en outre une « recommandation initiale » présélectionnée sur
 * « Approuver » avant toute analyse, qui n'était de toute façon jamais enregistrée.
 *
 * L'évaluation est le scoring Project Finance (parcours en 13 blocs) : elle se crée sur le
 * projet choisi et s'ouvre aussitôt dans l'écran de scoring.
 */
export default function NouvelleEvaluationPage() {
  const router = useRouter();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [brouillons, setBrouillons] = useState<Brouillon[]>([]);
  const [libelleSecteur, setLibelleSecteur] = useState<Record<string, string>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [contexte, setContexte] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [resProjets, resEvals, resSecteurs] = await Promise.all([
          apiGet("/api/projects?limit=200"),
          apiGet("/api/evaluations?limit=200&status=brouillon"),
          apiGet("/api/reference/sectors"),
        ]);

        if (resProjets.ok) setProjets((await resProjets.json()).data ?? []);
        if (resEvals.ok) {
          const liste = (await resEvals.json()).data ?? [];
          setBrouillons(liste.filter((e: { status: string }) => e.status === "brouillon"));
        }
        if (resSecteurs.ok) {
          const liste: { code: string; label: string }[] = (await resSecteurs.json()).data ?? [];
          setLibelleSecteur(Object.fromEntries(liste.map((s) => [s.code, s.label])));
        }
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const brouillonDe = useMemo(() => {
    const m = new Map<string, Brouillon>();
    for (const b of brouillons) if (!m.has(b.projectId)) m.set(b.projectId, b);
    return m;
  }, [brouillons]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return projets.filter((p) =>
      !q
        ? true
        : `${p.nom} ${p.client?.nom ?? ""} ${libelleSecteur[p.secteur ?? ""] ?? p.secteur ?? ""}`
            .toLowerCase()
            .includes(q)
    );
  }, [projets, recherche, libelleSecteur]);

  const lancer = async (projet: Projet) => {
    setEnCours(projet.id);
    setErreur(null);
    try {
      const res = await apiPost(`/api/projects/${projet.id}/evaluations-pf`, {
        titre: contexte.trim() || undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Création de l'évaluation impossible.");
      }
      const { id } = await res.json();
      router.push(`/scoring-pf/${id}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
      setEnCours(null);
    }
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
        titre="Nouvelle évaluation"
        description="Choisissez le dossier à noter : la saisie s'ouvre aussitôt."
        retour={{ href: "/evaluations", libelle: "Évaluations" }}
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-3">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un projet, un client, un secteur…"
              aria-label="Rechercher un projet"
              className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          {filtres.length === 0 ? (
            <SectionCard sansPadding>
              <EmptyState
                icone={<Briefcase size={28} />}
                titre={projets.length === 0 ? "Aucun projet" : "Aucun projet ne correspond"}
                description={
                  projets.length === 0
                    ? "Une évaluation porte toujours sur un projet : créez-le d'abord."
                    : "Modifiez votre recherche."
                }
                action={
                  projets.length === 0
                    ? { href: "/projects/new", libelle: "Nouveau projet" }
                    : undefined
                }
              />
            </SectionCard>
          ) : (
            <ul className="space-y-2">
              {filtres.map((p) => {
                const brouillon = brouillonDe.get(p.id);
                const occupe = enCours === p.id;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{p.nom}</span>
                        <StatutProjet statut={p.status} />
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {[
                          p.client?.nom,
                          libelleSecteur[p.secteur ?? ""] ?? p.secteur,
                          p.montant ? formatMADCompact(p.montant) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    {/* Un brouillon existe déjà : le proposer plutôt que d'en ouvrir un
                        second sur le même dossier, ce que rien n'empêchait. */}
                    {brouillon ? (
                      <Link
                        href={`/scoring-pf/${brouillon.id}`}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-primary/40 bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-primary/90 hover:text-primary-foreground"
                      >
                        Reprendre la saisie
                      </Link>
                    ) : (
                      <button
                        onClick={() => lancer(p)}
                        disabled={enCours !== null}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {occupe ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <PlayCircle size={15} />
                        )}
                        {occupe ? "Ouverture…" : "Évaluer"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <SectionCard titre="Intitulé (facultatif)">
            <input
              type="text"
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              maxLength={200}
              placeholder="Ex. : montage de base, variante restructurée…"
              aria-label="Intitulé de l'évaluation"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              Utile pour distinguer plusieurs évaluations d&apos;un même projet ; modifiable pendant la saisie.
            </p>
          </SectionCard>

          <SectionCard titre="Modèle appliqué" description="Scoring Project Finance — poids en construction / montée en charge / exploitation">
            <ul className="space-y-1.5">
              {ORDRE_DOMAINES.map((d) => (
                <li key={d} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="text-foreground">
                    {d} · {PARAMETRES_DEFAUT.libellesDomaines[d]}
                  </span>
                  <span className="tabulaire shrink-0 text-muted-foreground">
                    {(["P1", "P2", "P3"] as const).map((ph) => Math.round(PARAMETRES_DEFAUT.poidsDomaines[ph][d] * 100)).join(" / ")} %
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Poids candidats du modèle ; ceux en vigueur dans votre banque se règlent dans l&apos;administration du modèle PF.
            </p>
          </SectionCard>

          <SectionCard titre="Déroulé">
            <ol className="list-inside list-decimal space-y-1.5 text-[12.5px] text-muted-foreground">
              <li>Choisir le projet dans la liste</li>
              <li>Renseigner les 13 blocs (pièces et lecture par l&apos;IA en appui)</li>
              <li>Lire le score, la note, les plafonds et les verrous</li>
              <li>Soumettre à validation</li>
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
