/**
 * Enregistrement d'une fiche client : conversion de la saisie validée (Zod) en données
 * Prisma, partagée par la création et la modification.
 *
 * - Dates saisies (AAAA-MM-JJ) converties en Date ; une valeur vide efface.
 * - Groupe d'affaires : retrouvé par son code T24 (sinon par son nom) dans le
 *   périmètre, créé dans la banque du client s'il est nouveau.
 * - Provenance : la liste des champs repris de T24 et non retouchés détermine
 *   sourceDonnees (T24 ou MANUELLE) ; la date de synchronisation n'est posée que
 *   par un rapatriement effectif.
 */

import { Prisma } from "@prisma/client";
import type { UpdateClientInput } from "@/lib/validation-schemas";

const DATES = ["dateRelation", "dateCreationSociete", "dateRevueKYC"] as const;

export interface AccesGroupes {
  groupeAffaires: {
    findFirst(args: {
      where: Prisma.GroupeAffairesWhereInput;
      select: { id: true };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: Prisma.GroupeAffairesUncheckedCreateInput;
      select: { id: true };
    }): Promise<{ id: string }>;
  };
}

/** Données Prisma d'une saisie client (hors groupe, résolu à part). */
export function donneesClient(
  saisie: UpdateClientInput
): Record<string, unknown> {
  const { importT24, champsT24, status, ...reste } = saisie;
  const data: Record<string, unknown> = { ...reste };
  // Le groupe est résolu à part ; l'entité ne change que par un transfert explicite.
  delete data.groupe;
  delete data.entiteId;
  for (const champ of DATES) {
    const v = saisie[champ];
    if (v !== undefined) data[champ] = v ? new Date(v) : null;
  }
  // status n'est pas nullable : une valeur vide ne l'efface pas.
  if (status) data.status = status;
  if (champsT24 !== undefined) {
    const liste = [...new Set(champsT24 ?? [])];
    data.champsT24 = liste.length > 0 ? liste : Prisma.DbNull;
    data.sourceDonnees = liste.length > 0 ? "T24" : "MANUELLE";
  }
  if (importT24) data.dateSynchroT24 = new Date();
  return data;
}

/**
 * Identifiant du groupe d'affaires désigné par la saisie (undefined : inchangé,
 * null : détaché).
 */
export async function resoudreGroupe(
  db: AccesGroupes,
  groupe: UpdateClientInput["groupe"],
  options: { entiteId?: string | null; depuisT24?: boolean }
): Promise<string | null | undefined> {
  if (groupe === undefined) return undefined;
  if (groupe === null) return null;
  const code = groupe.code?.trim() || null;
  const nom = groupe.nom.trim();
  const dansEntite = options.entiteId ? { entiteId: options.entiteId } : {};

  const existant =
    (code &&
      ((await db.groupeAffaires.findFirst({
        where: { code, ...dansEntite },
        select: { id: true },
      })) ??
        (await db.groupeAffaires.findFirst({
          where: { code },
          select: { id: true },
        })))) ||
    (!code &&
      (await db.groupeAffaires.findFirst({
        where: { nom: { equals: nom, mode: "insensitive" }, ...dansEntite },
        select: { id: true },
      })));
  if (existant) return existant.id;

  const cree = await db.groupeAffaires.create({
    data: {
      code,
      nom,
      // Entité absente : celle de l'utilisateur, posée par le client de base de données.
      ...(options.entiteId ? { entiteId: options.entiteId } : {}),
      sourceDonnees: options.depuisT24 && code ? "T24" : "MANUELLE",
      dateSynchroT24: options.depuisT24 && code ? new Date() : null,
    },
    select: { id: true },
  });
  return cree.id;
}

/** Message d'un conflit d'unicité (code T24 ou courriel déjà attribués), sinon null. */
export function messageConflit(e: unknown): string | null {
  if (
    !(e instanceof Prisma.PrismaClientKnownRequestError) ||
    e.code !== "P2002"
  )
    return null;
  const cible = JSON.stringify(e.meta?.target ?? "");
  if (cible.includes("codeClientT24"))
    return "Ce code client T24 est déjà attribué à une autre fiche.";
  if (cible.includes("email"))
    return "Ce courriel est déjà utilisé par une autre fiche client.";
  return "Une fiche portant ces identifiants existe déjà.";
}
