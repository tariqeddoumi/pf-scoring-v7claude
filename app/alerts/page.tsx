"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, BellOff, Info, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LIBELLES_SEVERITE,
  LIBELLES_TYPE,
  type Alerte,
  type SeveriteAlerte,
} from "@/lib/services/alert-derivation";

const TEINTE: Record<SeveriteAlerte, string> = {
  critique: "text-destructive",
  vigilance: "text-warning",
  information: "text-muted-foreground",
};

function IconeSeverite({ severite }: { severite: SeveriteAlerte }) {
  const commun = `shrink-0 ${TEINTE[severite]}`;
  if (severite === "information") return <Info size={16} className={commun} />;
  return <AlertCircle size={16} className={commun} />;
}

const ORDRE: Record<SeveriteAlerte, number> = {
  critique: 0,
  vigilance: 1,
  information: 2,
};

/**
 * Alertes du portefeuille.
 *
 * Les alertes sont dérivées des évaluations réellement calculées — elles ne se
 * suppriment ni ne se marquent comme lues : une alerte n'est pas un message, c'est
 * l'état d'un dossier. Elle disparaît quand la condition qui l'a produite cesse.
 *
 * L'écran les affichait en revanche à plat, une carte par condition : un même dossier
 * revenait deux ou trois fois, et les dossiers clos — rejetés ou validés, sur lesquels
 * il n'y a plus rien à faire — occupaient toute la liste. Quatre tuiles de la taille
 * de cartes d'indicateurs servaient de filtres, dont une « Information 0 » cliquable
 * menant à une liste vide.
 */
export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [severite, setSeverite] = useState<SeveriteAlerte | "toutes">("toutes");
  const [inclureClos, setInclureClos] = useState(false);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/alerts");
      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(corps.error ?? "Chargement des alertes impossible.");
      }
      setAlertes((await res.json()).data ?? []);
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

  const ouvertes = useMemo(() => alertes.filter((a) => !a.clos), [alertes]);
  const retenues = useMemo(
    () => (inclureClos ? alertes : ouvertes),
    [alertes, ouvertes, inclureClos]
  );

  const compteurs = useMemo(() => {
    const c = { toutes: retenues.length, critique: 0, vigilance: 0, information: 0 };
    for (const a of retenues) c[a.severite] += 1;
    return c;
  }, [retenues]);

  /** Une ligne par dossier : c'est le dossier qu'on ouvre, pas la condition. */
  const parDossier = useMemo(() => {
    const groupes = new Map<string, Alerte[]>();
    for (const a of retenues) {
      if (severite !== "toutes" && a.severite !== severite) continue;
      const cle = a.evaluationId;
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle)!.push(a);
    }
    return [...groupes.values()]
      .map((liste) => ({
        liste,
        pire: liste.reduce(
          (p, a) => (ORDRE[a.severite] < ORDRE[p] ? a.severite : p),
          "information" as SeveriteAlerte
        ),
      }))
      .sort(
        (a, b) =>
          ORDRE[a.pire] - ORDRE[b.pire] ||
          new Date(b.liste[0].date).getTime() - new Date(a.liste[0].date).getTime()
      );
  }, [retenues, severite]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  const nbClos = alertes.length - ouvertes.length;

  return (
    <div>
      <PageHeader
        titre="Alertes"
        description={
          ouvertes.length === 0
            ? "Aucun dossier en instance ne déclenche d'alerte."
            : `${ouvertes.length} alerte${ouvertes.length > 1 ? "s" : ""} sur des dossiers en instance`
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-md border border-border bg-card">
          {(["toutes", "critique", "vigilance", "information"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverite(s)}
              aria-pressed={severite === s}
              className={`inline-flex h-9 items-center gap-1.5 border-r border-border px-3 text-sm font-medium transition-colors last:border-r-0 ${
                severite === s
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "toutes" ? "Toutes" : LIBELLES_SEVERITE[s]}
              <span className="tabulaire text-[11.5px]">{compteurs[s]}</span>
            </button>
          ))}
        </div>

        {/* Les alertes d'un dossier clos documentent la décision ; elles n'appellent
            plus d'action et sont donc masquées par défaut. */}
        {nbClos > 0 && (
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={inclureClos}
              onChange={(e) => setInclureClos(e.target.checked)}
              className="accent-primary"
            />
            Inclure les dossiers clos ({nbClos})
          </label>
        )}
      </div>

      {parDossier.length === 0 ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<BellOff size={28} />}
            titre={
              alertes.length === 0
                ? "Aucune alerte"
                : severite !== "toutes"
                  ? "Aucune alerte de cette gravité"
                  : "Rien à traiter"
            }
            description={
              alertes.length === 0
                ? "Aucune évaluation calculée ne déclenche de condition d'alerte."
                : nbClos > 0 && !inclureClos
                  ? "Les seules alertes portent sur des dossiers clos."
                  : "Changez de gravité pour voir les autres alertes."
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {parDossier.map(({ liste, pire }) => {
            const premiere = liste[0];
            return (
              <Link
                key={premiere.evaluationId}
                href={premiere.lienAction}
                className="block rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-surface"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <IconeSeverite severite={pire} />
                    <span className="font-medium text-foreground">
                      {premiere.projectName}
                    </span>
                    {premiere.clos && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Dossier clos
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {formatDate(premiere.date)}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1 pl-6">
                  {liste.map((a) => (
                    <li key={a.id} className="text-[12.5px]">
                      <span className={`font-medium ${TEINTE[a.severite]}`}>
                        {LIBELLES_TYPE[a.type]}
                      </span>
                      <span className="text-muted-foreground"> — {a.message}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-2 inline-block pl-6 text-[12.5px] font-semibold text-primary">
                  Ouvrir l&apos;évaluation →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
