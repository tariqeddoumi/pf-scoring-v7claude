"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Ban, Loader2, Pencil } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatMAD, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Note, StatutEvaluation, StatutProjet } from "@/components/ui/status-badge";
import { usePermission } from "@/lib/hooks/usePermission";

interface Projet {
  id: string;
  nom: string;
  description?: string;
  secteur?: string;
  pays?: string;
  countryCode?: string;
  montant?: number;
  devise?: string;
  status: string;
  dateCreation?: string;
  dateMiseAJour?: string;
  coutTotal?: number;
  financement?: number;
  apportPropre?: number;
  taux?: number;
  dureeCredit?: number;
  typeCredit?: string;
  tauxCouverture?: number;
  sponsorPrincipal?: string;
  nomSPV?: string;
  constructeurEPC?: string;
  operateurOM?: string;
  technologie?: string;
  capaciteInstallee?: number;
  dureeProjet?: number;
  periodeAmorce?: number;
  periodeRemboursement?: number;
  debutConstruction?: string;
  finConstruction?: string;
  structureCapitalePrincipale?: string;
  scoreGlobal?: number | null;
  grade?: string | null;
  client?: { id: string; nom: string; email?: string; telephone?: string } | null;
  user?: { nom: string; prenom: string } | null;
}

interface Evaluation {
  id: string;
  status: string;
  finalScore: number | null;
  rating: string | null;
  recommendation?: string | null;
  updatedAt?: string;
}

/**
 * Fiche projet.
 *
 * Elle était découpée en sept onglets dont seul « Identification » s'affichait par
 * défaut : voir le montant, le calendrier ou la note demandait trois à six clics, et
 * la note se trouvait dans le dernier onglet. Le client n'apparaissait nulle part,
 * alors que l'API le renvoie.
 *
 * Tout est désormais sur une seule page, dans l'ordre où un chargé d'affaires en a
 * besoin : identité et note d'abord, structure de financement ensuite, calendrier et
 * intervenants pour finir.
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { can } = usePermission();
  const id = String(params?.id ?? "");

  const [projet, setProjet] = useState<Projet | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [libelleSecteur, setLibelleSecteur] = useState<Record<string, string>>({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const [rProjet, rEvals, rSecteurs] = await Promise.all([
        apiGet(`/api/projects/${id}`),
        apiGet(`/api/evaluations?projectId=${id}`),
        apiGet("/api/reference/sectors"),
      ]);
      if (!rProjet.ok) throw new Error("Projet introuvable.");
      // GET /api/projects/[id] répond à plat, quand GET /api/projects enveloppe sa
      // liste dans { data }. Les deux formes sont acceptées ici : l'écran ne doit pas
      // dépendre d'une convention que les routes n'appliquent pas uniformément.
      const corpsProjet = await rProjet.json();
      setProjet(corpsProjet?.data ?? corpsProjet ?? null);
      if (rEvals.ok) {
        const liste = (await rEvals.json()).data ?? [];
        setEvaluations(
          Array.isArray(liste)
            ? liste.filter((e: { projectId?: string }) => !e.projectId || e.projectId === id)
            : []
        );
      }
      if (rSecteurs.ok) {
        const s: { code: string; label: string }[] = (await rSecteurs.json()).data ?? [];
        setLibelleSecteur(Object.fromEntries(s.map((x) => [x.code, x.label])));
      }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) charger();
  }, [id, charger]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (erreur || !projet) {
    return (
      <div className="mx-auto mt-16 max-w-lg">
        <SectionCard>
          <p className="font-medium text-foreground">Projet introuvable</p>
          <p className="mt-1 text-sm text-muted-foreground">{erreur}</p>
          <Link href="/projects" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Retour aux projets
          </Link>
        </SectionCard>
      </div>
    );
  }

  const derniere = evaluations[0];
  const secteur = projet.secteur
    ? (libelleSecteur[projet.secteur] ?? projet.secteur)
    : null;

  // Part de fonds propres : ce que le comité regarde en premier sur la structure.
  const partFondsPropres =
    projet.coutTotal && projet.apportPropre
      ? (projet.apportPropre / projet.coutTotal) * 100
      : null;

  return (
    <div>
      <PageHeader
        retour={{ href: "/projects", libelle: "Projets" }}
        titre={projet.nom}
        description={projet.description}
        meta={
          <>
            <StatutProjet statut={projet.status} />
            {secteur && (
              <span className="text-[12.5px] text-muted-foreground">{secteur}</span>
            )}
            {projet.client && (
              <Link
                href={`/clients/${projet.client.id}`}
                className="text-[12.5px] font-medium text-primary hover:underline"
              >
                {projet.client.nom}
              </Link>
            )}
            {projet.user && (
              <span className="text-[12.5px] text-muted-foreground">
                Chargé : {projet.user.prenom} {projet.user.nom}
              </span>
            )}
            {projet.dateMiseAJour && (
              <span className="text-[12.5px] text-muted-foreground">
                Modifié le {formatDate(projet.dateMiseAJour)}
              </span>
            )}
          </>
        }
        actions={
          can("project", "update") && (
            <button
              onClick={() => router.push(`/projects/${projet.id}/edit`)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Pencil size={15} />
              Modifier
            </button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          libelle="Montant sollicité"
          valeur={projet.montant ? formatMAD(projet.montant).replace(/\s?MAD$/, "") : "—"}
          unite={projet.devise || "MAD"}
        />
        <KpiCard
          libelle="Coût total du projet"
          valeur={projet.coutTotal ? formatMAD(projet.coutTotal).replace(/\s?MAD$/, "") : "—"}
          unite={projet.coutTotal ? "MAD" : undefined}
          precision={
            partFondsPropres !== null
              ? `${partFondsPropres.toFixed(0)} % de fonds propres`
              : "Coût total non renseigné"
          }
          ton={
            partFondsPropres !== null && partFondsPropres < 20 ? "alerte" : "neutre"
          }
        />
        <KpiCard
          libelle="Note"
          valeur={projet.grade ?? "—"}
          precision={
            projet.scoreGlobal !== null && projet.scoreGlobal !== undefined
              ? `Score ${projet.scoreGlobal.toFixed(1).replace(".", ",")} / 100`
              : "Aucune évaluation calculée"
          }
        />
        <KpiCard
          libelle="Durée du crédit"
          valeur={projet.dureeCredit ?? "—"}
          unite={projet.dureeCredit ? "ans" : undefined}
          precision={
            projet.taux
              ? `Taux ${String(projet.taux).replace(".", ",")} %`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <SectionCard titre="Structure de financement">
            <Grille>
              <Champ libelle="Coût total" valeur={projet.coutTotal} monnaie />
              <Champ libelle="Financement par dette" valeur={projet.financement} monnaie />
              <Champ libelle="Apport propre" valeur={projet.apportPropre} monnaie />
              <Champ libelle="Montant sollicité" valeur={projet.montant} monnaie />
              <Champ libelle="Type de crédit" valeur={projet.typeCredit} />
              <Champ
                libelle="Taux"
                valeur={projet.taux !== undefined ? `${String(projet.taux).replace(".", ",")} %` : undefined}
              />
              {/* Le DSCR est un multiple de l'échéance, pas un pourcentage. */}
              <Champ
                libelle="DSCR"
                valeur={
                  projet.tauxCouverture !== undefined && projet.tauxCouverture !== null
                    ? `${projet.tauxCouverture.toFixed(2).replace(".", ",")}x`
                    : undefined
                }
              />
              <Champ libelle="Structure du capital" valeur={projet.structureCapitalePrincipale} large />
            </Grille>
          </SectionCard>

          <SectionCard titre="Calendrier">
            <Grille>
              <Champ libelle="Durée du projet" valeur={annees(projet.dureeProjet)} />
              <Champ libelle="Durée du crédit" valeur={annees(projet.dureeCredit)} />
              {/* L'écran libellait ces deux champs « en mois » alors que le formulaire
                  les saisit en années : un différé de 3 ans se lisait 3 mois. */}
              <Champ libelle="Période d'amorce" valeur={annees(projet.periodeAmorce)} />
              <Champ libelle="Période de remboursement" valeur={annees(projet.periodeRemboursement)} />
              <Champ libelle="Début de construction" valeur={date(projet.debutConstruction)} />
              <Champ libelle="Fin de construction" valeur={date(projet.finConstruction)} />
            </Grille>
          </SectionCard>

          <SectionCard titre="Projet et intervenants">
            <Grille>
              <Champ libelle="Secteur" valeur={secteur} />
              <Champ libelle="Pays" valeur={projet.pays} />
              <Champ libelle="Technologie" valeur={projet.technologie} />
              <Champ libelle="Capacité installée" valeur={projet.capaciteInstallee} />
              <Champ libelle="Sponsor principal" valeur={projet.sponsorPrincipal} />
              <Champ libelle="Société de projet (SPV)" valeur={projet.nomSPV} />
              <Champ libelle="Constructeur EPC" valeur={projet.constructeurEPC} />
              <Champ libelle="Opérateur O&M" valeur={projet.operateurOM} />
            </Grille>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            titre="Évaluations"
            actions={
              <Link
                href={`/evaluations/new?projectId=${projet.id}`}
                className="text-[12.5px] font-semibold text-primary hover:underline"
              >
                Nouvelle →
              </Link>
            }
            sansPadding
          >
            {evaluations.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune évaluation pour ce projet.
              </p>
            ) : (
              evaluations.map((e) => (
                <Link
                  key={e.id}
                  href={
                    e.status === "brouillon"
                      ? `/evaluations/${e.id}/saisie`
                      : `/evaluations/${e.id}`
                  }
                  className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 block">
                      <StatutEvaluation statut={e.status} />
                    </span>
                    {e.recommendation && (
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {e.recommendation}
                      </span>
                    )}
                    {e.updatedAt && (
                      <span className="block text-[11.5px] text-muted-foreground">
                        {formatDate(e.updatedAt)}
                      </span>
                    )}
                  </span>
                  <Note note={e.rating} score={e.finalScore} />
                  <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </SectionCard>

          {derniere?.status === "rejete" && (
            <SectionCard className="border-destructive/40">
              <p className="flex items-start gap-2 text-sm text-destructive">
                <Ban size={16} className="mt-0.5 shrink-0" />
                <span>
                  La dernière évaluation a été rejetée. Ouvrez-la pour consulter le
                  motif et les règles déclenchées.
                </span>
              </p>
            </SectionCard>
          )}

          {projet.client && (
            <SectionCard titre="Client">
              <Link
                href={`/clients/${projet.client.id}`}
                className="text-[14px] font-medium text-primary hover:underline"
              >
                {projet.client.nom}
              </Link>
              {projet.client.email && (
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  {projet.client.email}
                </p>
              )}
              {projet.client.telephone && (
                <p className="text-[12.5px] text-muted-foreground">
                  {projet.client.telephone}
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

const annees = (n?: number) => (n === undefined || n === null ? undefined : `${n} ans`);
const date = (d?: string) => (d ? formatDate(d) : undefined);

function Grille({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">{children}</dl>;
}

function Champ({
  libelle,
  valeur,
  monnaie,
  large,
}: {
  libelle: string;
  valeur?: string | number | null;
  monnaie?: boolean;
  large?: boolean;
}) {
  const vide = valeur === undefined || valeur === null || valeur === "";
  return (
    <div className={large ? "sm:col-span-2" : undefined}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </dt>
      <dd
        className={`mt-0.5 text-[13.5px] ${
          vide ? "italic text-muted-foreground" : "text-foreground"
        } ${monnaie ? "tabulaire" : ""}`}
      >
        {vide
          ? "Non renseigné"
          : monnaie && typeof valeur === "number"
            ? formatMAD(valeur)
            : valeur}
      </dd>
    </div>
  );
}
