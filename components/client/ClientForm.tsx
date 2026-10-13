"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  Info,
  Loader2,
} from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { createClientSchema } from "@/lib/validation-schemas";
import {
  REFERENTIELS_CLIENT,
  type OptionReferentiel,
} from "@/lib/referentiels";
import {
  GROUPE,
  versPayloadActionnaires,
  versPayloadClient,
  type Cle,
  type LigneActionnaire,
  type ValeursClient,
} from "@/lib/clients/saisie";
import { ActionnairesEditeur } from "@/components/client/ActionnairesEditeur";
import { SectionCard } from "@/components/ui/section-card";
import {
  BarreActions,
  Champ,
  ChampMontant,
  Selecteur,
  SelecteurLibre,
} from "@/components/ui/form-fields";

/**
 * Signalétique client, partagée par la création et la modification.
 *
 * Limitée à ce qui sert l'instruction et la notation d'un financement de projet :
 * - identification légale (code client T24, ICE, RC, IF) : rapprochement avec le
 *   système central et les registres, détection des doublons ;
 * - groupe d'affaires : exposition consolidée (division des risques) et soutien du
 *   groupe ;
 * - solidité financière et expérience du sponsor : critères « sponsor » des grilles
 *   de financement spécialisé (Bâle, approche par classes) ;
 * - notation, classification Bank Al-Maghrib et exposition ;
 * - relation bancaire et conformité LBC/FT (KYC, niveau de risque, PPE).
 * Coordonnées réduites au contact utile ; site, code postal, nom commercial et
 * effectifs ne sont plus saisis (les valeurs existantes restent en base).
 *
 * Le chargé de saisie rapatrie la fiche depuis T24 par le code client lorsque le
 * connecteur est actif ; sinon, ou en complément, il saisit. Les champs repris de
 * T24 sont marqués ; une retouche manuelle retire la marque.
 */

export {
  VALEURS_CLIENT_VIDES,
  champsT24De,
  versLignesActionnaires,
  versPayloadClient,
  versValeursClient,
  type ValeursClient,
} from "@/lib/clients/saisie";

type Erreurs = Partial<Record<Cle, string>>;

/** Comparaison de raisons sociales : la casse et les accents ne font pas la différence. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

interface StatutT24 {
  actif: boolean;
  mode: string;
  message: string | null;
}

interface GroupeConnu {
  id: string;
  code: string | null;
  nom: string;
  nbClients: number;
}

export function ClientForm({
  valeursInitiales,
  champsT24Initiaux = [],
  actionnairesInitiaux = [],
  libelleAction,
  enCours,
  onSubmit,
  hrefAnnuler,
  erreurGlobale,
  creation,
  clientId,
}: {
  valeursInitiales: ValeursClient;
  champsT24Initiaux?: string[];
  actionnairesInitiaux?: LigneActionnaire[];
  libelleAction: string;
  enCours: boolean;
  /** Reçoit la charge complète et, en modification, celle des seuls champs modifiés. */
  onSubmit: (
    complet: Record<string, unknown>,
    modifies: Record<string, unknown>
  ) => void;
  hrefAnnuler: string;
  erreurGlobale?: string | null;
  /** En création, le bouton reste actif : il n'y a pas de valeur de départ à modifier. */
  creation?: boolean;
  /** En modification : pour exclure la fiche courante des contrôles de doublon. */
  clientId?: string;
}) {
  const [v, setV] = useState<ValeursClient>(valeursInitiales);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [listes, setListes] = useState<Record<string, OptionReferentiel[]>>(
    REFERENTIELS_CLIENT as unknown as Record<string, OptionReferentiel[]>
  );
  const [secteurs, setSecteurs] = useState<{ code: string; label: string }[]>(
    []
  );
  const [gestionnaires, setGestionnaires] = useState<string[]>([]);
  // Banques où l'utilisateur peut créer : le choix n'apparaît que s'il en a plusieurs.
  const [banques, setBanques] = useState<
    { id: string; nom: string; niveau: number }[]
  >([]);
  const [groupes, setGroupes] = useState<GroupeConnu[]>([]);
  const [homonymes, setHomonymes] = useState<{ id: string; nom: string }[]>([]);
  const initiales = useRef(valeursInitiales);

  // ─── T24 ───
  const [t24, setT24] = useState<StatutT24 | null>(null);
  const [champsT24, setChampsT24] = useState<string[]>(champsT24Initiaux);
  const champsT24Initiaux_ = useRef(champsT24Initiaux);
  const [actionnaires, setActionnaires] =
    useState<LigneActionnaire[]>(actionnairesInitiaux);
  const actionnairesInitiaux_ = useRef(
    JSON.stringify(versPayloadActionnaires(actionnairesInitiaux))
  );
  const [erreurActionnaires, setErreurActionnaires] = useState<
    string | undefined
  >();
  const [importT24, setImportT24] = useState(false);
  const [lectureT24, setLectureT24] = useState<"client" | "groupe" | null>(
    null
  );
  const [retourT24, setRetourT24] = useState<{
    type: "ok" | "erreur" | "alerte";
    texte: string;
    lien?: { href: string; libelle: string };
  } | null>(null);

  useEffect(() => {
    setV(valeursInitiales);
    initiales.current = valeursInitiales;
  }, [valeursInitiales]);

  useEffect(() => {
    (async () => {
      const [resListes, resSecteurs, resUsers, resEntites, resT24, resGroupes] =
        await Promise.all([
          apiGet("/api/reference/lists"),
          apiGet("/api/reference/sectors"),
          apiGet("/api/users?limit=200"),
          apiGet("/api/admin/entites"),
          apiGet("/api/t24/statut"),
          apiGet("/api/groupes-affaires"),
        ]);
      if (resEntites.ok) {
        const d = await resEntites.json();
        const ecriture: string[] = d.perimetre?.ecriture ?? [];
        const toutes: { id: string; nom: string; niveau: number }[] =
          d.data ?? [];
        setBanques(
          d.perimetre?.tout
            ? toutes
            : toutes.filter((e) => ecriture.includes(e.id))
        );
      }
      if (resListes.ok) {
        const d = await resListes.json();
        if (d?.data) setListes((prec) => ({ ...prec, ...d.data }));
      }
      if (resSecteurs.ok) setSecteurs((await resSecteurs.json()).data ?? []);
      if (resT24.ok) setT24((await resT24.json()).data ?? null);
      if (resGroupes.ok) setGroupes((await resGroupes.json()).data ?? []);
      // La liste des utilisateurs est réservée aux responsables : un analyste reçoit
      // un 403, auquel cas le gestionnaire reste en saisie libre.
      if (resUsers.ok) {
        const d = await resUsers.json();
        const liste: { nom?: string; prenom?: string }[] =
          d.data ?? d.users ?? [];
        setGestionnaires(
          liste
            .map((u) => `${u.prenom ?? ""} ${u.nom ?? ""}`.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "fr"))
        );
      }
    })();
  }, []);

  // Détection de doublon sur le nom : un même nom saisi deux fois crée deux dossiers
  // de crédit sur la même contrepartie.
  const chercherHomonymes = useCallback(
    async (nom: string) => {
      if (nom.trim().length < 3) return setHomonymes([]);
      try {
        const res = await apiGet(
          `/api/clients?take=5&search=${encodeURIComponent(nom.trim())}`
        );
        if (!res.ok) return;
        const liste: { id: string; nom: string }[] =
          (await res.json()).data ?? [];
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
    for (const cle of Object.keys(v) as Cle[]) {
      if (v[cle] !== initiales.current[cle]) d[cle] = v[cle];
    }
    return d;
  }, [v]);

  const champsT24Modifies =
    [...champsT24].sort().join("|") !==
    [...champsT24Initiaux_.current].sort().join("|");
  const chargeActionnaires = useMemo(
    () => versPayloadActionnaires(actionnaires),
    [actionnaires]
  );
  const actionnairesModifies =
    JSON.stringify(chargeActionnaires) !== actionnairesInitiaux_.current;
  const nbModifies =
    Object.keys(modifies).length + (actionnairesModifies ? 1 : 0);
  const actionnairePPE = chargeActionnaires.some((a) => a.ppe === true);

  /** Saisie manuelle : la valeur n'est plus celle de T24. */
  const set = (cle: Cle) => (valeur: string) => {
    setV((prec) => ({ ...prec, [cle]: valeur }));
    setChampsT24((prec) =>
      prec.includes(cle) ? prec.filter((c) => c !== cle) : prec
    );
  };

  const provenance = (cle: Cle) =>
    champsT24.includes(cle) ? "T24" : undefined;
  const options = (cle: string) => listes[cle] ?? [];

  // ─── Rapatriement T24 ───
  const rapatrierClient = async () => {
    const code = v.codeClientT24.trim();
    if (!code) {
      setErreurs((e) => ({
        ...e,
        codeClientT24: "Saisissez le code client T24 à rapatrier.",
      }));
      return;
    }
    setLectureT24("client");
    setRetourT24(null);
    try {
      const res = await apiGet(`/api/t24/clients/${encodeURIComponent(code)}`);
      if (!res.ok)
        throw new Error(await messageErreurApi(res, "Lecture T24 impossible."));
      const corps = await res.json();
      const fiche = corps.data as {
        codeClientT24: string;
        champs: Record<string, string | number>;
        groupe: { code: string | null; nom: string | null } | null;
      };
      const repris: string[] = Object.keys(fiche.champs);
      setV((prec) => {
        const suite = { ...prec, codeClientT24: fiche.codeClientT24 };
        for (const [cle, valeur] of Object.entries(fiche.champs)) {
          if (cle in suite)
            (suite as Record<string, string>)[cle] = String(valeur);
        }
        if (fiche.groupe?.nom || fiche.groupe?.code) {
          const connu = groupes.find(
            (g) => fiche.groupe?.code && g.code === fiche.groupe.code
          );
          suite.groupeCode = fiche.groupe.code ?? "";
          suite.groupeNom = fiche.groupe.nom ?? connu?.nom ?? suite.groupeNom;
        }
        return suite;
      });
      const marques = [
        "codeClientT24",
        ...repris,
        ...(fiche.groupe?.code ? ["groupeCode"] : []),
        ...(fiche.groupe?.nom ? ["groupeNom"] : []),
      ];
      setChampsT24(marques);
      setImportT24(true);
      setErreurs({});
      const existant = corps.existant as { id: string; nom: string } | null;
      if (existant && existant.id !== clientId) {
        setRetourT24({
          type: "alerte",
          texte: `Ce code client T24 est déjà attribué à « ${existant.nom} » : complétez cette fiche plutôt que d'en créer une seconde.`,
          lien: {
            href: `/clients/${existant.id}`,
            libelle: "Ouvrir la fiche existante",
          },
        });
      } else {
        setRetourT24({
          type: corps.simulation ? "alerte" : "ok",
          texte: `${repris.length} champ${repris.length > 1 ? "s" : ""} repris de T24${
            corps.simulation
              ? " — données de démonstration (mode simulation)"
              : ""
          }. Relisez, complétez les éléments propres au financement, puis enregistrez.`,
        });
      }
    } catch (e) {
      setRetourT24({
        type: "erreur",
        texte: `${e instanceof Error ? e.message : "Lecture T24 impossible."} La saisie manuelle reste possible.`,
      });
    } finally {
      setLectureT24(null);
    }
  };

  const rapatrierGroupe = async () => {
    const code = v.groupeCode.trim();
    if (!code) {
      setErreurs((e) => ({
        ...e,
        groupeCode: "Saisissez le code du groupe dans T24.",
      }));
      return;
    }
    setLectureT24("groupe");
    setRetourT24(null);
    try {
      const res = await apiGet(`/api/t24/groupes/${encodeURIComponent(code)}`);
      if (!res.ok)
        throw new Error(
          await messageErreurApi(res, "Lecture du groupe T24 impossible.")
        );
      const corps = await res.json();
      const nom: string | null = corps.existant?.nom ?? corps.data?.nom ?? null;
      if (nom) {
        setV((p) => ({ ...p, groupeNom: nom }));
        setChampsT24((p) => [...new Set([...p, "groupeCode", "groupeNom"])]);
        setImportT24(true);
      }
      setErreurs((e) => ({
        ...e,
        groupeCode: undefined,
        groupeNom: undefined,
      }));
      setRetourT24({
        type: corps.simulation ? "alerte" : "ok",
        texte: nom
          ? `Groupe « ${nom} » repris de T24${corps.simulation ? " (démonstration)" : ""}.`
          : "T24 ne renvoie pas le nom de ce groupe : saisissez-le.",
      });
    } catch (e) {
      setRetourT24({
        type: "erreur",
        texte: `${e instanceof Error ? e.message : "Lecture T24 impossible."} Saisissez le groupe manuellement.`,
      });
    } finally {
      setLectureT24(null);
    }
  };

  /** Choix d'un groupe déjà connu par son nom : son code suit. */
  const choisirGroupe = (nom: string) => {
    const connu = groupes.find((g) => g.nom === nom);
    setV((p) => ({
      ...p,
      groupeNom: nom,
      ...(connu ? { groupeCode: connu.code ?? "" } : {}),
    }));
    setChampsT24((p) =>
      p.filter((c) => c !== "groupeNom" && (!connu || c !== "groupeCode"))
    );
  };

  const soumettre = (e: React.FormEvent) => {
    e.preventDefault();
    const extras = {
      ...(champsT24Modifies || importT24 ? { champsT24 } : {}),
      ...(importT24 ? { importT24: true } : {}),
      ...(actionnairesModifies ? { actionnaires: chargeActionnaires } : {}),
    };
    const complet = {
      ...versPayloadClient(v),
      champsT24,
      ...(importT24 ? { importT24: true } : {}),
      actionnaires: chargeActionnaires,
    };
    // Le schéma Zod de l'API est aussi celui du formulaire : l'erreur s'affiche sous
    // le champ plutôt qu'en bandeau.
    const resultat = createClientSchema.safeParse(complet);
    if (!resultat.success) {
      const e2: Erreurs = {};
      const issueActionnaires = resultat.error.issues.find(
        (i) => i.path[0] === "actionnaires"
      );
      setErreurActionnaires(
        issueActionnaires
          ? typeof issueActionnaires.path[1] === "number"
            ? `Ligne ${issueActionnaires.path[1] + 1} : ${issueActionnaires.message}`
            : issueActionnaires.message
          : undefined
      );
      for (const issue of resultat.error.issues) {
        if (issue.path[0] === "actionnaires") continue;
        let champ = issue.path[0] as string;
        if (champ === "groupe")
          champ = issue.path[1] === "code" ? "groupeCode" : "groupeNom";
        if (champ && !e2[champ as Cle]) e2[champ as Cle] = issue.message;
      }
      setErreurs(e2);
      const premier =
        document.getElementById(`champ-${Object.keys(e2)[0]}`) ??
        (issueActionnaires
          ? document.getElementById("section-actionnaires")
          : null);
      premier?.scrollIntoView({ behavior: "smooth", block: "center" });
      premier?.focus({ preventScroll: true });
      return;
    }
    setErreurs({});
    setErreurActionnaires(undefined);
    // Le groupe part entier (code et nom) dès que l'un des deux change.
    const aEnvoyer: Partial<ValeursClient> = { ...modifies };
    if (GROUPE.some((g) => g in modifies)) {
      aEnvoyer.groupeCode = v.groupeCode;
      aEnvoyer.groupeNom = v.groupeNom;
    }
    onSubmit(complet, { ...versPayloadClient(aEnvoyer), ...extras });
  };

  const groupeConnu = groupes.find((g) => g.nom === v.groupeNom);

  return (
    <form onSubmit={soumettre} className="pb-20">
      {erreurGlobale && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreurGlobale}
        </div>
      )}

      <div className="space-y-4">
        <SectionCard
          titre="Identification"
          description="Code client T24 et identifiants légaux : rapprochement avec le système central et les registres."
        >
          {/* Rapatriement T24 : en tête, c'est le point de départ de la saisie. */}
          <div className="mb-4 rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <Champ
                  cle="codeClientT24"
                  libelle="Code client T24"
                  provenance={provenance("codeClientT24")}
                  valeur={v.codeClientT24}
                  onChange={(x) => {
                    set("codeClientT24")(x);
                    setErreurs((e) => ({ ...e, codeClientT24: undefined }));
                  }}
                  erreur={erreurs.codeClientT24}
                  placeholder="100234"
                />
              </div>
              {t24?.actif && (
                <button
                  type="button"
                  onClick={rapatrierClient}
                  disabled={lectureT24 !== null}
                  className="mb-[2px] inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {lectureT24 === "client" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={15} />
                  )}
                  {creation ? "Rapatrier depuis T24" : "Actualiser depuis T24"}
                </button>
              )}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted-foreground">
              <Info size={13} className="mt-[2px] shrink-0" />
              {t24 === null
                ? "Vérification du connecteur T24…"
                : t24.actif
                  ? t24.mode === "simulation"
                    ? "Connecteur T24 en mode simulation : les données rapatriées sont fictives."
                    : "Saisissez le code client puis rapatriez : identité, identifiants légaux, relation et groupe sont repris de T24. Le reste se complète à la main."
                  : `${t24.message ?? "Rapatriement T24 indisponible."} Le code client T24 peut tout de même être renseigné.`}
            </p>
            {retourT24 && (
              <div
                role="status"
                className={`mt-2 flex flex-wrap items-start gap-2 rounded-md px-3 py-2 text-[12.5px] ${
                  retourT24.type === "ok"
                    ? "bg-success-subtle text-success"
                    : retourT24.type === "alerte"
                      ? "bg-warning-subtle text-warning"
                      : "bg-destructive-subtle text-destructive"
                }`}
              >
                {retourT24.type === "ok" ? (
                  <CheckCircle2 size={14} className="mt-[2px] shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="mt-[2px] shrink-0" />
                )}
                <span className="flex-1">{retourT24.texte}</span>
                {retourT24.lien && (
                  <Link
                    href={retourT24.lien.href}
                    className="font-semibold underline"
                  >
                    {retourT24.lien.libelle}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {banques.length > 1 && (
              <label className="md:col-span-2 block text-sm font-medium text-foreground">
                Banque qui porte la relation
                <select
                  value={v.entiteId}
                  onChange={(e) =>
                    setV((p) => ({ ...p, entiteId: e.target.value }))
                  }
                  className="mt-1.5 h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
                >
                  <option value="">Ma banque</option>
                  {banques.map((b) => (
                    <option key={b.id} value={b.id}>
                      {"  ".repeat(
                        Math.max(
                          0,
                          b.niveau - Math.min(...banques.map((x) => x.niveau))
                        )
                      )}
                      {b.nom}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Le client et ses projets ne sont visibles que de cette banque
                  et de ses entités mères.
                </span>
              </label>
            )}
            <Champ
              cle="nom"
              libelle="Nom usuel"
              obligatoire
              provenance={provenance("nom")}
              aide="Le nom sous lequel la banque désigne le client au quotidien."
              valeur={v.nom}
              onChange={set("nom")}
              erreur={erreurs.nom}
              placeholder="Atlas Énergie Holding"
            />
            <Champ
              cle="raisonSociale"
              libelle="Raison sociale"
              provenance={provenance("raisonSociale")}
              aide="Dénomination exacte au registre du commerce."
              valeur={v.raisonSociale}
              onChange={set("raisonSociale")}
              erreur={erreurs.raisonSociale}
              placeholder="ATLAS ENERGIE HOLDING S.A."
            />
            <Selecteur
              cle="formeJuridique"
              libelle="Forme juridique"
              provenance={provenance("formeJuridique")}
              valeur={v.formeJuridique}
              onChange={set("formeJuridique")}
              options={options("formeJuridique")}
            />
            <Selecteur
              cle="typeClient"
              libelle="Type de contrepartie"
              valeur={v.typeClient}
              onChange={set("typeClient")}
              options={options("typeClient")}
            />
            <Champ
              cle="ice"
              libelle="ICE"
              provenance={provenance("ice")}
              aide="Identifiant Commun de l'Entreprise, 15 chiffres."
              valeur={v.ice}
              onChange={set("ice")}
              erreur={erreurs.ice}
              placeholder="001234567000089"
            />
            <Champ
              cle="registreCommerce"
              libelle="Registre du commerce"
              provenance={provenance("registreCommerce")}
              valeur={v.registreCommerce}
              onChange={set("registreCommerce")}
              erreur={erreurs.registreCommerce}
              placeholder="RC 123456 Casablanca"
            />
            <Champ
              cle="identifiantFiscal"
              libelle="Identifiant fiscal (IF)"
              provenance={provenance("identifiantFiscal")}
              valeur={v.identifiantFiscal}
              onChange={set("identifiantFiscal")}
              erreur={erreurs.identifiantFiscal}
            />
            <Champ
              cle="dateCreationSociete"
              libelle="Date de création"
              type="date"
              provenance={provenance("dateCreationSociete")}
              valeur={v.dateCreationSociete}
              onChange={set("dateCreationSociete")}
              erreur={erreurs.dateCreationSociete}
            />
            <Champ
              cle="pays"
              libelle="Pays de résidence"
              provenance={provenance("pays")}
              aide="Détermine le risque pays (Bank Al-Maghrib)."
              valeur={v.pays}
              onChange={set("pays")}
              erreur={erreurs.pays}
            />
            <Champ
              cle="ville"
              libelle="Ville du siège"
              provenance={provenance("ville")}
              valeur={v.ville}
              onChange={set("ville")}
              erreur={erreurs.ville}
              placeholder="Casablanca"
            />
            <div className="md:col-span-2">
              <Champ
                cle="adresse"
                libelle="Adresse du siège"
                provenance={provenance("adresse")}
                valeur={v.adresse}
                onChange={set("adresse")}
                erreur={erreurs.adresse}
              />
            </div>
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

        <SectionCard
          titre="Groupe d'affaires"
          description="Les engagements sur les sociétés d'un même groupe s'additionnent pour la division des risques ; le soutien du groupe pèse dans l'appréciation du sponsor."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Champ
                  cle="groupeCode"
                  libelle="Code groupe T24"
                  provenance={provenance("groupeCode")}
                  valeur={v.groupeCode}
                  onChange={(x) => {
                    set("groupeCode")(x);
                    setErreurs((e) => ({ ...e, groupeCode: undefined }));
                  }}
                  erreur={erreurs.groupeCode}
                />
              </div>
              {t24?.actif && (
                <button
                  type="button"
                  onClick={rapatrierGroupe}
                  disabled={lectureT24 !== null}
                  aria-label="Rapatrier le groupe depuis T24"
                  title="Rapatrier le groupe depuis T24"
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50 ${
                    erreurs.groupeCode ? "mb-[22px]" : "mb-[2px]"
                  }`}
                >
                  {lectureT24 === "groupe" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <DownloadCloud size={14} />
                  )}
                  T24
                </button>
              )}
            </div>
            <div>
              <SelecteurLibre
                cle="groupeNom"
                libelle="Nom du groupe"
                provenance={provenance("groupeNom")}
                valeur={v.groupeNom}
                onChange={choisirGroupe}
                options={groupes.map((g) => ({
                  valeur: g.nom,
                  libelle: `${g.code ? `${g.code} — ` : ""}${g.nbClients} société${g.nbClients > 1 ? "s" : ""}`,
                }))}
                aide={
                  erreurs.groupeNom ??
                  (v.groupeNom.trim() && !groupeConnu
                    ? "Nouveau groupe : il sera créé à l'enregistrement."
                    : "Vide si la contrepartie n'appartient à aucun groupe.")
                }
              />
            </div>
            <Selecteur
              cle="roleGroupe"
              libelle="Place dans le groupe"
              valeur={v.roleGroupe}
              onChange={set("roleGroupe")}
              options={options("roleGroupe")}
            />
          </div>
        </SectionCard>

        <SectionCard
          titre="Activité, solidité financière et expérience"
          description="Critères « sponsor » des grilles de financement spécialisé : capacité à soutenir le projet et savoir-faire dans le secteur."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelecteurLibre
              cle="secteur"
              libelle="Secteur d'activité"
              provenance={provenance("secteur")}
              valeur={v.secteur}
              onChange={set("secteur")}
              options={secteurs.map((s) => ({
                valeur: s.label,
                libelle: `${s.code} — ${s.label}`,
              }))}
              aide="Choisissez dans le référentiel : il sert au rapprochement sectoriel du moteur de notation."
            />
            <Selecteur
              cle="segmentClientele"
              libelle="Segment"
              valeur={v.segmentClientele}
              onChange={set("segmentClientele")}
              options={options("segmentClientele")}
            />
            <Champ
              cle="exerciceReference"
              libelle="Exercice de référence"
              type="number"
              valeur={v.exerciceReference}
              onChange={set("exerciceReference")}
              erreur={erreurs.exerciceReference}
              placeholder={String(new Date().getFullYear() - 1)}
              aide="Année des états financiers retenus ci-dessous."
            />
            <ChampMontant
              cle="chiffreAffaires"
              libelle="Chiffre d'affaires"
              provenance={provenance("chiffreAffaires")}
              valeur={v.chiffreAffaires}
              onChange={set("chiffreAffaires")}
              erreur={erreurs.chiffreAffaires}
            />
            <Champ
              cle="fondsPropres"
              libelle="Fonds propres (MAD)"
              type="number"
              provenance={provenance("fondsPropres")}
              valeur={v.fondsPropres}
              onChange={set("fondsPropres")}
              erreur={erreurs.fondsPropres}
              aide="Capacité à apporter et à soutenir les fonds propres du projet ; négatifs possibles."
            />
            <ChampMontant
              cle="capitalSocial"
              libelle="Capital social"
              provenance={provenance("capitalSocial")}
              valeur={v.capitalSocial}
              onChange={set("capitalSocial")}
              erreur={erreurs.capitalSocial}
            />
            <Champ
              cle="experienceSecteurAnnees"
              libelle="Expérience dans le secteur"
              type="number"
              suffixe="ans"
              valeur={v.experienceSecteurAnnees}
              onChange={set("experienceSecteurAnnees")}
              erreur={erreurs.experienceSecteurAnnees}
            />
            <Champ
              cle="projetsSimilaires"
              libelle="Projets comparables réalisés"
              type="number"
              valeur={v.projetsSimilaires}
              onChange={set("projetsSimilaires")}
              erreur={erreurs.projetsSimilaires}
              aide="Projets de taille et de technologie comparables développés ou exploités."
            />
          </div>
          <div className="mt-4">
            <Champ
              cle="description"
              libelle="Activité principale"
              multiligne
              valeur={v.description}
              onChange={set("description")}
              erreur={erreurs.description}
              placeholder="Métiers, actifs exploités, références, position sur le marché…"
            />
          </div>
        </SectionCard>

        <SectionCard
          titre="Notation et risque"
          description="Ces éléments conditionnent l'octroi et la tarification."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Selecteur
              cle="ratingInterne"
              libelle="Notation interne"
              provenance={provenance("ratingInterne")}
              valeur={v.ratingInterne}
              onChange={set("ratingInterne")}
              options={options("ratingInterne")}
            />
            <Selecteur
              cle="classificationBAM"
              libelle="Classification Bank Al-Maghrib"
              provenance={provenance("classificationBAM")}
              valeur={v.classificationBAM}
              onChange={set("classificationBAM")}
              options={options("classificationBAM")}
            />
            <Selecteur
              cle="agenceNotation"
              libelle="Agence de notation externe"
              valeur={v.agenceNotation}
              onChange={set("agenceNotation")}
              options={options("agenceNotation")}
            />
            <Champ
              cle="notationExterne"
              libelle="Notation externe"
              valeur={v.notationExterne}
              onChange={set("notationExterne")}
              erreur={erreurs.notationExterne}
              placeholder="BBB-"
            />
            <ChampMontant
              cle="exposition"
              libelle="Engagements actuels"
              provenance={provenance("exposition")}
              valeur={v.exposition}
              onChange={set("exposition")}
              erreur={erreurs.exposition}
              aide="Encours bilan et hors bilan de la contrepartie dans la banque."
            />
          </div>
        </SectionCard>

        <SectionCard titre="Relation bancaire">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelecteurLibre
              cle="gestionnaire"
              libelle="Chargé d'affaires"
              provenance={provenance("gestionnaire")}
              valeur={v.gestionnaire}
              onChange={set("gestionnaire")}
              options={gestionnaires.map((g) => ({ valeur: g, libelle: g }))}
            />
            <Champ
              cle="centreAffaires"
              libelle="Centre d'affaires"
              provenance={provenance("centreAffaires")}
              valeur={v.centreAffaires}
              onChange={set("centreAffaires")}
              erreur={erreurs.centreAffaires}
              placeholder="Casablanca Grandes Entreprises"
            />
            <Champ
              cle="dateRelation"
              libelle="Entrée en relation"
              type="date"
              provenance={provenance("dateRelation")}
              valeur={v.dateRelation}
              onChange={set("dateRelation")}
              erreur={erreurs.dateRelation}
            />
            <Selecteur
              cle="statutBancaire"
              libelle="Statut de la relation"
              valeur={v.statutBancaire}
              onChange={set("statutBancaire")}
              options={options("statutBancaire")}
            />
            <Selecteur
              cle="status"
              libelle="Statut de la fiche"
              valeur={v.status}
              onChange={set("status")}
              options={options("status")}
              sansVide
            />
          </div>
        </SectionCard>

        <SectionCard
          titre="Conformité LBC/FT"
          description="Connaissance du client et approche par les risques : un dossier non conforme ne peut pas être engagé."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Selecteur
              cle="statusKYC"
              libelle="KYC"
              provenance={provenance("statusKYC")}
              valeur={v.statusKYC}
              onChange={set("statusKYC")}
              options={options("statusKYC")}
            />
            <Champ
              cle="dateRevueKYC"
              libelle="Dernière revue KYC"
              type="date"
              valeur={v.dateRevueKYC}
              onChange={set("dateRevueKYC")}
              erreur={erreurs.dateRevueKYC}
            />
            <Selecteur
              cle="niveauRisqueLBC"
              libelle="Niveau de risque LBC/FT"
              provenance={provenance("niveauRisqueLBC")}
              valeur={v.niveauRisqueLBC}
              onChange={set("niveauRisqueLBC")}
              options={options("niveauRisqueLBC")}
            />
            <Selecteur
              cle="ppe"
              libelle="Personne politiquement exposée"
              valeur={v.ppe}
              onChange={set("ppe")}
              options={[
                { valeur: "non", libelle: "Non" },
                {
                  valeur: "oui",
                  libelle: "Oui",
                  aide: "Un dirigeant ou un bénéficiaire effectif est PPE : vigilance renforcée.",
                },
              ]}
              aide={
                actionnairePPE && v.ppe !== "oui"
                  ? "Un actionnaire ou dirigeant déclaré PPE : la contrepartie relève de la vigilance renforcée."
                  : "Dirigeants et bénéficiaires effectifs."
              }
            />
            <Selecteur
              cle="statusConformite"
              libelle="Filtrage sanctions et conformité"
              valeur={v.statusConformite}
              onChange={set("statusConformite")}
              options={options("statusConformite")}
            />
          </div>
        </SectionCard>

        <div id="section-actionnaires" tabIndex={-1}>
          <SectionCard
            titre="Actionnariat et bénéficiaires effectifs"
            description="Qui détient et qui contrôle la contrepartie : connaissance du client (LBC/FT) et appréciation du sponsor."
          >
            <ActionnairesEditeur
              lignes={actionnaires}
              onChange={(l) => {
                setActionnaires(l);
                setErreurActionnaires(undefined);
              }}
              erreur={erreurActionnaires}
            />
          </SectionCard>
        </div>

        <SectionCard titre="Contact">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Champ
              cle="telephone"
              libelle="Téléphone"
              provenance={provenance("telephone")}
              valeur={v.telephone}
              onChange={set("telephone")}
              erreur={erreurs.telephone}
              placeholder="+212 5 22 00 00 00"
            />
            <Champ
              cle="email"
              libelle="Courriel"
              type="email"
              provenance={provenance("email")}
              valeur={v.email}
              onChange={set("email")}
              erreur={erreurs.email}
              placeholder="financement@exemple.ma"
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
