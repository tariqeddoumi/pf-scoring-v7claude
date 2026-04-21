/**
 * Système de rôles et permissions (RBAC — Role-Based Access Control).
 *
 * CONCEPT (pour débutants) :
 * -------------------------------------------
 * Chaque utilisateur a un RÔLE (ex: "risk_analyst").
 * Chaque rôle a un NIVEAU dans la hiérarchie (plus le nombre est élevé, plus on a accès).
 * Chaque rôle possède un ensemble de PERMISSIONS spécifiques (ex: "scoring:create").
 *
 * HIÉRARCHIE DES RÔLES (du moins au plus puissant) :
 *   read_only (1) < auditor (2) < risk_analyst (3) < committee_member (4)
 *   < risk_manager (5) < scoring_admin (6) < system_admin (7)
 *
 * UTILISATION :
 *   hasMinimumRole("risk_analyst", "risk_analyst") → true
 *   hasMinimumRole("read_only", "risk_analyst")    → false (niveau insuffisant)
 *   hasPermission("auditor", "audit:read")          → true
 *   hasPermission("auditor", "scoring:delete")      → false
 */

// ============================================================================
// HIÉRARCHIE DES RÔLES
// ============================================================================

/**
 * Niveaux hiérarchiques par rôle.
 * "as const" garantit que TypeScript traite les valeurs comme des constantes
 * littérales (pas juste "number"), ce qui permet une vérification de types plus stricte.
 */
export const ROLE_HIERARCHY = {
  system_admin:      7, // Super-administrateur : accès total
  scoring_admin:     6, // Administrateur scoring : configure les modèles
  risk_manager:      5, // Gestionnaire de risque : valide les évaluations
  committee_member:  4, // Membre du comité : vote et lecture
  risk_analyst:      3, // Analyste de risque : crée et modifie les évaluations
  auditor:           2, // Auditeur : lecture seule + export des logs
  read_only:         1, // Lecture uniquement : vue sans modification possible
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// ============================================================================
// PERMISSIONS PAR RÔLE
// ============================================================================

/**
 * Ensemble des permissions pour chaque rôle.
 *
 * Format des permissions : "ressource:action"
 * Exemples : "scoring:create", "users:delete", "audit:export"
 *
 * On utilise Set (ensemble) plutôt qu'un tableau pour la vérification O(1).
 */
export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  system_admin: new Set([
    "users:create", "users:read", "users:update", "users:delete", "users:manage_roles",
    "scoring:create", "scoring:read", "scoring:update", "scoring:delete", "scoring:configure",
    "domains:create", "domains:read", "domains:update", "domains:delete",
    "audit:read", "audit:export",
    "settings:configure",
    "diagnostic:run",
  ]),
  scoring_admin: new Set([
    "users:read", "users:update",
    "scoring:create", "scoring:read", "scoring:update", "scoring:delete", "scoring:configure",
    "domains:read", "domains:update", "domains:create",
    "audit:read",
    "diagnostic:run",
  ]),
  risk_manager: new Set([
    "scoring:read", "scoring:update",
    "users:read",
    "audit:read", "audit:export",
  ]),
  committee_member: new Set([
    "scoring:read",
    "audit:read",
  ]),
  risk_analyst: new Set([
    "scoring:read", "scoring:create", "scoring:update",
  ]),
  auditor: new Set([
    "audit:read", "audit:export",
    "scoring:read",
  ]),
  read_only: new Set([
    "scoring:read",
    "audit:read",
  ]),
};

// ============================================================================
// FONCTIONS DE VÉRIFICATION
// ============================================================================

/**
 * Vérifie que l'utilisateur a au moins le niveau de rôle requis.
 *
 * Exemple : hasMinimumRole("risk_analyst", "risk_analyst") → true
 *           hasMinimumRole("read_only", "risk_analyst")    → false
 *
 * @param userRole    - Le rôle actuel de l'utilisateur
 * @param minimumRole - Le rôle minimum requis
 */
export function hasMinimumRole(userRole: string, minimumRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as UserRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
}

/**
 * Vérifie que l'utilisateur possède une permission spécifique.
 *
 * Exemple : hasPermission("risk_analyst", "scoring:create") → true
 *           hasPermission("read_only", "scoring:create")    → false
 */
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole as UserRole];
  return permissions?.has(permission) ?? false;
}

/**
 * Vérifie que l'utilisateur possède AU MOINS UNE des permissions listées.
 * Utile quand plusieurs permissions permettent la même action.
 */
export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(userRole, perm));
}

/**
 * Vérifie que l'utilisateur possède TOUTES les permissions listées.
 * Utile pour des actions qui nécessitent plusieurs droits cumulés.
 */
export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  return permissions.every((perm) => hasPermission(userRole, perm));
}

/**
 * Retourne la liste complète des permissions d'un rôle.
 * Utile pour afficher les droits dans l'interface d'administration.
 */
export function getPermissions(userRole: string): string[] {
  return Array.from(ROLE_PERMISSIONS[userRole as UserRole] ?? []);
}

/**
 * Retourne le niveau numérique d'un rôle (0 si rôle inconnu).
 * Utile pour les comparaisons et les affichages de progression.
 */
export function getRoleLevel(userRole: string): number {
  return ROLE_HIERARCHY[userRole as UserRole] ?? 0;
}
