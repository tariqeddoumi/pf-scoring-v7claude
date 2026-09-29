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
import type { QuestionnaireNode } from "@/lib/services/scoring-questionnaire-service";

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
  avancement?: { repondues: number; total: number };
}

/**
 * Démarrage d'une évaluation.
 *
 * L'écran demandait de choisir le projet dans une liste déroulante ne montrant que
 * son nom : ni client, ni montant, ni statut, et surtout aucune trace des brouillons
 * déjà ouverts — on pouvait ainsi créer un second brouillon sur un dossier à moitié
 * saisi. Il proposait en outre une « recommandation initiale » présélectionnée sur
 * « Approuver » avant toute analyse, qui n'était de toute façon jamais enregistrée.
 */
export default function NouvelleEvaluationPage() {
  const router = useRouter();
  const [projets, setProjets] = useState<Projet[]>([]);
  const [brouillons, setBrouillons] = useState<Brouillon[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireNode[]>([]);
  const [version, setVersion] = useState<{ id: string; label?: string; versionNumber?: number } | null>(null);
  const [libelleSecteur, setLibelleSecteur] = useState<Record<string, string>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [contexte, setContexte] = useState("");
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [resProjets, resEvals, resQuestionnaire, resSecteurs] = await Promise.all([
          apiGet("/api/projects?limit=200"),
          apiGet("/api/evaluations?limit=200"),
          apiGet("/api/scoring/questionnaire"),
          apiGet("/api/reference/sectors"),
        ]);

        if (resProjets.ok) setProjets((await resProjets.json()).data ?? []);
        if (resEvals.ok) {
          const liste = (await resEvals.json()).data ?? [];
          setBrouillons(
            liste.filter(
              (e: { status: string; isArchived?: boolean }) =>
                e.status === "brouillon" && !e.isArchived
            )
          );
        }
        if (resQuestionnaire.ok) {
          const q = await resQuestionnaire.json();
          setQuestionnaire(q.data ?? []);
          setVersion(q.modelVersion ?? (q.modelVersionId ? { id: q.modelVersionId } : null));
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
    if (!version?.id) {
      setErreur(
        "Aucune version de modèle publiée : une évaluation ne serait pas reproductible."
      );
      return;
    }
    setEnCours(projet.id);
    setErreur(null);
    try {
      const res = await apiPost("/api/scoring/evaluations", {
        projectId: projet.id,
        modelVersionId: version.id,
        // Le contexte saisi ici était jeté : le formulaire ne l'envoyait pas.
        notes: contexte.trim() || undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Création de l'évaluation impossible.");
      }
      const { data } = await res.json();
      router.push(`/evaluations/${data.id}/saisie`);
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

  const nbCriteres = questionnaire.reduce((s, d) => s + (d.children?.length ?? 0), 0);

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

      {!version?.id && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          Aucun modèle de scoring publié. Une évaluation ne peut être créée tant
          qu&apos;une version n&apos;est pas publiée —{" "}
          <Link href="/admin/scoring" className="underline">
            gérer les versions du modèle
          </Link>
          .
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
                        href={`/evaluations/${brouillon.id}/saisie`}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-primary/40 bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Reprendre la saisie
                        {brouillon.avancement?.total ? (
                          <span className="tabulaire text-[12.5px] font-normal">
                            {brouillon.avancement.repondues}/{brouillon.avancement.total}
                          </span>
                        ) : null}
                      </Link>
                    ) : (
                      <button
                        onClick={() => lancer(p)}
                        disabled={!version?.id || enCours !== null}
                        title={
                          !version?.id ? "Aucune version de modèle publiée" : undefined
                        }
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
          <SectionCard titre="Contexte (facultatif)">
            <textarea
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              rows={3}
              placeholder="Origine du dossier, points d'attention connus…"
              aria-label="Contexte de l'évaluation"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              Ce texte est enregistré avec l&apos;évaluation créée et reste modifiable
              pendant la saisie.
            </p>
          </SectionCard>

          <SectionCard
            titre="Modèle appliqué"
            description={
              version?.label ??
              (version?.versionNumber ? `Version ${version.versionNumber}` : undefined)
            }
          >
            {questionnaire.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun modèle actif.</p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {questionnaire.map((d) => (
                    <li key={d.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <span className="text-foreground">{d.label}</span>
                      <span className="tabulaire shrink-0 text-muted-foreground">
                        {d.weight != null
                          ? `${String(d.weight).replace(".", ",")} %`
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Le panneau annonçait « 28 critères » quand la saisie en demande 84 :
                    le questionnaire est tronqué au niveau critère, chaque critère étant
                    noté par ses sous-critères. Le libellé le dit maintenant. */}
                <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
                  {questionnaire.length} domaines · {nbCriteres} critères, notés
                  sous-critère par sous-critère à la saisie.
                </p>
              </>
            )}
          </SectionCard>

          <SectionCard titre="Déroulé">
            <ol className="list-inside list-decimal space-y-1.5 text-[12.5px] text-muted-foreground">
              <li>Choisir le projet ci-contre</li>
              <li>Renseigner les critères, domaine par domaine</li>
              <li>Calculer la note et lire la trace</li>
              <li>Soumettre à validation</li>
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
