"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, ClipboardList, Loader2, Search, Users, X } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatMADCompact, formatDate } from "@/lib/utils";
import { GRADE_THRESHOLDS } from "@/lib/constants";
import { scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutEvaluation, StatutProjet } from "@/components/ui/status-badge";

type TypeResultat = "projet" | "client" | "evaluation";

interface Resultat {
  id: string;
  type: TypeResultat;
  titre: string;
  /** Tout ce sur quoi la recherche porte, en plus du titre. */
  contexte: string;
  sousTitre: string;
  score?: number | null;
  note?: string | null;
  statut?: string | null;
  montant?: number | null;
  date?: string | null;
  lien: string;
}

const TYPES: { cle: TypeResultat | "tous"; libelle: string }[] = [
  { cle: "tous", libelle: "Tout" },
  { cle: "projet", libelle: "Projets" },
  { cle: "client", libelle: "Clients" },
  { cle: "evaluation", libelle: "Évaluations" },
];

/** La recherche ignore la casse et les accents : « energie » trouve « Énergie ». */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Recherche transversale.
 *
 * Les trois appels partaient en `fetch` nu, sans en-tête d'autorisation : sur une
 * base réelle, les routes protégées répondaient 401 et l'écran affichait « 0 résultat
 * trouvé » sans rien dire. Les scores s'affichaient sur une échelle de 10 (« 74.40/10 »)
 * alors que le moteur note sur 100, le filtre de notation s'arrêtait à BB — les
 * dossiers notés B, CCC, CC, C ou D étaient introuvables — et la recherche ne portait
 * que sur le titre : taper « Atlas » ne trouvait aucun des deux projets du sponsor.
 */
function Recherche() {
  const router = useRouter();
  const params = useSearchParams();

  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState<TypeResultat | "tous">(
    (params.get("type") as TypeResultat) ?? "tous"
  );
  const [note, setNote] = useState(params.get("note") ?? "");
  const [scoreMin, setScoreMin] = useState(Number(params.get("scoreMin") ?? 0));

  useEffect(() => {
    (async () => {
      try {
        const [resProjets, resClients, resEvals, resSecteurs] = await Promise.all([
          apiGet("/api/projects?limit=200"),
          apiGet("/api/clients?take=500"),
          apiGet("/api/evaluations?limit=200"),
          apiGet("/api/reference/sectors"),
        ]);

        // Les projets stockent le code du secteur ; c'est son libellé qui se lit.
        const libelleSecteur: Record<string, string> = {};
        if (resSecteurs.ok) {
          for (const s of (await resSecteurs.json()).data ?? []) {
            libelleSecteur[s.code] = s.label;
          }
        }
        const secteurLisible = (code?: string | null) =>
          code ? (libelleSecteur[code] ?? code) : null;

        // Un refus d'accès ne doit pas se lire « 0 résultat » : c'est un autre fait.
        if (!resProjets.ok && !resClients.ok && !resEvals.ok) {
          throw new Error(
            resProjets.status === 401 || resProjets.status === 403
              ? "Vos droits ne permettent pas la recherche transversale."
              : "Chargement des données impossible."
          );
        }

        const items: Resultat[] = [];

        if (resProjets.ok) {
          const projets = (await resProjets.json()).data ?? [];
          for (const p of projets) {
            items.push({
              id: p.id,
              type: "projet",
              titre: p.nom,
              contexte: `${p.client?.nom ?? ""} ${p.sponsorPrincipal ?? ""} ${p.secteur ?? ""} ${secteurLisible(p.secteur) ?? ""} ${p.pays ?? ""}`,
              sousTitre: [p.client?.nom, secteurLisible(p.secteur)]
                .filter(Boolean)
                .join(" · "),
              score: p.scoreGlobal,
              note: p.grade,
              statut: p.status,
              montant: p.montant,
              date: p.dateMiseAJour ?? p.dateCreation,
              lien: `/projects/${p.id}`,
            });
          }
        }

        if (resClients.ok) {
          const clients = (await resClients.json()).data ?? [];
          for (const c of clients) {
            items.push({
              id: c.id,
              type: "client",
              titre: c.nom,
              contexte: `${c.raisonSociale ?? ""} ${c.secteur ?? ""} ${c.ville ?? ""} ${c.gestionnaire ?? ""}`,
              sousTitre: [c.secteur, c.ville, c.gestionnaire].filter(Boolean).join(" · "),
              note: c.ratingInterne,
              montant: c.exposition,
              date: c.createdAt,
              lien: `/clients/${c.id}`,
            });
          }
        }

        if (resEvals.ok) {
          const evaluations = (await resEvals.json()).data ?? [];
          for (const e of evaluations) {
            items.push({
              id: e.id,
              type: "evaluation",
              titre: e.project?.nom ?? "Évaluation",
              contexte: `${e.project?.client?.nom ?? ""} ${e.analyst ? `${e.analyst.prenom ?? ""} ${e.analyst.nom ?? ""}` : ""}`,
              sousTitre: [
                e.project?.client?.nom,
                e.analyst ? `${e.analyst.prenom ?? ""} ${e.analyst.nom ?? ""}`.trim() : null,
              ]
                .filter(Boolean)
                .join(" · "),
              score: e.finalScore,
              note: e.rating,
              statut: e.status,
              montant: e.project?.montant,
              date: e.updatedAt ?? e.createdAt,
              lien: `/evaluations/${e.id}`,
            });
          }
        }

        setResultats(items);
        setErreur(null);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  /** La recherche est partageable : elle vit dans l'adresse. */
  const synchroniserUrl = useCallback(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (type !== "tous") p.set("type", type);
    if (note) p.set("note", note);
    if (scoreMin > 0) p.set("scoreMin", String(scoreMin));
    const chaine = p.toString();
    router.replace(chaine ? `/search?${chaine}` : "/search", { scroll: false });
  }, [q, type, note, scoreMin, router]);

  useEffect(() => {
    const t = setTimeout(synchroniserUrl, 400);
    return () => clearTimeout(t);
  }, [synchroniserUrl]);

  const filtres = useMemo(() => {
    const requete = normaliser(q.trim());
    return resultats.filter((r) => {
      const texte = normaliser(`${r.titre} ${r.contexte}`);
      return (
        (!requete || texte.includes(requete)) &&
        (type === "tous" || r.type === type) &&
        // Correspondance exacte : « B » ne doit pas remonter BB, BBB et B.
        (!note || r.note === note) &&
        (scoreMin === 0 || (r.score != null && r.score >= scoreMin))
      );
    });
  }, [resultats, q, type, note, scoreMin]);

  const compteurs = useMemo(() => {
    const c: Record<string, number> = { tous: resultats.length };
    for (const r of resultats) c[r.type] = (c[r.type] ?? 0) + 1;
    return c;
  }, [resultats]);

  const nbFiltres = (note ? 1 : 0) + (scoreMin > 0 ? 1 : 0);

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
        titre="Recherche"
        description="Projets, clients et évaluations, en un seul endroit."
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom de dossier, client, sponsor, secteur, ville, analyste…"
            aria-label="Rechercher"
            autoFocus
            className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-md border border-border bg-card">
          {TYPES.map((t) => (
            <button
              key={t.cle}
              onClick={() => setType(t.cle)}
              aria-pressed={type === t.cle}
              className={`inline-flex h-9 items-center gap-1.5 border-r border-border px-3 text-sm font-medium transition-colors last:border-r-0 ${
                type === t.cle
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.libelle}
              <span className="tabulaire text-[11.5px]">{compteurs[t.cle] ?? 0}</span>
            </button>
          ))}
        </div>

        {/* L'échelle complète : le filtre s'arrêtait à BB. */}
        <select
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="Filtrer par notation"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">Toutes les notations</option>
          {Object.keys(GRADE_THRESHOLDS).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
          Score minimum
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
            aria-label="Score minimum sur 100"
            className="w-28 accent-primary"
          />
          <span className="tabulaire w-10 text-right text-foreground">{scoreMin}</span>
        </label>

        {(nbFiltres > 0 || q) && (
          <button
            onClick={() => {
              setNote("");
              setScoreMin(0);
              setQ("");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      <p className="mb-2 text-[12.5px] text-muted-foreground">
        {filtres.length} résultat{filtres.length > 1 ? "s" : ""}
      </p>

      {filtres.length === 0 ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<Search size={28} />}
            titre="Aucun résultat"
            description="Essayez un autre mot, ou élargissez les filtres."
          />
        </SectionCard>
      ) : (
        <ul className="space-y-2">
          {filtres.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <Link
                href={r.lien}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-surface"
              >
                <span className="flex min-w-0 items-start gap-3">
                  <Icone type={r.type} />
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{r.titre}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {r.sousTitre || TYPES.find((t) => t.cle === r.type)?.libelle}
                    </span>
                  </span>
                </span>

                <span className="flex flex-wrap items-center gap-3">
                  {r.montant != null && (
                    <span className="tabulaire text-[12.5px] text-muted-foreground">
                      {formatMADCompact(r.montant)}
                    </span>
                  )}
                  {/* Le score est sur 100 : il s'affichait « 74.40/10 ». */}
                  {r.score != null && (
                    <span className={`tabulaire text-[12.5px] font-semibold ${scoreTextClass(r.score)}`}>
                      {r.score.toFixed(1).replace(".", ",")}/100
                    </span>
                  )}
                  {r.note && <Note note={r.note} />}
                  {r.statut &&
                    (r.type === "evaluation" ? (
                      <StatutEvaluation statut={r.statut} />
                    ) : (
                      <StatutProjet statut={r.statut} />
                    ))}
                  {r.date && (
                    <span className="w-20 text-right text-[12px] text-muted-foreground">
                      {formatDate(r.date)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Icone({ type }: { type: TypeResultat }) {
  const commun = "mt-0.5 shrink-0 text-muted-foreground";
  if (type === "projet") return <Briefcase size={16} className={commun} />;
  if (type === "client") return <Users size={16} className={commun} />;
  return <ClipboardList size={16} className={commun} />;
}

export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[55vh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={30} />
        </div>
      }
    >
      <Recherche />
    </Suspense>
  );
}
