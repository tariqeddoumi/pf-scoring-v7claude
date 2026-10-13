"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import {
  formatMAD,
  formatMADCompact,
  formatDate,
  formatDateTime,
} from "@/lib/utils";
import {
  CLASSIFICATION_A_TRAITER,
  CONFORMITE_A_TRAITER,
  KYC_A_TRAITER,
} from "@/lib/referentiels";
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
  codeClientT24?: string | null;
  ice?: string | null;
  registreCommerce?: string | null;
  identifiantFiscal?: string | null;
  dateCreationSociete?: string | null;
  roleGroupe?: string | null;
  fondsPropres?: number | null;
  exerciceReference?: number | null;
  experienceSecteurAnnees?: number | null;
  projetsSimilaires?: number | null;
  notationExterne?: string | null;
  agenceNotation?: string | null;
  classificationBAM?: string | null;
  niveauRisqueLBC?: string | null;
  ppe?: boolean | null;
  dateRevueKYC?: string | null;
  sourceDonnees?: string | null;
  dateSynchroT24?: string | null;
  entite?: { id: string; code: string; nom: string } | null;
  groupeAffaires?: GroupeDuClient | null;
  actionnaires?: Actionnaire[];
  projects?: ProjetLie[];
}

interface Actionnaire {
  id: string;
  typePersonne: string;
  nom: string;
  qualite: string;
  pays?: string | null;
  identifiant?: string | null;
  pourcentageDetention?: number | null;
  beneficiaireEffectif: boolean;
  ppe: boolean;
}

interface MembreGroupe {
  id: string;
  nom: string;
  raisonSociale?: string | null;
  codeClientT24?: string | null;
  roleGroupe?: string | null;
  ratingInterne?: string | null;
  exposition?: number | null;
}

interface GroupeDuClient {
  id: string;
  code?: string | null;
  nom: string;
  paysSiege?: string | null;
  secteurPrincipal?: string | null;
  ratingGroupe?: string | null;
  membres: MembreGroupe[];
  expositionConsolidee: number | null;
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
      if (!res.ok)
        throw new Error(
          await messageErreurApi(res, "Cette fiche client est introuvable.")
        );
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
        <PageHeader
          titre="Client"
          retour={{ href: "/clients", libelle: "Clients" }}
        />
        <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      </div>
    );
  }

  const kycATraiter = KYC_A_TRAITER.includes(client.statusKYC ?? "");
  const conformiteATraiter = CONFORMITE_A_TRAITER.includes(
    client.statusConformite ?? ""
  );
  const classementATraiter = CLASSIFICATION_A_TRAITER.includes(
    client.classificationBAM ?? ""
  );
  const lbcEleve = client.niveauRisqueLBC === "Élevé";
  const projets = client.projects ?? [];
  // Le total n'a de sens que si au moins un projet porte un montant.
  const avecMontant = projets.filter((p) => p.montant != null);
  const encours = avecMontant.reduce((s, p) => s + (p.montant ?? 0), 0);
  const groupe = client.groupeAffaires;
  const actionnaires = client.actionnaires ?? [];
  const beneficiaires = actionnaires.filter((a) => a.beneficiaireEffectif);
  // Un actionnaire ou dirigeant PPE place la contrepartie en vigilance renforcée.
  const ppeLie = !client.ppe && actionnaires.some((a) => a.ppe);
  const depuisT24 = client.sourceDonnees === "T24";

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
            {client.codeClientT24 && (
              <Puce libelle={`T24 ${client.codeClientT24}`} />
            )}
            {client.ratingInterne && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[12.5px] font-bold ${ratingBadgeClass(client.ratingInterne)}`}
              >
                {client.ratingInterne}
              </span>
            )}
            {client.classificationBAM && (
              <Puce
                libelle={`BAM : ${client.classificationBAM}`}
                alerte={classementATraiter}
              />
            )}
            {client.statutBancaire && <Puce libelle={client.statutBancaire} />}
            {client.statusKYC && (
              <Puce
                libelle={`KYC : ${client.statusKYC}`}
                alerte={kycATraiter}
              />
            )}
            {client.statusConformite && (
              <Puce
                libelle={`Conformité : ${client.statusConformite}`}
                alerte={conformiteATraiter}
              />
            )}
            {client.ppe && <Puce libelle="PPE" alerte />}
            {client.status !== "Actif" && (
              <Puce libelle={client.status} alerte />
            )}
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

      {(kycATraiter ||
        conformiteATraiter ||
        classementATraiter ||
        lbcEleve ||
        ppeLie) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {[
              kycATraiter && `KYC ${client.statusKYC?.toLowerCase()}`,
              conformiteATraiter &&
                `conformité ${client.statusConformite?.toLowerCase()}`,
              classementATraiter &&
                `créance classée ${client.classificationBAM?.toLowerCase()}`,
              lbcEleve && "risque LBC/FT élevé (vigilance renforcée)",
              ppeLie && "actionnaire ou dirigeant PPE (vigilance renforcée)",
            ]
              .filter(Boolean)
              .join(" · ")}
            {" — à traiter avant tout nouvel engagement."}
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
        <Chiffre libelle="Engagements actuels" valeur={client.exposition} />
        <Chiffre
          libelle="Engagements du groupe"
          valeur={groupe ? groupe.expositionConsolidee : undefined}
          aide={groupe ? undefined : "Aucun groupe"}
        />
        <Chiffre libelle="Chiffre d'affaires" valeur={client.chiffreAffaires} />
        <Chiffre libelle="Fonds propres" valeur={client.fondsPropres} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            titre={`Projets (${projets.length})`}
            description={
              avecMontant.length > 0
                ? `${formatMADCompact(encours)} demandés`
                : undefined
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
                  <li
                    key={p.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={`/projects/${p.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {p.nom}
                        </span>
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

          <SectionCard titre="Identification">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Ligne libelle="Code client T24" valeur={client.codeClientT24} />
              <Ligne libelle="Nom usuel" valeur={client.nom} />
              <Ligne libelle="Raison sociale" valeur={client.raisonSociale} />
              <Ligne libelle="Forme juridique" valeur={client.formeJuridique} />
              <Ligne libelle="ICE" valeur={client.ice} />
              <Ligne
                libelle="Registre du commerce"
                valeur={client.registreCommerce}
              />
              <Ligne
                libelle="Identifiant fiscal"
                valeur={client.identifiantFiscal}
              />
              <Ligne
                libelle="Date de création"
                valeur={
                  client.dateCreationSociete
                    ? formatDate(client.dateCreationSociete)
                    : null
                }
              />
              <Ligne libelle="Pays de résidence" valeur={client.pays} />
              <Ligne
                libelle="Siège"
                valeur={
                  [client.adresse, client.ville].filter(Boolean).join(", ") ||
                  null
                }
              />
              {client.entite && (
                <Ligne libelle="Banque" valeur={client.entite.nom} />
              )}
            </dl>
          </SectionCard>

          <SectionCard titre="Solidité financière et expérience">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Ligne libelle="Secteur" valeur={client.secteur} />
              <Ligne libelle="Segment" valeur={client.segmentClientele} />
              <Ligne
                libelle="Exercice de référence"
                valeur={client.exerciceReference?.toString()}
              />
              <Ligne
                libelle="Capital social"
                valeur={montant(client.capitalSocial)}
              />
              <Ligne
                libelle="Expérience dans le secteur"
                valeur={
                  client.experienceSecteurAnnees != null
                    ? `${client.experienceSecteurAnnees} ans`
                    : null
                }
              />
              <Ligne
                libelle="Projets comparables réalisés"
                valeur={client.projetsSimilaires?.toString()}
              />
            </dl>
            {client.description && (
              <p className="mt-4 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
                {client.description}
              </p>
            )}
          </SectionCard>

          <SectionCard
            titre="Actionnariat et bénéficiaires effectifs"
            description={
              actionnaires.length === 0
                ? undefined
                : `${beneficiaires.length} bénéficiaire${beneficiaires.length > 1 ? "s" : ""} effectif${beneficiaires.length > 1 ? "s" : ""} déclaré${beneficiaires.length > 1 ? "s" : ""}`
            }
            sansPadding={actionnaires.length > 0}
          >
            {actionnaires.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                Aucun actionnaire ni dirigeant renseigné : à compléter pour le
                KYC.
              </p>
            ) : (
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11.5px] text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Nom</th>
                    <th className="px-4 py-2 font-medium">Qualité</th>
                    <th className="px-4 py-2 font-medium">Pays</th>
                    <th className="px-4 py-2 text-right font-medium">
                      Détention
                    </th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {actionnaires.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-2.5">
                        <span className="block font-medium text-foreground">
                          {a.nom}
                        </span>
                        <span className="text-[11.5px] text-muted-foreground">
                          {[a.typePersonne, a.identifiant]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.qualite}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {a.pays || "—"}
                      </td>
                      <td className="tabulaire px-4 py-2.5 text-right text-foreground">
                        {a.pourcentageDetention != null
                          ? `${a.pourcentageDetention.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex flex-wrap gap-1">
                          {a.beneficiaireEffectif && (
                            <Puce libelle="Bénéficiaire effectif" />
                          )}
                          {a.ppe && <Puce libelle="PPE" alerte />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            titre="Groupe d'affaires"
            sansPadding={Boolean(groupe && groupe.membres.length > 0)}
          >
            {!groupe ? (
              <p className="text-[13px] text-muted-foreground">
                Contrepartie hors groupe.
              </p>
            ) : (
              <div>
                <dl
                  className={`space-y-3 ${groupe.membres.length > 0 ? "px-4 pt-4" : ""}`}
                >
                  <Ligne
                    libelle="Groupe"
                    valeur={
                      groupe.code
                        ? `${groupe.nom} (${groupe.code})`
                        : groupe.nom
                    }
                  />
                  <Ligne
                    libelle="Place dans le groupe"
                    valeur={client.roleGroupe}
                  />
                  {groupe.ratingGroupe && (
                    <Ligne
                      libelle="Notation du groupe"
                      valeur={groupe.ratingGroupe}
                    />
                  )}
                </dl>
                {groupe.membres.length > 0 && (
                  <>
                    <p className="mt-4 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Autres sociétés du groupe
                    </p>
                    <ul className="mt-1">
                      {groupe.membres.map((m) => (
                        <li key={m.id} className="border-t border-border">
                          <Link
                            href={`/clients/${m.id}`}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-surface"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-foreground">
                                {m.nom}
                              </span>
                              {m.roleGroupe && (
                                <span className="text-[11.5px] text-muted-foreground">
                                  {m.roleGroupe}
                                </span>
                              )}
                            </span>
                            <span className="tabulaire shrink-0 text-[12.5px] text-muted-foreground">
                              {m.exposition != null
                                ? formatMADCompact(m.exposition)
                                : "—"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard titre="Notation et risque">
            <dl className="space-y-3">
              <Ligne libelle="Notation interne" valeur={client.ratingInterne} />
              <Ligne
                libelle="Notation externe"
                valeur={
                  client.notationExterne
                    ? `${client.notationExterne}${client.agenceNotation ? ` (${client.agenceNotation})` : ""}`
                    : null
                }
              />
              <Ligne
                libelle="Classification Bank Al-Maghrib"
                valeur={client.classificationBAM}
                alerte={classementATraiter}
              />
            </dl>
          </SectionCard>

          <SectionCard titre="Relation bancaire">
            <dl className="space-y-3">
              <Ligne libelle="Chargé d'affaires" valeur={client.gestionnaire} />
              <Ligne
                libelle="Centre d'affaires"
                valeur={client.centreAffaires}
              />
              <Ligne libelle="Statut" valeur={client.statutBancaire} />
              <Ligne
                libelle="Entrée en relation"
                valeur={
                  client.dateRelation ? formatDate(client.dateRelation) : null
                }
              />
            </dl>
          </SectionCard>

          <SectionCard titre="Conformité LBC/FT">
            <dl className="space-y-3">
              <Ligne
                libelle="KYC"
                valeur={client.statusKYC}
                alerte={kycATraiter}
              />
              <Ligne
                libelle="Dernière revue KYC"
                valeur={
                  client.dateRevueKYC ? formatDate(client.dateRevueKYC) : null
                }
              />
              <Ligne
                libelle="Niveau de risque"
                valeur={client.niveauRisqueLBC}
                alerte={lbcEleve}
              />
              <Ligne
                libelle="Personne politiquement exposée"
                valeur={
                  client.ppe === true
                    ? "Oui"
                    : client.ppe === false
                      ? "Non"
                      : null
                }
                alerte={client.ppe === true}
              />
              <Ligne
                libelle="Filtrage sanctions et conformité"
                valeur={client.statusConformite}
                alerte={conformiteATraiter}
              />
            </dl>
          </SectionCard>

          {(client.email || client.telephone) && (
            <SectionCard titre="Contact">
              <ul className="space-y-2.5 text-[13px]">
                {client.telephone && (
                  <li className="flex items-center gap-2">
                    <Phone
                      size={15}
                      className="shrink-0 text-muted-foreground"
                    />
                    <a
                      href={`tel:${client.telephone.replace(/\s/g, "")}`}
                      className="text-primary hover:underline"
                    >
                      {client.telephone}
                    </a>
                  </li>
                )}
                {client.email && (
                  <li className="flex items-center gap-2">
                    <Mail
                      size={15}
                      className="shrink-0 text-muted-foreground"
                    />
                    <a
                      href={`mailto:${client.email}`}
                      className="break-all text-primary hover:underline"
                    >
                      {client.email}
                    </a>
                  </li>
                )}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        Fiche créée le {formatDate(client.createdAt)}
        {client.updatedAt && ` · modifiée le ${formatDate(client.updatedAt)}`}
        {depuisT24 && client.dateSynchroT24
          ? ` · signalétique rapatriée de T24 le ${formatDateTime(client.dateSynchroT24)}`
          : " · saisie manuelle"}
      </p>
    </div>
  );
}

function montant(v: number | null | undefined): string | null {
  return v === null || v === undefined ? null : formatMAD(v);
}

function Puce({ libelle, alerte }: { libelle: string; alerte?: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
        alerte
          ? "bg-warning-subtle text-warning"
          : "bg-muted text-muted-foreground"
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
  aide,
}: {
  libelle: string;
  valeur: number | null | undefined;
  brut?: boolean;
  /** Texte affiché à la place du tiret quand la valeur est sans objet. */
  aide?: string;
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
          : (aide ?? "—")}
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
