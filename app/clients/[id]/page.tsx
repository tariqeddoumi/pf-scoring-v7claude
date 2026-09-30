"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { formatMAD, formatMADCompact, formatDate } from "@/lib/utils";
import { KYC_A_TRAITER, CONFORMITE_A_TRAITER } from "@/lib/referentiels";
import { ratingBadgeClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Note, StatutProjet } from "@/components/ui/status-badge";
import { usePermission } from "@/lib/hooks/usePermission";

interface ProjetLie {
  id: string;
  nom: string;
  status: string;
  montant?: number | null;
  grade?: string | null;
  scoreGlobal?: number | null;
}

interface Client {
  id: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  secteur?: string | null;
  pays?: string | null;
  type?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  raisonSociale?: string | null;
  nomCommercial?: string | null;
  typeClient?: string | null;
  formeJuridique?: string | null;
  segmentClientele?: string | null;
  effectifs?: number | null;
  capitalSocial?: number | null;
  chiffreAffaires?: number | null;
  ville?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  website?: string | null;
  centreAffaires?: string | null;
  gestionnaire?: string | null;
  ratingInterne?: string | null;
  statutBancaire?: string | null;
  dateRelation?: string | null;
  exposition?: number | null;
  statusKYC?: string | null;
  statusConformite?: string | null;
  projects?: ProjetLie[];
}

/**
 * Fiche client.
 *
 * Tout ce qui décide — notation interne, exposition, KYC, conformité — était enfoui
 * dans les cinquième et sixième onglets, quand l'onglet d'accueil répétait le nom du
 * client sous trois libellés. Les projets du client, pourtant renvoyés par l'API,
 * n'étaient pas affichés du tout. Une exposition nulle s'affichait « Non renseigné ».
 */
export default function FicheClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { can } = usePermission();
  const [client, setClient] = useState<Client | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const res = await apiGet(`/api/clients/${id}`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Cette fiche client est introuvable."));
      setClient((await res.json()).data);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
      setClient(null);
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (erreur || !client) {
    return (
      <div>
        <PageHeader titre="Client" retour={{ href: "/clients", libelle: "Clients" }} />
        <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      </div>
    );
  }

  const kycATraiter = KYC_A_TRAITER.includes(client.statusKYC ?? "");
  const conformiteATraiter = CONFORMITE_A_TRAITER.includes(client.statusConformite ?? "");
  const projets = client.projects ?? [];
  // Le total n'a de sens que si au moins un projet porte un montant.
  const avecMontant = projets.filter((p) => p.montant != null);
  const encours = avecMontant.reduce((s, p) => s + (p.montant ?? 0), 0);

  return (
    <div>
      <PageHeader
        titre={client.raisonSociale || client.nom}
        description={[
          client.typeClient,
          client.formeJuridique,
          client.secteur,
          client.ville,
        ]
          .filter(Boolean)
          .join(" · ")}
        retour={{ href: "/clients", libelle: "Clients" }}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {client.ratingInterne && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[12.5px] font-bold ${ratingBadgeClass(client.ratingInterne)}`}
              >
                {client.ratingInterne}
              </span>
            )}
            {client.statutBancaire && <Puce libelle={client.statutBancaire} />}
            {client.statusKYC && (
              <Puce libelle={`KYC : ${client.statusKYC}`} alerte={kycATraiter} />
            )}
            {client.statusConformite && (
              <Puce
                libelle={`Conformité : ${client.statusConformite}`}
                alerte={conformiteATraiter}
              />
            )}
            {client.status !== "Actif" && <Puce libelle={client.status} alerte />}
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {can("project", "create") && (
              <Link
                href={`/projects/new?clientId=${client.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Plus size={15} />
                Nouveau projet
              </Link>
            )}
            {/* Le bouton s'affichait pour tout le monde, y compris en lecture seule. */}
            {can("client", "update") && (
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Pencil size={15} />
                Modifier
              </Link>
            )}
          </div>
        }
      />

      {(kycATraiter || conformiteATraiter) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {kycATraiter && `KYC ${client.statusKYC?.toLowerCase()}`}
            {kycATraiter && conformiteATraiter && " · "}
            {conformiteATraiter && `conformité ${client.statusConformite?.toLowerCase()}`}
            {" — à régulariser avant tout nouvel engagement."}
          </span>
          {can("client", "update") && (
            <Link
              href={`/clients/${client.id}/edit`}
              className="ml-auto shrink-0 font-semibold underline"
            >
              Mettre à jour
            </Link>
          )}
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Chiffre libelle="Exposition" valeur={client.exposition} />
        <Chiffre libelle="Capital social" valeur={client.capitalSocial} />
        <Chiffre libelle="Chiffre d'affaires" valeur={client.chiffreAffaires} />
        <Chiffre libelle="Effectifs" valeur={client.effectifs} brut />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            titre={`Projets (${projets.length})`}
            description={
              avecMontant.length > 0 ? `${formatMADCompact(encours)} demandés` : undefined
            }
            sansPadding
          >
            {projets.length === 0 ? (
              <EmptyState
                icone={<Briefcase size={26} />}
                titre="Aucun projet"
                description="Ce client ne porte encore aucun dossier de financement."
                action={
                  can("project", "create")
                    ? {
                        href: `/projects/new?clientId=${client.id}`,
                        libelle: "Nouveau projet",
                      }
                    : undefined
                }
              />
            ) : (
              <ul>
                {projets.map((p) => (
                  <li key={p.id} className="border-b border-border last:border-b-0">
                    <Link
                      href={`/projects/${p.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{p.nom}</span>
                        <StatutProjet statut={p.status} />
                      </span>
                      <span className="flex items-center gap-4">
                        {p.montant != null && (
                          <span
                            className="tabulaire text-[12.5px] text-muted-foreground"
                            title={formatMAD(p.montant)}
                          >
                            {formatMADCompact(p.montant)}
                          </span>
                        )}
                        <Note note={p.grade} score={p.scoreGlobal} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard titre="Profil">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Ligne libelle="Nom usuel" valeur={client.nom} />
              <Ligne libelle="Raison sociale" valeur={client.raisonSociale} />
              <Ligne libelle="Nom commercial" valeur={client.nomCommercial} />
              <Ligne libelle="Type" valeur={client.typeClient ?? client.type} />
              <Ligne libelle="Forme juridique" valeur={client.formeJuridique} />
              <Ligne libelle="Segment" valeur={client.segmentClientele} />
              <Ligne libelle="Secteur" valeur={client.secteur} />
              <Ligne libelle="Pays" valeur={client.pays} />
            </dl>
            {client.description && (
              <p className="mt-4 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
                {client.description}
              </p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard titre="Relation bancaire">
            <dl className="space-y-3">
              <Ligne libelle="Gestionnaire" valeur={client.gestionnaire} />
              <Ligne libelle="Centre d'affaires" valeur={client.centreAffaires} />
              <Ligne libelle="Statut" valeur={client.statutBancaire} />
              <Ligne libelle="Notation interne" valeur={client.ratingInterne} />
              <Ligne
                libelle="Entrée en relation"
                valeur={client.dateRelation ? formatDate(client.dateRelation) : null}
              />
              <Ligne libelle="KYC" valeur={client.statusKYC} alerte={kycATraiter} />
              <Ligne
                libelle="Conformité"
                valeur={client.statusConformite}
                alerte={conformiteATraiter}
              />
            </dl>
          </SectionCard>

          <SectionCard titre="Coordonnées">
            <ul className="space-y-2.5 text-[13px]">
              {client.email && (
                <li className="flex items-center gap-2">
                  <Mail size={15} className="shrink-0 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                    {client.email}
                  </a>
                </li>
              )}
              {client.telephone && (
                <li className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0 text-muted-foreground" />
                  <a
                    href={`tel:${client.telephone.replace(/\s/g, "")}`}
                    className="text-primary hover:underline"
                  >
                    {client.telephone}
                  </a>
                </li>
              )}
              {client.website && (
                <li className="flex items-center gap-2">
                  <Globe size={15} className="shrink-0 text-muted-foreground" />
                  <a
                    href={
                      client.website.startsWith("http")
                        ? client.website
                        : `https://${client.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {client.website}
                  </a>
                </li>
              )}
              {(client.adresse || client.ville) && (
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">
                    {[client.adresse, client.codePostal, client.ville, client.pays]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </li>
              )}
              {!client.email &&
                !client.telephone &&
                !client.website &&
                !client.adresse &&
                !client.ville && (
                  <li className="text-muted-foreground">Aucune coordonnée renseignée.</li>
                )}
            </ul>
          </SectionCard>
        </div>
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        Fiche créée le {formatDate(client.createdAt)}
        {client.updatedAt && ` · modifiée le ${formatDate(client.updatedAt)}`}
      </p>
    </div>
  );
}

function Puce({ libelle, alerte }: { libelle: string; alerte?: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
        alerte ? "bg-warning-subtle text-warning" : "bg-muted text-muted-foreground"
      }`}
    >
      {libelle}
    </span>
  );
}

/**
 * Chiffre clé. Une exposition de zéro est une information — elle s'affichait
 * « Non renseigné », le test portant sur la valeur et non sur sa présence.
 */
function Chiffre({
  libelle,
  valeur,
  brut,
}: {
  libelle: string;
  valeur: number | null | undefined;
  brut?: boolean;
}) {
  const connu = valeur !== null && valeur !== undefined;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p
        className="mt-1 text-[17px] font-semibold text-foreground tabulaire"
        title={connu && !brut ? formatMAD(valeur) : undefined}
      >
        {connu
          ? brut
            ? valeur.toLocaleString("fr-FR")
            : formatMADCompact(valeur)
          : "—"}
      </p>
    </div>
  );
}

function Ligne({
  libelle,
  valeur,
  alerte,
}: {
  libelle: string;
  valeur?: string | null;
  alerte?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-muted-foreground">{libelle}</dt>
      <dd
        className={`text-[13px] ${
          alerte ? "font-semibold text-warning" : "text-foreground"
        }`}
      >
        {valeur || "—"}
      </dd>
    </div>
  );
}
