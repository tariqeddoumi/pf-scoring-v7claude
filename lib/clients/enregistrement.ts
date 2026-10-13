/**
 * Enregistrement d'une fiche client : conversion de la saisie validée (Zod) en données
 * Prisma, partagée par la création et la modification.
 *
 * - Dates saisies (AAAA-MM-JJ) converties en Date ; une valeur vide efface.
 * - Groupe d'affaires : retrouvé par son code T24 (sinon par son nom) dans la banque
 *   du client, et seulement là ; créé dans cette banque s'il est nouveau.
 * - Provenance : établie par le serveur à partir des attestations de lecture T24
 *   (voir lib/services/t24/attestation.ts), jamais déclarée par le navigateur.
 */

import { Prisma } from "@prisma/client";
import type { UpdateClientInput } from "@/lib/validation-schemas";
import {
  texteAtteste,
  type AttestationClient,
} from "@/lib/services/t24/attestation";
import type { FicheGroupeT24 } from "@/lib/services/t24/normalisation";

const DATES = ["dateRelation", "dateCreationSociete", "dateRevueKYC"] as const;

type Groupe = { id: string };

export interface AccesGroupes {
  groupeAffaires: {
    findFirst(args: {
      where: Prisma.GroupeAffairesWhereInput;
      select: { id: true };
    }): Promise<Groupe | null>;
    create(args: {
      data: Prisma.GroupeAffairesUncheckedCreateInput;
      select: { id: true };
    }): Promise<Groupe>;
    update(args: {
      where: { id: string };
      data: Prisma.GroupeAffairesUncheckedUpdateInput;
      select: { id: true };
    }): Promise<Groupe>;
  };
}

/** Données Prisma d'une saisie client (hors groupe, actionnaires et provenance). */
export function donneesClient(
  saisie: UpdateClientInput
): Record<string, unknown> {
  const { status, ...reste } = saisie;
  const data: Record<string, unknown> = { ...reste };
  // Résolus à part ; l'entité ne change que par un transfert explicite.
  delete data.groupe;
  delete data.entiteId;
  delete data.actionnaires;
  delete data.attestationT24;
  delete data.attestationGroupeT24;
  for (const champ of DATES) {
    const v = saisie[champ];
    if (v !== undefined) data[champ] = v ? new Date(v) : null;
  }
  // status n'est pas nullable : une valeur vide ne l'efface pas.
  if (status) data.status = status;
  return data;
}

/**
 * Champs repris de T24, établis par le serveur.
 * - Champs attestés : ceux dont la valeur saisie est identique à la valeur lue dans
 *   T24 (attestation signée) ; code client et groupe compris.
 * - En modification, les champs déjà repris le restent, sauf ceux que la saisie
 *   modifie (le formulaire n'envoie que les champs modifiés).
 * Renvoie null quand rien ne change (pas d'attestation, aucun champ repris touché).
 */
export function provenanceT24(
  saisie: UpdateClientInput,
  attestation: AttestationClient | null,
  existants: string[] | null
): {
  champsT24: string[];
  sourceDonnees: "T24" | "MANUELLE";
  dateSynchroT24?: Date;
} | null {
  const touches = new Set(Object.keys(saisie));
  if (touches.has("groupe")) touches.add("groupeCode").add("groupeNom");
  const conserves = (existants ?? []).filter((c) => !touches.has(c));
  const attestes: string[] = [];
  if (attestation) {
    const valeurs = saisie as Record<string, unknown>;
    for (const [champ, valeur] of Object.entries(attestation.v)) {
      if (champ in valeurs && texteAtteste(valeurs[champ]) === valeur)
        attestes.push(champ);
    }
    if (saisie.codeClientT24 === attestation.c) attestes.push("codeClientT24");
    const g = attestation.g;
    if (g && saisie.groupe) {
      if (g.code && saisie.groupe.code === g.code) attestes.push("groupeCode");
      if (g.nom && saisie.groupe.nom === g.nom) attestes.push("groupeNom");
    }
  }
  const champs = [...new Set([...conserves, ...attestes])];
  if (
    !attestation &&
    existants !== null &&
    conserves.length === existants.length
  )
    return null;
  return {
    champsT24: champs,
    sourceDonnees: champs.length > 0 ? "T24" : "MANUELLE",
    ...(attestation ? { dateSynchroT24: new Date() } : {}),
  };
}

/**
 * Identifiant du groupe d'affaires désigné par la saisie (undefined : inchangé,
 * null : détaché), cherché et créé dans la banque du client uniquement : un groupe
 * homonyme d'une autre banque n'est jamais rattaché.
 * Un groupe lu dans T24 (attestation vérifiée, même code) met à jour pays, secteur et
 * notation du groupe.
 */
export async function resoudreGroupe(
  db: AccesGroupes,
  groupe: UpdateClientInput["groupe"],
  options: {
    entiteId: string | null;
    ficheT24?: FicheGroupeT24 | null;
    codeAtteste?: string | null;
  }
): Promise<string | null | undefined> {
  if (groupe === undefined) return undefined;
  if (groupe === null) return null;
  const code = groupe.code?.trim() || null;
  const nom = groupe.nom.trim();
  const entiteId = options.entiteId;
  const fiche =
    options.ficheT24 && code && options.ficheT24.code === code
      ? options.ficheT24
      : null;
  const depuisT24 = Boolean(fiche || (code && options.codeAtteste === code));
  const metadonnees = fiche
    ? {
        paysSiege: fiche.paysSiege,
        secteurPrincipal: fiche.secteurPrincipal,
        ratingGroupe: fiche.ratingGroupe,
      }
    : {};

  const existant = await db.groupeAffaires.findFirst({
    where: code
      ? { code, entiteId }
      : { nom: { equals: nom, mode: "insensitive" }, entiteId },
    select: { id: true },
  });
  if (existant) {
    if (!depuisT24) return existant.id;
    await db.groupeAffaires.update({
      where: { id: existant.id },
      data: {
        ...metadonnees,
        sourceDonnees: "T24",
        dateSynchroT24: new Date(),
      },
      select: { id: true },
    });
    return existant.id;
  }

  const cree = await db.groupeAffaires.create({
    data: {
      code,
      nom,
      ...(entiteId ? { entiteId } : {}),
      ...metadonnees,
      sourceDonnees: depuisT24 ? "T24" : "MANUELLE",
      dateSynchroT24: depuisT24 ? new Date() : null,
    },
    select: { id: true },
  });
  return cree.id;
}

/**
 * Écriture imbriquée de l'actionnariat dans la création ou la modification du
 * client (undefined : inchangé). Imbriquée, elle suit le contrôle de périmètre du
 * client lui-même et la même transaction.
 */
export function ecritureActionnaires(
  actionnaires: UpdateClientInput["actionnaires"],
  mode: "creation" | "modification"
) {
  if (actionnaires === undefined) return undefined;
  const create = actionnaires.map((a, ordre) => ({
    ordre,
    typePersonne: a.typePersonne,
    nom: a.nom,
    qualite: a.qualite,
    pays: a.pays || null,
    identifiant: a.identifiant || null,
    pourcentageDetention: a.pourcentageDetention ?? null,
    beneficiaireEffectif: a.beneficiaireEffectif,
    ppe: a.ppe,
  }));
  return mode === "creation" ? { create } : { deleteMany: {}, create };
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
