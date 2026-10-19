import type { Prisma } from "@prisma/client";
import { peutLire, type Perimetre } from "./perimetre";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";

/**
 * Gestion des utilisateurs dans le périmètre de l'administrateur : un administrateur
 * rattaché à une banque ne voit et ne gère que les comptes de sa banque et de ses
 * filiales, et ne peut rattacher un compte qu'à l'une d'elles.
 */

export const PORTEES = ["entite", "groupe"] as const;

/** Filtre Prisma des comptes visibles par l'administrateur. */
export function filtreComptes(p: Perimetre): Prisma.UserWhereInput {
  return p.tout ? {} : { entiteId: { in: p.lecture } };
}

/** Le compte (par son entité) est-il gérable par l'administrateur ? */
export function compteGerable(p: Perimetre, entiteIdDuCompte: string | null): boolean {
  // Un compte « tout le périmètre » n'est gérable que par un administrateur qui l'est aussi.
  if (!entiteIdDuCompte) return p.tout;
  return peutLire(p, entiteIdDuCompte);
}

/**
 * Entité à attribuer à un compte, ou motif de refus. `undefined` = non fourni :
 * l'entité de l'administrateur. `null` = tout le périmètre (administrateur global).
 */
export function entiteAttribuable(
  p: Perimetre,
  demandee: string | null | undefined,
  roleCible?: string
): { ok: true; entiteId: string | null } | { ok: false; motif: string } {
  if (demandee === undefined) return { ok: true, entiteId: p.entiteId };
  if (demandee === null) {
    if (!p.tout) return { ok: false, motif: "Seul un administrateur de toute la plateforme crée un compte sans banque." };
    // Sans banque, seul un administrateur système a un accès (à tout) ; un autre
    // compte n'aurait accès à rien : on exige une banque.
    if (roleCible !== undefined && roleCible !== "system_admin") {
      return { ok: false, motif: "Rattachez l'utilisateur à une banque (seul un administrateur système peut n'en avoir aucune)." };
    }
    return { ok: true, entiteId: null };
  }
  if (!peutLire(p, demandee)) return { ok: false, motif: "Entité hors de votre périmètre." };
  return { ok: true, entiteId: demandee };
}

/**
 * Seul un administrateur système attribue, retire ou modifie le rôle d'administrateur
 * système, ou attribue un rôle qui décide des dossiers (validation des scorings) : un
 * administrateur du modèle pouvait se donner, ou donner à un tiers, le rôle de décideur.
 */
export function roleAttribuable(roleAdmin: string, roleCible: string | undefined, roleActuel?: string): boolean {
  if (roleAdmin === "system_admin") return true;
  if (roleCible === "system_admin" || roleActuel === "system_admin") return false;
  if (roleCible !== undefined && roleCible !== roleActuel && hasPermission(roleCible as UserRole, "evaluation", "approve")) return false;
  return true;
}
