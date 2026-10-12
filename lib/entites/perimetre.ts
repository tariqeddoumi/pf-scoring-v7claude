/**
 * Périmètre multi-banques.
 *
 * Les entités (groupe, banque, banque régionale, filiale…) forment un arbre de
 * profondeur quelconque. Règles, conformes au cloisonnement attendu d'un groupe
 * bancaire (une filiale ne voit ni sa maison mère ni ses sœurs) :
 * - LECTURE : un utilisateur voit les dossiers de son entité et de toute sa
 *   descendance (la maison mère consulte ses filiales, jamais l'inverse) ;
 * - ÉCRITURE : par défaut, sur sa seule entité (les filiales sont en consultation) ;
 *   avec la portée « groupe » (chargé d'affaires grands comptes, par exemple), sur
 *   toute sa descendance ;
 * - un administrateur système sans entité administre toute la plateforme ; tout
 *   autre compte sans entité (inscription, connexion Google…) ne voit rien tant
 *   qu'un administrateur ne l'a pas rattaché à une banque (sécurité par défaut).
 * Une entité désactivée ferme l'accès de ses utilisateurs, sans masquer ses dossiers
 * aux entités ascendantes.
 */

export interface EntiteResume {
  id: string;
  code: string;
  nom: string;
  type: string;
  parentId: string | null;
  chemin: string;
  niveau: number;
  pays: string | null;
  isActive: boolean;
  nomOutil: string | null;
  logoUrl: string | null;
  couleurPrimaire: string | null;
}

export type PorteeEcriture = "entite" | "groupe";

export interface Perimetre {
  /** Tout le périmètre : aucun filtre. */
  tout: boolean;
  /** Entité de rattachement (null si tout le périmètre). */
  entiteId: string | null;
  /** Entités dont les dossiers sont visibles. */
  lecture: string[];
  /** Entités où l'utilisateur peut créer et modifier. */
  ecriture: string[];
}

export const PERIMETRE_TOTAL: Perimetre = { tout: true, entiteId: null, lecture: [], ecriture: [] };
export const PERIMETRE_VIDE: Perimetre = { tout: false, entiteId: null, lecture: [], ecriture: [] };

/** Chemin matérialisé d'une entité : celui de son parent suivi de son identifiant. */
export function cheminDe(id: string, cheminParent: string | null): string {
  return `${cheminParent ?? "/"}${id}/`;
}

/** L'entité et toute sa descendance (identifiants). */
export function descendance(arbre: EntiteResume[], id: string): string[] {
  const racine = arbre.find((e) => e.id === id);
  if (!racine) return [];
  return arbre.filter((e) => e.chemin.startsWith(racine.chemin)).map((e) => e.id);
}

/** De l'entité jusqu'à la racine (l'entité d'abord). */
export function ascendance(arbre: EntiteResume[], id: string): EntiteResume[] {
  const parId = new Map(arbre.map((e) => [e.id, e]));
  const chaine: EntiteResume[] = [];
  let courant = parId.get(id);
  const vus = new Set<string>();
  while (courant && !vus.has(courant.id)) {
    vus.add(courant.id);
    chaine.push(courant);
    courant = courant.parentId ? parId.get(courant.parentId) : undefined;
  }
  return chaine;
}

export function calculerPerimetre(
  arbre: EntiteResume[],
  compte: { entiteId: string | null; porteeEcriture?: string | null; role?: string | null }
): Perimetre {
  if (!compte.entiteId) return compte.role === "system_admin" ? PERIMETRE_TOTAL : PERIMETRE_VIDE;
  // Entité inconnue ou désactivée (elle ou une ascendante) : aucun accès.
  const chaine = ascendance(arbre, compte.entiteId);
  if (chaine.length === 0 || chaine.some((e) => !e.isActive)) {
    return { ...PERIMETRE_VIDE, entiteId: compte.entiteId };
  }
  const lecture = descendance(arbre, compte.entiteId);
  const ecriture = compte.porteeEcriture === "groupe" ? lecture : [compte.entiteId];
  return { tout: false, entiteId: compte.entiteId, lecture, ecriture };
}

export function peutLire(p: Perimetre, entiteId: string | null | undefined): boolean {
  if (p.tout) return true;
  return Boolean(entiteId) && p.lecture.includes(entiteId!);
}

export function peutEcrire(p: Perimetre, entiteId: string | null | undefined): boolean {
  if (p.tout) return true;
  return Boolean(entiteId) && p.ecriture.includes(entiteId!);
}

/**
 * Habillage d'une entité : pour chaque élément, la première valeur renseignée en
 * remontant vers la racine. Ce qui reste vide vient du paramétrage général.
 */
export function habillageHerite(
  arbre: EntiteResume[],
  entiteId: string | null
): { nomOutil: string | null; logoUrl: string | null; couleurPrimaire: string | null; entite: string | null } {
  const chaine = entiteId ? ascendance(arbre, entiteId) : [];
  const premier = (cle: "nomOutil" | "logoUrl" | "couleurPrimaire") =>
    chaine.map((e) => e[cle]).find((v) => v && v.trim()) ?? null;
  return {
    nomOutil: premier("nomOutil"),
    logoUrl: premier("logoUrl"),
    couleurPrimaire: premier("couleurPrimaire"),
    entite: chaine[0]?.nom ?? null,
  };
}

// ─── Arbre en mémoire (30 s), comme l'état des comptes ───────────────────────

const DUREE_CACHE_MS = 30_000;
let cache: { arbre: EntiteResume[]; expire: number } | null = null;

export async function chargerArbre(): Promise<EntiteResume[]> {
  if (cache && cache.expire > Date.now()) return cache.arbre;
  const { prismaSysteme } = await import("@/lib/prisma-client");
  const arbre = await prismaSysteme.entite.findMany({
    orderBy: [{ niveau: "asc" }, { nom: "asc" }],
    select: {
      id: true, code: true, nom: true, type: true, parentId: true, chemin: true, niveau: true,
      pays: true, isActive: true, nomOutil: true, logoUrl: true, couleurPrimaire: true,
    },
  });
  cache = { arbre, expire: Date.now() + DUREE_CACHE_MS };
  return arbre;
}

/** À appeler après toute modification de l'arbre. */
export function oublierArbre(): void {
  cache = null;
}
