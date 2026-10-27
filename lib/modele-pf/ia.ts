/**
 * Lecture des pièces par l'IA, étendue aux treize blocs du modèle Project Finance.
 *
 * Les champs du fichier d'échange (champs-ia.ts) deviennent des « critères » pour le
 * service d'analyse commun (lib/services/ia-documents/analyse.ts) : mêmes consignes de
 * contrôle des pièces, de citation des sources et d'interdiction d'inventer. Les listes
 * (emplois, ressources, hypothèses, échéancier) sont demandées d'un bloc, une ligne par
 * élément, puis éclatées en champs. Chaque proposition est revérifiée (normaliser) :
 * l'IA ne peut pas introduire une valeur que l'écran de saisie refuserait.
 */
import type { CritereGrille, ResultatAnalyse, CritereExtrait } from "@/lib/services/ia-documents/resultat";
import { situations, type SaisiePF } from "./saisie";
import {
  champ, libelleChamp, lireChamp, normaliser, afficherValeur, tousLesChamps,
  NB_EMPLOIS, NB_RESSOURCES, NB_HYPOTHESES, NB_ECHEANCES, type ValeurChamp,
} from "./champs-ia";
import { champsSecteur } from "./referentiel";

export type Confiance = "elevee" | "moyenne" | "faible";

export interface PropositionPF {
  cle: string;
  libelle: string;
  bloc: number;
  valeur: ValeurChamp;
  affichage: string;
  /** Valeur de la saisie au moment de l'analyse. */
  actuelle: string | null;
  source: string;
  confiance: Confiance;
  statut: "trouve" | "partiel";
  justification: string;
  decision: "en_attente" | "acceptee" | "rejetee";
  decidePar?: string;
  decideLe?: string;
}

export interface ManquantPF { cle: string; libelle: string; bloc: number; documentAttendu: string | null; motif: string }

export interface AnalysePF {
  date: string;
  auteur: string;
  modele: string;
  usage: { entree: number; sortie: number };
  pieces: { id: string; nom: string }[];
  avertissements: string[];
  synthese: string;
  documents: ResultatAnalyse["documents"];
  questions: ResultatAnalyse["questions"];
  propositions: PropositionPF[];
  manquants: ManquantPF[];
}

/** Critères « liste » : un texte, une ligne par élément, champs séparés par « ; ». */
const LISTES: Record<string, { libelle: string; bloc: number; format: string; max: number }> = {
  "liste.emplois": { libelle: "Emplois du plan de financement (besoin à terminaison)", bloc: 3, format: "libellé ; montant en MMAD", max: NB_EMPLOIS },
  "liste.ressources": { libelle: "Ressources engagées du plan de financement", bloc: 3, max: NB_RESSOURCES,
    format: "libellé ; montant en MMAD ; nature parmi Dette senior, Dette subordonnée, Fonds propres, Quasi-fonds propres, Engagement sponsor, Ligne dédiée engagée, Subvention encaissée, Autre ressource" },
  "liste.hypotheses": { libelle: "Hypothèses d'exploitation clés du modèle financier", bloc: 5, format: "hypothèse ; valeur retenue", max: NB_HYPOTHESES },
  "liste.echeancier": { libelle: "Échéancier de la dette : CFADS et service de la dette par période", bloc: 6, max: NB_ECHEANCES,
    format: "période (ex. S1 2028) ; CFADS du cas central en MMAD ; service de la dette en MMAD ; CFADS du cas défavorable en MMAD si le modèle le donne" },
};

/**
 * Champs que l'IA ne propose pas : avis et justification des écarts (appréciation propre de
 * l'analyste), ou champs déduits d'une autre réponse (lignes des listes, commentaire d'un
 * sous-critère, justification de N4 à N6, source d'une donnée sectorielle).
 */
const EXCLUS = /^(emploi|ressource|hypothese|echeance)\.|^D\d\.\d\.commentaire$|\.justification$|^secteur\.\d+\.source$|^climat\.alea\.[a-z]+\.source$|^bloc13\.(avis|avis\.motif|justif)$/;

/** Consignes propres à certains champs. */
const CONSIGNES: Record<string, string> = {
  choc: "Baisse du CFADS dans le scénario défavorable, en fraction (0,14 pour 14 %). Si le modèle financier ou le rapport des prêteurs donne un cas défavorable, calcule (CFADS central − CFADS défavorable) ÷ CFADS central sur une année type. Sinon, à partir des hypothèses défavorables documentées (P90 de l'étude de productible, cas bas de l'étude de trafic ou de marché, hausse de charges…) : (recettes perdues + charges supplémentaires) ÷ CFADS central. Indique le calcul et les pièces dans la justification.",
  "climat.localisation": "Commune, province ou coordonnées géographiques du site du projet.",
  "climat.emissions": "Émissions annuelles du projet en exploitation, scopes 1 et 2, en tCO₂e par an, telles que l'étude d'impact, le bilan carbone ou le rapport des bailleurs les donne.",
  "climat.export_macf": "Part du chiffre d'affaires exportée vers l'Union européenne en produits couverts par le mécanisme d'ajustement carbone aux frontières (ciment, fer et acier, aluminium, engrais, hydrogène, électricité), en fraction ; 0 si le projet n'en exporte pas.",
  "climat.actif_fossile": "Oui si la production, le combustible ou le procédé principal du projet dépend des énergies fossiles (charbon, fioul, gaz).",
  "climat.plan_transition": "Oui si un plan de réduction des émissions ou de sortie des énergies fossiles est documenté, daté et financé.",
  "climat.choc": "Baisse du CFADS sous un scénario climatique plausible pour ce site (canicule, sécheresse, crue, tempête, prix du carbone), en fraction. Calcule (recettes perdues + charges supplémentaires) ÷ CFADS central à partir des effets chiffrés dans les pièces ; indique le calcul et les pièces dans la justification.",
  "climat.choc.description": "Scénario climatique en une phrase : l'aléa retenu et ses effets chiffrés sur les recettes et les charges, tels que les pièces les donnent.",
  "choc.description": "Scénario défavorable en une phrase : le risque principal du projet et les hypothèses chiffrées retenues (ex. « Production P90 (− 8 %) et charges + 10 % »), tels que les pièces les donnent.",
};

const consigneDe = (cle: string): string | undefined =>
  CONSIGNES[cle]
  ?? (/^climat\.alea\.[a-z]+\.niveau$/.test(cle) ? "Niveau d'exposition du site à cet aléa d'après les pièces (étude d'impact, étude climat, rapport du conseiller technique, cartes d'aléas citées) : Faible, Moyen ou Élevé. « absent » si aucune pièce ne l'analyse."
    : /^climat\.alea\.[a-z]+\.adaptation$/.test(cle) ? "Oui si des mesures d'adaptation à cet aléa sont prévues et financées dans le budget du projet (digue, surélévation, refroidissement, irrigation, stockage d'eau…) ; Non si l'aléa est identifié sans mesure financée."
    : undefined);

/** Critères transmis à l'IA pour ce dossier. */
export function criteresIA(s: SaisiePF): CritereGrille[] {
  const champsSect = champsSecteur(s.secteur);
  const criteres: CritereGrille[] = [];
  for (const c of tousLesChamps()) {
    if (EXCLUS.test(c.cle)) continue;
    const m = c.cle.match(/^secteur\.(\d+)\.valeur$/);
    if (m && !champsSect[Number(m[1]) - 1]) continue;
    const consigne = consigneDe(c.cle);
    const base = { id: c.cle, code: c.cle, label: libelleChamp(c.cle, s), ...(consigne && { description: consigne }) };
    if (c.type === "situation") {
      const opts = situations(c.cle, s.secteur);
      criteres.push({ ...base, options: opts.map((o) => { const [v, ...d] = o.split(" — "); return { value: v, label: d.join(" — ") || v }; }),
        description: "Choisis la situation décrite qui correspond aux pièces ; « Info. insuffisante » si elles ne permettent pas de trancher. Justifie avec les faits constatés." });
    } else if (c.type === "ouinon" || c.type === "liste") {
      criteres.push({ ...base, options: c.valeurs!.map((v) => ({ value: v, label: v })),
        // Sans repère, l'IA répondait « absent » : la note manquait, la complétude tombait sous 100 %
        // et le dossier se retrouvait plafonné (B7, C15) alors que le LLCR figurait dans les pièces.
        ...(c.cle === "n3_llcr" && { description: "Note du LLCR hors phase de construction : celle retenue par l'analyse des prêteurs si une pièce la donne ; sinon 100 si le LLCR dépasse nettement le seuil DSCR favorable du dossier, 80 s'il le dépasse, 50 s'il se situe entre les seuils critique et favorable, 20 s'il est sous le seuil critique. « Info. insuffisante » si le LLCR n'est pas donné." }) });
    } else if (c.type === "nombre" || c.type === "pourcentage") {
      criteres.push({ ...base, answerType: "NUMERIC",
        description: consigne ?? (c.type === "pourcentage" ? "Pourcentage exprimé en fraction (0,15 pour 15 %)." : c.libelle.includes("MMAD") ? "Montant en millions de dirhams (MMAD)." : undefined) });
    } else if (/^D\d\.commentaire$/.test(c.cle)) {
      criteres.push({ ...base, answerType: "TEXT",
        description: "Commentaire de synthèse du domaine pour le comité : faits constatés dans les pièces, points forts et points de vigilance, pièces citées. Trois à cinq phrases ; « absent » si les pièces ne couvrent pas le domaine." });
    } else {
      criteres.push({ ...base, answerType: "TEXT" });
    }
  }
  for (const [code, l] of Object.entries(LISTES)) {
    criteres.push({ id: code, code, label: l.libelle, answerType: "TEXT",
      description: `Réponds dans valeurTexte, une ligne par élément (${l.max} au plus), au format : ${l.format}. Nombres sans séparateur de milliers, virgule ou point décimal.` });
  }
  return criteres;
}

const sourceDe = (e: CritereExtrait) =>
  e.sources.slice(0, 3).map((x) => `${x.document}${x.localisation ? `, ${x.localisation}` : ""}`).join(" ; ").slice(0, 500);

/** Traduit les extractions de l'IA en propositions vérifiées et en informations manquantes. */
export function construirePropositionsPF(resultat: ResultatAnalyse, s: SaisiePF, criteres: CritereGrille[]): { propositions: PropositionPF[]; manquants: ManquantPF[] } {
  const parCode = new Map(resultat.criteres.map((c) => [c.code.trim(), c]));
  const propositions: PropositionPF[] = [];
  const manquants: ManquantPF[] = [];
  const blocDe = (cle: string) => champ(cle)?.bloc ?? LISTES[cle]?.bloc ?? 0;

  const proposer = (cle: string, brute: unknown, e: CritereExtrait): string | null => {
    const v = normaliser(cle, brute);
    if (!v.ok) return v.motif;
    const actuelle = lireChamp(s, cle);
    if (actuelle !== null && String(actuelle) === String(v.valeur)) return null; // déjà saisi à l'identique
    propositions.push({
      cle, libelle: libelleChamp(cle, s), bloc: blocDe(cle), valeur: v.valeur, affichage: afficherValeur(cle, v.valeur),
      actuelle: actuelle === null ? null : afficherValeur(cle, actuelle), source: sourceDe(e), confiance: e.confiance,
      statut: e.statut === "partiel" ? "partiel" : "trouve", justification: e.justification.slice(0, 2000), decision: "en_attente",
    });
    return null;
  };

  for (const g of criteres) {
    const e = parCode.get(g.code);
    const manque = (motif: string) => manquants.push({ cle: g.code, libelle: g.label, bloc: blocDe(g.code), documentAttendu: e?.documentAttendu ?? null, motif });
    if (!e || e.statut === "absent") { manque(e?.justification || "Information non trouvée dans les pièces fournies."); continue; }

    const liste = LISTES[g.code];
    if (liste) {
      const lignes = (e.valeurTexte ?? "").split(/\r?\n/).map((l) => l.split(";").map((x) => x.trim())).filter((l) => l.some(Boolean)).slice(0, liste.max);
      if (!lignes.length) { manque(`Aucune ligne exploitable. ${e.justification}`); continue; }
      const motifs: string[] = [];
      lignes.forEach((l, i) => {
        const n = i + 1;
        const champs: [string, string | undefined][] =
          g.code === "liste.emplois" ? [[`emploi.${n}.libelle`, l[0]], [`emploi.${n}.montant`, l[1]]]
          : g.code === "liste.ressources" ? [[`ressource.${n}.libelle`, l[0]], [`ressource.${n}.montant`, l[1]], [`ressource.${n}.nature`, l[2]]]
          : g.code === "liste.hypotheses" ? [[`hypothese.${n}.libelle`, l[0]], [`hypothese.${n}.valeur`, l[1]]]
          : [[`echeance.${n}.libelle`, l[0]], [`echeance.${n}.cfads`, l[1]], [`echeance.${n}.service`, l[2]], [`echeance.${n}.cfads_stresse`, l[3]]];
        for (const [cle, brute] of champs) {
          if (brute === undefined || brute === "") continue;
          const motif = proposer(cle, brute, e);
          if (motif) motifs.push(`ligne ${n} (${champ(cle)?.libelle ?? cle}) : ${motif}`);
        }
      });
      if (motifs.length) manque(`Lignes en partie rejetées — ${motifs.slice(0, 5).join(" ; ")}`);
      continue;
    }

    const c = champ(g.code);
    const brute = c?.type === "nombre" || c?.type === "pourcentage" ? e.valeurNombre
      : c?.type === "texte" ? (g.code.match(/^secteur\.\d+\.valeur$/) && e.valeurNombre !== null ? e.valeurNombre : e.valeurTexte)
      : e.optionChoisie ?? e.valeurTexte;
    const motif = proposer(g.code, brute, e);
    if (motif) { manque(`Réponse « ${brute ?? "—"} » refusée : ${motif}. ${e.justification}`.slice(0, 1000)); continue; }

    // Réponses déduites : commentaire du sous-critère, justification de N4 à N6, source d'une donnée sectorielle.
    if (c?.type === "situation" && e.justification.trim()) {
      const cible = /^N[4-6]$/.test(g.code) ? `${g.code}.justification` : `${g.code}.commentaire`;
      const src = sourceDe(e);
      proposer(cible, `${e.justification.trim()}${src ? ` (source : ${src})` : ""}`, e);
    }
    const sec = g.code.match(/^secteur\.(\d+)\.valeur$/);
    if (sec && sourceDe(e)) proposer(`secteur.${sec[1]}.source`, sourceDe(e), e);
    const alea = g.code.match(/^climat\.alea\.([a-z]+)\.niveau$/);
    if (alea && sourceDe(e)) proposer(`climat.alea.${alea[1]}.source`, sourceDe(e), e);
  }
  return { propositions, manquants };
}

/** Contexte transmis à l'IA : le projet et ce que la saisie a déjà établi. */
export function contexteDossier(projet: Record<string, unknown>, s: SaisiePF): string {
  const l = (k: string, v: unknown) => (v === null || v === undefined || String(v).trim() === "" ? null : `${k} : ${String(v).slice(0, 800)}`);
  return [
    l("Projet", projet.nom), l("Description", projet.description), l("SPV", projet.nomSPV), l("Sponsor principal", projet.sponsorPrincipal),
    l("Constructeur EPC", projet.constructeurEPC), l("Opérateur O&M", projet.operateurOM), l("Technologie", projet.technologie),
    l("Régime de revenus déjà saisi", s.regime), l("Secteur déjà saisi", s.secteur), l("Phase déjà saisie", s.phase),
    "Unités attendues : montants en millions de dirhams (MMAD), durées en années, pourcentages en fraction (0,15 = 15 %).",
    "Modèle Project Finance de la banque : régimes R1 (take-or-pay), R2 (disponibilité), R3 (risque de volume), R4 (marché) ; phases P1 construction, P2 montée en charge, P3 exploitation stabilisée.",
  ].filter(Boolean).join("\n");
}
