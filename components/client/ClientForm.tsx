"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { createClientSchema } from "@/lib/validation-schemas";
import { REFERENTIELS_CLIENT, type OptionReferentiel } from "@/lib/referentiels";
import { SectionCard } from "@/components/ui/section-card";
import {
  BarreActions,
  Champ,
  ChampMontant,
  Selecteur,
  SelecteurLibre,
} from "@/components/ui/form-fields";

/**
 * Formulaire de signalétique client, partagé par la création et la modification.
 *
 * Les deux écrans recopiaient environ 450 lignes de JSX identiques, chacun avec ses
 * propres listes de valeurs — d'où des divergences (« GE » contre « Grande
 * Entreprise ») qui faisaient afficher « Sélectionner » sur des fiches pourtant
 * renseignées. Les vingt-sept champs étaient répartis en six onglets : il fallait six
 * clics pour voir le dossier, sans indication de ce qui restait à remplir ni de ce qui
 * était en erreur. Aucun libellé n'était associé à son champ.
 *
 * Ici : quatre sections empilées, des libellés liés à leurs champs, la validation du
 * schéma Zod qui fait déjà foi côté API, et une barre d'actions qui suit le défilement.
 */

export interface ValeursClient {
  nom: string;
  raisonSociale: string;
  nomCommercial: string;
  typeClient: string;
  formeJuridique: string;
  segmentClientele: string;
  secteur: string;
  effectifs: string;
  capitalSocial: string;
  chiffreAffaires: string;
  description: string;
  email: string;
  telephone: string;
  website: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  gestionnaire: string;
  centreAffaires: string;
  statutBancaire: string;
  ratingInterne: string;
  exposition: string;
  dateRelation: string;
  statusKYC: string;
  statusConformite: string;
  status: string;
}

export const VALEURS_CLIENT_VIDES: ValeursClient = {
  nom: "",
  raisonSociale: "",
  nomCommercial: "",
  typeClient: "",
  formeJuridique: "",
  segmentClientele: "",
  secteur: "",
  effectifs: "",
  capitalSocial: "",
  chiffreAffaires: "",
  description: "",
  email: "",
  telephone: "",
  website: "",
  adresse: "",
  codePostal: "",
  ville: "",
  pays: "Maroc",
  gestionnaire: "",
  centreAffaires: "",
  statutBancaire: "",
  ratingInterne: "",
  exposition: "",
  dateRelation: "",
  statusKYC: "",
  statusConformite: "",
  status: "Actif",
};

/** Convertit une fiche renvoyée par l'API en valeurs de formulaire. */
export function versValeursClient(c: Record<string, unknown>): ValeursClient {
  const texte = (v: unknown) =>
    v === null || v === undefined ? "" : String(v);
  return {
    ...VALEURS_CLIENT_VIDES,
    ...Object.fromEntries(
      Object.keys(VALEURS_CLIENT_VIDES).map((k) => [k, texte(c[k])])
    ),
    dateRelation: c.dateRelation ? String(c.dateRelation).slice(0, 10) : "",
  } as ValeursClient;
}

type Erreurs = Partial<Record<keyof ValeursClient, string>>;

/** Comparaison de raisons sociales : la casse et les accents ne font pas la différence. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const CHAMPS_NUMERIQUES: (keyof ValeursClient)[] = [
  "effectifs",
  "capitalSocial",
  "chiffreAffaires",
  "exposition",
];

/** Ce que l'API attend : chaînes vides converties en null, nombres en nombres. */
export function versPayloadClient(v: ValeursClient): Record<string, unknown> {
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(v) as [keyof ValeursClient, string][]) {
    const vide = valeur.trim() === "";
    if (CHAMPS_NUMERIQUES.includes(cle)) {
      sortie[cle] = vide ? null : Number(valeur);
    } else {
      sortie[cle] = vide ? null : valeur.trim();
    }
  }
  // Le nom est obligatoire : il ne peut pas partir à null.
  sortie.nom = v.nom.trim();
  return sortie;
}

export function ClientForm({
  valeursInitiales,
  libelleAction,
  enCours,
  onSubmit,
  hrefAnnuler,
  erreurGlobale,
  creation,
  clientId,
}: {
  valeursInitiales: ValeursClient;
  libelleAction: string;
  enCours: boolean;
  /** Reçoit les valeurs complètes et, en modification, les seuls champs modifiés. */
  onSubmit: (valeurs: ValeursClient, modifies: Partial<ValeursClient>) => void;
  hrefAnnuler: string;
  erreurGlobale?: string | null;
  /** En création, le bouton reste actif : il n'y a pas de valeur de départ à modifier. */
  creation?: boolean;
  /** En modification : pour exclure la fiche courante de la détection de doublon. */
  clientId?: string;
}) {
  const [v, setV] = useState<ValeursClient>(valeursInitiales);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [listes, setListes] =
    useState<Record<string, OptionReferentiel[]>>(REFERENTIELS_CLIENT as unknown as Record<string, OptionReferentiel[]>);
  const [secteurs, setSecteurs] = useState<{ code: string; label: string }[]>([]);
  const [gestionnaires, setGestionnaires] = useState<string[]>([]);
  const [homonymes, setHomonymes] = useState<{ id: string; nom: string }[]>([]);
  const initiales = useRef(valeursInitiales);

  useEffect(() => {
    setV(valeursInitiales);
    initiales.current = valeursInitiales;
  }, [valeursInitiales]);

  useEffect(() => {
    (async () => {
      const [resListes, resSecteurs, resUsers] = await Promise.all([
        apiGet("/api/reference/lists"),
        apiGet("/api/reference/sectors"),
        apiGet("/api/users?limit=200"),
      ]);
      if (resListes.ok) {
        const d = await resListes.json();
        if (d?.data) setListes(d.data);
      }
      if (resSecteurs.ok) setSecteurs((await resSecteurs.json()).data ?? []);
      // La liste des utilisateurs est réservée aux responsables : un analyste reçoit
      // un 403, auquel cas le gestionnaire reste en saisie libre.
      if (resUsers.ok) {
        const d = await resUsers.json();
        const liste: { nom?: string; prenom?: string }[] = d.data ?? d.users ?? [];
        setGestionnaires(
          liste
            .map((u) => `${u.prenom ?? ""} ${u.nom ?? ""}`.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "fr"))
        );
      }
    })();
  }, []);

  // Détection de doublon : un même nom saisi deux fois crée deux dossiers de crédit
  // sur la même contrepartie, ce que rien ne signalait. Le rapprochement est refait
  // ici : la recherche de l'API est large, et une liste de tous les clients à chaque
  // frappe serait du bruit plutôt qu'une alerte.
  const chercherHomonymes = useCallback(
    async (nom: string) => {
      if (nom.trim().length < 3) return setHomonymes([]);
      try {
        const res = await apiGet(
          `/api/clients?take=5&search=${encodeURIComponent(nom.trim())}`
        );
        if (!res.ok) return;
        const liste: { id: string; nom: string }[] = (await res.json()).data ?? [];
        const cible = normaliser(nom);
        setHomonymes(
          liste
            .filter((c) => {
              if (c.id === clientId) return false;
              const autre = normaliser(c.nom);
              return autre.includes(cible) || cible.includes(autre);
            })
            .slice(0, 3)
        );
      } catch {
        /* la détection de doublon ne doit jamais empêcher la saisie */
      }
    },
    [clientId]
  );

  useEffect(() => {
    const t = setTimeout(() => chercherHomonymes(v.nom), 500);
    return () => clearTimeout(t);
  }, [v.nom, chercherHomonymes]);

  const modifies = useMemo(() => {
    const d: Partial<ValeursClient> = {};
    for (const cle of Object.keys(v) as (keyof ValeursClient)[]) {
      if (v[cle] !== initiales.current[cle]) d[cle] = v[cle];
    }
    return d;
  }, [v]);

  const nbModifies = Object.keys(modifies).length;

  const set = (cle: keyof ValeursClient) => (valeur: string) =>
    setV((prec) => ({ ...prec, [cle]: valeur }));

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    // Le schéma Zod de l'API est aussi celui du formulaire : les deux ne peuvent
    // plus diverger, et l'erreur s'affiche sous le champ plutôt qu'en bandeau.
    const resultat = createClientSchema.safeParse(versPayloadClient(v));
    if (!resultat.success) {
      const e2: Erreurs = {};
      for (const issue of resultat.error.issues) {
        const champ = issue.path[0] as keyof ValeursClient;
        if (champ && !e2[champ]) e2[champ] = issue.message;
      }
      setErreurs(e2);
      const premier = document.getElementById(
        `champ-${Object.keys(e2)[0]}`
      );
      premier?.scrollIntoView({ behavior: "smooth", block: "center" });
      premier?.focus({ preventScroll: true });
      return;
    }
    setErreurs({});
    onSubmit(v, modifies);
  };

  const options = (cle: string) => listes[cle] ?? [];

  return (
    <form onSubmit={soumettre} className="pb-20">
      {erreurGlobale && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreurGlobale}
        </div>
      )}

      <div className="space-y-4">
        <SectionCard titre="Identité" description="Ce qui désigne la contrepartie dans les actes.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ
              cle="nom"
              libelle="Nom usuel"
              obligatoire
              aide="Le nom sous lequel la banque désigne le client au quotidien."
              valeur={v.nom}
              onChange={set("nom")}
              erreur={erreurs.nom}
              placeholder="Atlas Énergie Holding"
            />
            <Champ
              cle="raisonSociale"
              libelle="Raison sociale"
              aide="La dénomination exacte figurant au registre du commerce."
              valeur={v.raisonSociale}
              onChange={set("raisonSociale")}
              erreur={erreurs.raisonSociale}
              placeholder="ATLAS ENERGIE HOLDING S.A."
            />
            <Champ
              cle="nomCommercial"
              libelle="Nom commercial"
              valeur={v.nomCommercial}
              onChange={set("nomCommercial")}
              erreur={erreurs.nomCommercial}
            />
            <Selecteur
              cle="typeClient"
              libelle="Type de client"
              valeur={v.typeClient}
              onChange={set("typeClient")}
              options={options("typeClient")}
            />
            <Selecteur
              cle="formeJuridique"
              libelle="Forme juridique"
              valeur={v.formeJuridique}
              onChange={set("formeJuridique")}
              options={options("formeJuridique")}
            />
            <Selecteur
              cle="segmentClientele"
              libelle="Segment de clientèle"
              valeur={v.segmentClientele}
              onChange={set("segmentClientele")}
              options={options("segmentClientele")}
            />
          </div>

          {homonymes.length > 0 && (
            <div className="mt-4 rounded-md border border-warning/40 bg-warning-subtle px-3 py-2 text-[12.5px] text-warning">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={14} />
                Contrepartie déjà connue&nbsp;?
              </span>
              <ul className="mt-1 space-y-0.5">
                {homonymes.map((c) => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`} className="underline">
                      {c.nom}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard titre="Activité et chiffres" description="Le secteur sert au rapprochement sectoriel du moteur de notation.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelecteurLibre
              cle="secteur"
              libelle="Secteur"
              valeur={v.secteur}
              onChange={set("secteur")}
              options={secteurs.map((s) => ({
                valeur: s.label,
                libelle: `${s.code} — ${s.label}`,
              }))}
              aide="Choisissez dans le référentiel : « Énergie » et « ENR » saisis librement ne se rapprochent pas."
            />
            <Champ
              cle="effectifs"
              libelle="Effectifs"
              type="number"
              valeur={v.effectifs}
              onChange={set("effectifs")}
              erreur={erreurs.effectifs}
              placeholder="450"
            />
            <ChampMontant
              cle="capitalSocial"
              libelle="Capital social"
              valeur={v.capitalSocial}
              onChange={set("capitalSocial")}
              erreur={erreurs.capitalSocial}
            />
            <ChampMontant
              cle="chiffreAffaires"
              libelle="Chiffre d'affaires"
              valeur={v.chiffreAffaires}
              onChange={set("chiffreAffaires")}
              erreur={erreurs.chiffreAffaires}
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
              placeholder="Activité, filiales, position sur le marché…"
            />
          </div>
        </SectionCard>

        <SectionCard titre="Coordonnées">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ
              cle="email"
              libelle="Courriel"
              type="email"
              valeur={v.email}
              onChange={set("email")}
              erreur={erreurs.email}
              placeholder="financement@exemple.ma"
            />
            <Champ
              cle="telephone"
              libelle="Téléphone"
              valeur={v.telephone}
              onChange={set("telephone")}
              erreur={erreurs.telephone}
              placeholder="+212 5 22 00 00 00"
            />
            {/* Champ en texte simple : le type url du navigateur rejetait
                « www.exemple.ma » sans rien expliquer. */}
            <Champ
              cle="website"
              libelle="Site web"
              valeur={v.website}
              onChange={set("website")}
              erreur={erreurs.website}
              placeholder="www.exemple.ma"
            />
            <Champ
              cle="ville"
              libelle="Ville"
              valeur={v.ville}
              onChange={set("ville")}
              erreur={erreurs.ville}
              placeholder="Casablanca"
            />
            <Champ
              cle="adresse"
              libelle="Adresse"
              valeur={v.adresse}
              onChange={set("adresse")}
              erreur={erreurs.adresse}
            />
            <Champ
              cle="codePostal"
              libelle="Code postal"
              valeur={v.codePostal}
              onChange={set("codePostal")}
              erreur={erreurs.codePostal}
              placeholder="20050"
            />
            <Champ
              cle="pays"
              libelle="Pays"
              valeur={v.pays}
              onChange={set("pays")}
              erreur={erreurs.pays}
            />
          </div>
        </SectionCard>

        <SectionCard
          titre="Relation bancaire et conformité"
          description="Ces éléments conditionnent l'octroi : ils étaient relégués au dernier onglet."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelecteurLibre
              cle="gestionnaire"
              libelle="Gestionnaire"
              valeur={v.gestionnaire}
              onChange={set("gestionnaire")}
              options={gestionnaires.map((g) => ({ valeur: g, libelle: g }))}
            />
            <Champ
              cle="centreAffaires"
              libelle="Centre d'affaires"
              valeur={v.centreAffaires}
              onChange={set("centreAffaires")}
              erreur={erreurs.centreAffaires}
              placeholder="Casablanca Grandes Entreprises"
            />
            <Selecteur
              cle="statutBancaire"
              libelle="Statut bancaire"
              valeur={v.statutBancaire}
              onChange={set("statutBancaire")}
              options={options("statutBancaire")}
            />
            <Selecteur
              cle="ratingInterne"
              libelle="Notation interne"
              valeur={v.ratingInterne}
              onChange={set("ratingInterne")}
              options={options("ratingInterne")}
            />
            <ChampMontant
              cle="exposition"
              libelle="Exposition"
              valeur={v.exposition}
              onChange={set("exposition")}
              erreur={erreurs.exposition}
            />
            <Champ
              cle="dateRelation"
              libelle="Entrée en relation"
              type="date"
              valeur={v.dateRelation}
              onChange={set("dateRelation")}
              erreur={erreurs.dateRelation}
            />
            <Selecteur
              cle="statusKYC"
              libelle="KYC"
              valeur={v.statusKYC}
              onChange={set("statusKYC")}
              options={options("statusKYC")}
            />
            <Selecteur
              cle="statusConformite"
              libelle="Conformité"
              valeur={v.statusConformite}
              onChange={set("statusConformite")}
              options={options("statusConformite")}
            />
            <Selecteur
              cle="status"
              libelle="Statut du client"
              valeur={v.status}
              onChange={set("status")}
              options={options("status")}
            />
          </div>
        </SectionCard>
      </div>

      <BarreActions
        libelleAction={libelleAction}
        enCours={enCours}
        nbModifies={nbModifies}
        hrefAnnuler={hrefAnnuler}
        desactiveSiInchange={!creation}
      />
    </form>
  );
}
