import { champCondition } from "./condition-context";

/**
 * Mise en phrase d'une condition de règle.
 *
 * Les écrans mettaient en avant l'expression brute — « criteres.D7_SC3_SSC1.valeur <
 * 1.10 », « !criteres.D9_SC1_SSC1.repondu » — c'est-à-dire la seule forme que le
 * moteur comprenne, mais pas celle qu'un responsable des risques peut relire. Il ne
 * pouvait donc pas vérifier qu'une règle dit bien ce que la doctrine de la banque
 * demande, ce qui est pourtant le sens de cet écran.
 *
 * La mise en phrase est un confort de lecture : l'expression reste la référence, et
 * elle est affichée à côté. Une expression que ce module ne sait pas traduire est
 * rendue telle quelle plutôt que déformée.
 */

/**
 * Formulations invariables : le sujet de la phrase peut être masculin ou féminin
 * (« le score », « la valeur saisie »), et « inférieur » se serait accordé de travers
 * une fois sur deux.
 */
const OPERATEURS: Record<string, string> = {
  ">=": "atteint au moins",
  "<=": "ne dépasse pas",
  "!=": "ne vaut pas",
  "==": "vaut",
  "===": "vaut",
  ">": "dépasse",
  "<": "est en dessous de",
};

/** Suffixes des références à un critère : criteres.<CODE>.<suffixe>. */
const SUFFIXES_CRITERE: Record<string, string> = {
  valeur: "la valeur saisie pour",
  score: "le score de",
  repondu: "la réponse à",
  option: "l'option retenue pour",
};

const nombreFr = (v: string) => v.replace(".", ",");

/** Libellé d'un chemin de champ, du catalogue ou déduit d'une référence de critère. */
export function libelleChamp(
  chemin: string,
  libelleCritere?: (code: string) => string | undefined
): string {
  const connu = champCondition(chemin);
  if (connu) return connu.label.toLowerCase();

  const morceaux = chemin.split(".");
  if (morceaux[0] === "criteres" && morceaux.length >= 2) {
    const code = morceaux[1];
    const suffixe = morceaux[2] ?? "valeur";
    const nom = libelleCritere?.(code);
    const prefixe = SUFFIXES_CRITERE[suffixe] ?? `${suffixe} de`;
    return `${prefixe} ${nom ? `« ${nom} »` : code}`;
  }
  return chemin;
}

/**
 * Traduit une condition simple en français. Les formes reconnues sont la comparaison
 * (« a.b < 1.10 »), la négation d'un champ booléen (« !a.b »), le champ booléen seul
 * et leurs combinaisons par ET/OU.
 */
export function conditionEnFrancais(
  expression: string | null | undefined,
  libelleCritere?: (code: string) => string | undefined
): string | null {
  const brut = (expression ?? "").trim();
  if (!brut) return null;
  if (brut.toLowerCase() === "true") return "toujours vraie — s'applique à tous les dossiers";
  if (brut.toLowerCase() === "false") return "jamais vraie — ne s'applique à aucun dossier";

  // Découpage sur les connecteurs de premier niveau, parenthèses exclues : au-delà,
  // la phrase serait moins claire que l'expression et on renonce.
  if (/[()]/.test(brut)) return null;

  const morceaux = brut.split(/\s*(&&|\|\|)\s*/);
  const parties: string[] = [];
  for (let i = 0; i < morceaux.length; i += 2) {
    const terme = traduireTerme(morceaux[i], libelleCritere);
    if (!terme) return null;
    if (i > 0) parties.push(morceaux[i - 1] === "&&" ? "et" : "ou");
    parties.push(terme);
  }
  return parties.join(" ");
}

function traduireTerme(
  terme: string,
  libelleCritere?: (code: string) => string | undefined
): string | null {
  const t = terme.trim();
  if (!t) return null;

  const comparaison = t.match(
    /^([A-Za-z_][\w.]*)\s*(>=|<=|!==|!=|===|==|>|<)\s*(.+)$/
  );
  if (comparaison) {
    const [, chemin, operateur, valeurBrute] = comparaison;
    const operateurLisible = OPERATEURS[operateur === "!==" ? "!=" : operateur] ?? operateur;
    const valeur = valeurBrute.trim().replace(/^['"]|['"]$/g, "");
    const champ = champCondition(chemin);
    const unite = champ?.type === "pourcentage" ? " %" : "";
    return `${libelleChamp(chemin, libelleCritere)} ${operateurLisible} ${nombreFr(valeur)}${unite}`;
  }

  const negation = t.match(/^!\s*([A-Za-z_][\w.]*)$/);
  if (negation) {
    const chemin = negation[1];
    if (chemin.endsWith(".repondu")) {
      return `${libelleChamp(chemin, libelleCritere)} est absente`;
    }
    return `${libelleChamp(chemin, libelleCritere)} est faux`;
  }

  if (/^[A-Za-z_][\w.]*$/.test(t)) {
    if (t.endsWith(".repondu")) return `${libelleChamp(t, libelleCritere)} est renseignée`;
    return `${libelleChamp(t, libelleCritere)} est vrai`;
  }

  return null;
}
