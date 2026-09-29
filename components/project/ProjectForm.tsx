"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api-client";
import { createProjectSchema } from "@/lib/validation-schemas";
import { formatMADCompact } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import {
  BarreActions,
  Champ,
  ChampMontant,
  Controle,
  Selecteur,
} from "@/components/ui/form-fields";

/**
 * Formulaire de dossier projet, partagé par la création et la modification.
 *
 * Les deux écrans recopiaient quelque quatre cents lignes de JSX réparties en sept
 * onglets — dont un ne contenant que « Pays », un autre deux champs désactivés sans
 * objet. Le client, pourtant nécessaire pour rattacher le dossier à une contrepartie,
 * n'était demandé nulle part : tout projet créé était orphelin. Le statut se choisissait
 * librement, jusqu'à « Approuvé », ce qui contournait l'évaluation et le comité.
 *
 * Ici : quatre sections empilées, le client en tête, aucun champ de statut ni de note,
 * et les contrôles de cohérence du montage affichés pendant la saisie.
 */

export interface ValeursProjet {
  nom: string;
  clientId: string;
  secteur: string;
  pays: string;
  countryCode: string;
  description: string;
  devise: string;
  montant: string;
  coutTotal: string;
  financement: string;
  apportPropre: string;
  typeCredit: string;
  taux: string;
  dureeCredit: string;
  periodeAmorce: string;
  periodeRemboursement: string;
  tauxCouverture: string;
  ratio: string;
  structureCapitalePrincipale: string;
  sponsorPrincipal: string;
  nomSPV: string;
  constructeurEPC: string;
  operateurOM: string;
  technologie: string;
  capaciteInstallee: string;
  debutConstruction: string;
  finConstruction: string;
  dureeProjet: string;
}

export const VALEURS_PROJET_VIDES: ValeursProjet = {
  nom: "",
  clientId: "",
  secteur: "",
  pays: "Maroc",
  countryCode: "MA",
  description: "",
  devise: "MAD",
  montant: "",
  coutTotal: "",
  financement: "",
  apportPropre: "",
  typeCredit: "",
  taux: "",
  dureeCredit: "",
  periodeAmorce: "",
  periodeRemboursement: "",
  tauxCouverture: "",
  ratio: "",
  structureCapitalePrincipale: "",
  sponsorPrincipal: "",
  nomSPV: "",
  constructeurEPC: "",
  operateurOM: "",
  technologie: "",
  capaciteInstallee: "",
  debutConstruction: "",
  finConstruction: "",
  dureeProjet: "",
};

const CHAMPS_NOMBRES: (keyof ValeursProjet)[] = [
  "montant",
  "coutTotal",
  "financement",
  "apportPropre",
  "taux",
  "dureeCredit",
  "periodeAmorce",
  "periodeRemboursement",
  "tauxCouverture",
  "ratio",
  "capaciteInstallee",
  "dureeProjet",
];

/** Quelques pays d'intervention, avec le code ISO attendu par le moteur pays. */
const PAYS = [
  { code: "MA", nom: "Maroc" },
  { code: "MR", nom: "Mauritanie" },
  { code: "SN", nom: "Sénégal" },
  { code: "CI", nom: "Côte d'Ivoire" },
  { code: "TN", nom: "Tunisie" },
  { code: "EG", nom: "Égypte" },
  { code: "FR", nom: "France" },
  { code: "ES", nom: "Espagne" },
];

const DEVISES = ["MAD", "EUR", "USD"];

/** Convertit un projet renvoyé par l'API en valeurs de formulaire. */
export function versValeursProjet(p: Record<string, unknown>): ValeursProjet {
  const texte = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const valeurs = { ...VALEURS_PROJET_VIDES } as Record<string, string>;
  for (const cle of Object.keys(VALEURS_PROJET_VIDES)) valeurs[cle] = texte(p[cle]);
  // Les dates arrivent au format ISO complet, que input[type=date] refuse : le champ
  // affichait « jj/mm/aaaa » et l'utilisateur croyait la date absente.
  valeurs.debutConstruction = p.debutConstruction
    ? String(p.debutConstruction).slice(0, 10)
    : "";
  valeurs.finConstruction = p.finConstruction
    ? String(p.finConstruction).slice(0, 10)
    : "";
  if (!valeurs.devise) valeurs.devise = "MAD";
  return valeurs as unknown as ValeursProjet;
}

/** Ce que l'API attend : chaînes vides en null, nombres en nombres. */
export function versPayloadProjet(v: Partial<ValeursProjet>): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(v) as [keyof ValeursProjet, string][]) {
    const vide = (valeur ?? "").trim() === "";
    if (CHAMPS_NOMBRES.includes(cle)) sortie[cle] = vide ? null : Number(valeur);
    else sortie[cle] = vide ? null : valeur.trim();
  }
  if (v.nom !== undefined) sortie.nom = (v.nom ?? "").trim();
  // Le montant est obligatoire en base : un dossier sans montant sollicité vaut zéro.
  if ("montant" in v && sortie.montant === null) sortie.montant = 0;
  if ("description" in v && sortie.description === null) sortie.description = "";
  if ("secteur" in v && sortie.secteur === null) sortie.secteur = "";
  return sortie;
}

interface ClientBref {
  id: string;
  nom: string;
  ratingInterne?: string | null;
  statusKYC?: string | null;
  exposition?: number | null;
  secteur?: string | null;
}

type Erreurs = Partial<Record<keyof ValeursProjet, string>>;

const nombre = (v: string): number | null => {
  const n = Number(v);
  return v.trim() === "" || !Number.isFinite(n) ? null : n;
};

export function ProjectForm({
  valeursInitiales,
  libelleAction,
  enCours,
  onSubmit,
  hrefAnnuler,
  erreurGlobale,
  creation,
  rappel,
}: {
  valeursInitiales: ValeursProjet;
  libelleAction: string;
  enCours: boolean;
  onSubmit: (valeurs: ValeursProjet, modifies: Partial<ValeursProjet>) => void;
  hrefAnnuler: string;
  erreurGlobale?: string | null;
  /** En création, le bouton reste actif : il n'y a pas de valeur de départ à modifier. */
  creation?: boolean;
  /** Bandeau de contexte affiché en tête, en modification. */
  rappel?: React.ReactNode;
}) {
  const [v, setV] = useState<ValeursProjet>(valeursInitiales);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [clients, setClients] = useState<ClientBref[]>([]);
  const [secteurs, setSecteurs] = useState<{ code: string; label: string }[]>([]);
  const initiales = useRef(valeursInitiales);

  useEffect(() => {
    setV(valeursInitiales);
    initiales.current = valeursInitiales;
  }, [valeursInitiales]);

  useEffect(() => {
    (async () => {
      const [resClients, resSecteurs] = await Promise.all([
        apiGet("/api/clients?take=500"),
        apiGet("/api/reference/sectors"),
      ]);
      if (resClients.ok) setClients((await resClients.json()).data ?? []);
      if (resSecteurs.ok) setSecteurs((await resSecteurs.json()).data ?? []);
    })();
  }, []);

  const client = clients.find((c) => c.id === v.clientId);

  const modifies = useMemo(() => {
    const d: Partial<ValeursProjet> = {};
    for (const cle of Object.keys(v) as (keyof ValeursProjet)[]) {
      if (v[cle] !== initiales.current[cle]) d[cle] = v[cle];
    }
    return d;
  }, [v]);

  const set = (cle: keyof ValeursProjet) => (valeur: string) =>
    setV((prec) => ({ ...prec, [cle]: valeur }));

  const choisirPays = (nomPays: string) => {
    const trouve = PAYS.find((p) => p.nom === nomPays);
    // Pays et code pays vivaient dans deux onglets différents et pouvaient se
    // contredire : ils se remplissent maintenant ensemble.
    setV((prec) => ({
      ...prec,
      pays: nomPays,
      countryCode: trouve ? trouve.code : prec.countryCode,
    }));
  };

  /* ── Contrôles de cohérence du montage ──────────────────────────────────── */
  const coutTotal = nombre(v.coutTotal);
  const dette = nombre(v.financement);
  const apport = nombre(v.apportPropre);
  const montant = nombre(v.montant);
  const dscr = nombre(v.tauxCouverture);
  const duree = nombre(v.dureeCredit);
  const amorce = nombre(v.periodeAmorce);
  const remboursement = nombre(v.periodeRemboursement);

  const ecartMontage =
    coutTotal !== null && dette !== null && apport !== null
      ? coutTotal - (dette + apport)
      : null;
  const partFondsPropres =
    coutTotal && apport !== null && coutTotal > 0 ? (apport / coutTotal) * 100 : null;
  const ecartDuree =
    duree !== null && amorce !== null && remboursement !== null
      ? duree - (amorce + remboursement)
      : null;
  const datesIncoherentes =
    v.debutConstruction !== "" &&
    v.finConstruction !== "" &&
    v.finConstruction <= v.debutConstruction;

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    const resultat = createProjectSchema.safeParse(versPayloadProjet(v));
    if (!resultat.success) {
      const e2: Erreurs = {};
      for (const issue of resultat.error.issues) {
        const champ = issue.path[0] as keyof ValeursProjet;
        if (champ && !e2[champ]) e2[champ] = issue.message;
      }
      setErreurs(e2);
      const premier = document.getElementById(`champ-${Object.keys(e2)[0]}`);
      premier?.scrollIntoView({ behavior: "smooth", block: "center" });
      premier?.focus({ preventScroll: true });
      return;
    }
    setErreurs({});
    onSubmit(v, modifies);
  };

  const devise = v.devise || "MAD";

  return (
    <form onSubmit={soumettre} className="pb-20">
      {rappel}

      {erreurGlobale && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreurGlobale}
        </div>
      )}

      <div className="space-y-4">
        <SectionCard titre="Projet et contrepartie">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ
              cle="nom"
              libelle="Nom du projet"
              obligatoire
              valeur={v.nom}
              onChange={set("nom")}
              erreur={erreurs.nom}
              placeholder="Parc éolien de Taza — phase 2"
            />
            {/* Le client était absent du formulaire : le projet créé n'apparaissait
                sur aucune fiche client. */}
            <Selecteur
              cle="clientId"
              libelle="Client"
              valeur={v.clientId}
              onChange={set("clientId")}
              erreur={erreurs.clientId}
              options={clients.map((c) => ({ valeur: c.id, libelle: c.nom }))}
              aide={
                client
                  ? [
                      client.ratingInterne ? `Notation ${client.ratingInterne}` : null,
                      client.statusKYC ? `KYC ${client.statusKYC.toLowerCase()}` : null,
                      client.exposition != null
                        ? `exposition ${formatMADCompact(client.exposition)}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Rattachez le dossier à une contrepartie connue."
              }
            />
            <Selecteur
              cle="secteur"
              libelle="Secteur"
              valeur={v.secteur}
              onChange={set("secteur")}
              erreur={erreurs.secteur}
              options={secteurs.map((s) => ({
                valeur: s.code,
                libelle: `${s.code} — ${s.label}`,
              }))}
              aide="Le code du secteur commande le calibrage sectoriel de la notation."
            />
            <Selecteur
              cle="pays"
              libelle="Pays"
              valeur={v.pays}
              onChange={choisirPays}
              options={PAYS.map((p) => ({ valeur: p.nom, libelle: `${p.nom} (${p.code})` }))}
              aide={v.countryCode ? `Code pays : ${v.countryCode}` : undefined}
            />
          </div>
          <div className="mt-4">
            <Champ
              cle="description"
              libelle="Description"
              multiligne
              valeur={v.description}
              onChange={set("description")}
              erreur={erreurs.description}
              placeholder="Objet du projet, capacité, contrepartie d'achat, contexte…"
            />
          </div>
        </SectionCard>

        <SectionCard
          titre="Financement"
          description="Le montant sollicité est la part demandée à la banque ; le financement est la dette totale du montage."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Selecteur
              cle="devise"
              libelle="Devise"
              valeur={devise}
              onChange={set("devise")}
              erreur={erreurs.devise}
              options={DEVISES.map((d) => ({ valeur: d, libelle: d }))}
            />
            <ChampMontant
              cle="montant"
              libelle="Montant sollicité"
              devise={devise}
              valeur={v.montant}
              onChange={set("montant")}
              erreur={erreurs.montant}
            />
            <ChampMontant
              cle="coutTotal"
              libelle="Coût total du projet"
              devise={devise}
              valeur={v.coutTotal}
              onChange={set("coutTotal")}
              erreur={erreurs.coutTotal}
            />
            <ChampMontant
              cle="financement"
              libelle="Dette totale"
              devise={devise}
              valeur={v.financement}
              onChange={set("financement")}
              erreur={erreurs.financement}
            />
            <ChampMontant
              cle="apportPropre"
              libelle="Fonds propres"
              devise={devise}
              valeur={v.apportPropre}
              onChange={set("apportPropre")}
              erreur={erreurs.apportPropre}
            />
            <Champ
              cle="typeCredit"
              libelle="Type de crédit"
              valeur={v.typeCredit}
              onChange={set("typeCredit")}
              erreur={erreurs.typeCredit}
              placeholder="Prêt senior amortissable"
            />
            <Champ
              cle="taux"
              libelle="Taux"
              type="number"
              suffixe="%"
              valeur={v.taux}
              onChange={set("taux")}
              erreur={erreurs.taux}
            />
            {/* Le DSCR s'exprime en multiple de la charge de dette, non en pourcentage :
                le libellé annonçait « Taux de couverture (%) » pour une valeur de 1,32. */}
            <Champ
              cle="tauxCouverture"
              libelle="DSCR — couverture du service de la dette"
              type="number"
              suffixe="x"
              valeur={v.tauxCouverture}
              onChange={set("tauxCouverture")}
              erreur={erreurs.tauxCouverture}
              aide="Flux disponibles rapportés à l'échéance annuelle. Plancher de la banque : 1,10x."
            />
            <Champ
              cle="dureeCredit"
              libelle="Durée du crédit"
              type="number"
              suffixe="ans"
              valeur={v.dureeCredit}
              onChange={set("dureeCredit")}
              erreur={erreurs.dureeCredit}
            />
            <Champ
              cle="periodeAmorce"
              libelle="Différé d'amortissement"
              type="number"
              suffixe="ans"
              valeur={v.periodeAmorce}
              onChange={set("periodeAmorce")}
              erreur={erreurs.periodeAmorce}
            />
            <Champ
              cle="periodeRemboursement"
              libelle="Période de remboursement"
              type="number"
              suffixe="ans"
              valeur={v.periodeRemboursement}
              onChange={set("periodeRemboursement")}
              erreur={erreurs.periodeRemboursement}
            />
            <Champ
              cle="ratio"
              libelle="Levier dette / fonds propres"
              type="number"
              suffixe="x"
              valeur={v.ratio}
              onChange={set("ratio")}
              erreur={erreurs.ratio}
            />
          </div>

          <div className="mt-4">
            <Champ
              cle="structureCapitalePrincipale"
              libelle="Structure du capital"
              multiligne
              valeur={v.structureCapitalePrincipale}
              onChange={set("structureCapitalePrincipale")}
              erreur={erreurs.structureCapitalePrincipale}
              placeholder="Répartition du capital de la société de projet, parts de dette senior et de fonds propres…"
            />
          </div>

          {/* Contrôles tenus pendant la saisie : ces incohérences n'étaient relevées
              qu'après coup, parfois seulement par le comité. */}
          <ul className="mt-4 space-y-1.5 border-t border-border pt-3">
            {ecartMontage === null ? (
              <Controle etat="neutre">
                Renseignez coût total, dette et fonds propres pour vérifier le montage.
              </Controle>
            ) : Math.abs(ecartMontage) < 1 ? (
              <Controle etat="ok">Dette + fonds propres = coût total.</Controle>
            ) : (
              <Controle etat="erreur">
                Le montage ne boucle pas : {formatMADCompact(Math.abs(ecartMontage))}{" "}
                {ecartMontage > 0 ? "manquants" : "en excès"} par rapport au coût total.
              </Controle>
            )}

            {partFondsPropres !== null && (
              <Controle etat={partFondsPropres < 20 ? "alerte" : "ok"}>
                Fonds propres : {partFondsPropres.toFixed(1).replace(".", ",")} % du coût
                total
                {partFondsPropres < 20
                  ? " — sous le plancher de 20 % (condition rédhibitoire)."
                  : "."}
              </Controle>
            )}

            {dscr !== null && (
              <Controle etat={dscr < 1.1 ? "alerte" : "ok"}>
                DSCR {dscr.toFixed(2).replace(".", ",")}x
                {dscr < 1.1 ? " — sous le plancher de 1,10x (condition rédhibitoire)." : "."}
              </Controle>
            )}

            {montant !== null && dette !== null && montant > dette && (
              <Controle etat="alerte">
                Le montant sollicité dépasse la dette totale du montage.
              </Controle>
            )}

            {ecartDuree !== null && ecartDuree !== 0 && (
              <Controle etat="alerte">
                Différé + remboursement ({(amorce ?? 0) + (remboursement ?? 0)} ans) ne
                correspond pas à la durée du crédit ({duree} ans).
              </Controle>
            )}
          </ul>
        </SectionCard>

        <SectionCard titre="Acteurs et technique">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ
              cle="sponsorPrincipal"
              libelle="Sponsor principal"
              valeur={v.sponsorPrincipal}
              onChange={set("sponsorPrincipal")}
              erreur={erreurs.sponsorPrincipal}
              aide="L'actionnaire qui porte le projet et son engagement."
            />
            <Champ
              cle="nomSPV"
              libelle="Société de projet (SPV)"
              valeur={v.nomSPV}
              onChange={set("nomSPV")}
              erreur={erreurs.nomSPV}
              aide="La société dédiée qui porte les actifs et la dette."
            />
            <Champ
              cle="constructeurEPC"
              libelle="Constructeur (EPC)"
              valeur={v.constructeurEPC}
              onChange={set("constructeurEPC")}
              erreur={erreurs.constructeurEPC}
              aide="Titulaire du contrat de conception et construction clés en main."
            />
            <Champ
              cle="operateurOM"
              libelle="Exploitant (O&M)"
              valeur={v.operateurOM}
              onChange={set("operateurOM")}
              erreur={erreurs.operateurOM}
              aide="Responsable de l'exploitation et de la maintenance."
            />
            <Champ
              cle="technologie"
              libelle="Technologie"
              valeur={v.technologie}
              onChange={set("technologie")}
              erreur={erreurs.technologie}
              placeholder="Éolien terrestre — turbines 4,2 MW"
            />
            {/* L'unité dépend de la technologie : MW pour un parc éolien, m³/jour
                pour une station de dessalement. Le suffixe « MW » était codé en dur. */}
            <Champ
              cle="capaciteInstallee"
              libelle="Capacité installée"
              type="number"
              valeur={v.capaciteInstallee}
              onChange={set("capaciteInstallee")}
              erreur={erreurs.capaciteInstallee}
              aide="Dans l'unité de la technologie retenue : MW, m³/jour, tonnes/an…"
            />
          </div>
        </SectionCard>

        <SectionCard titre="Calendrier">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Champ
              cle="debutConstruction"
              libelle="Début de construction"
              type="date"
              valeur={v.debutConstruction}
              onChange={set("debutConstruction")}
              erreur={erreurs.debutConstruction}
            />
            <Champ
              cle="finConstruction"
              libelle="Fin de construction"
              type="date"
              valeur={v.finConstruction}
              onChange={set("finConstruction")}
              erreur={erreurs.finConstruction}
            />
            <Champ
              cle="dureeProjet"
              libelle="Durée de vie du projet"
              type="number"
              suffixe="ans"
              valeur={v.dureeProjet}
              onChange={set("dureeProjet")}
              erreur={erreurs.dureeProjet}
            />
          </div>
          {datesIncoherentes && (
            <ul className="mt-3">
              <Controle etat="erreur">
                La fin de construction précède son début.
              </Controle>
            </ul>
          )}
        </SectionCard>
      </div>

      <BarreActions
        libelleAction={libelleAction}
        enCours={enCours}
        nbModifies={Object.keys(modifies).length}
        hrefAnnuler={hrefAnnuler}
        desactiveSiInchange={!creation}
      />
    </form>
  );
}
