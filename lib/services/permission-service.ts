/**
 * Permission Service
 * Role-based access control for all entities and actions
 */

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';

export type EntityType = 'client' | 'project' | 'evaluation' | 'user' | 'scoring_grid' | 'field_config';

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve' | 'configure';

/**
 * Permission matrix defining allowed actions per role per entity
 */
const PERMISSION_MATRIX: Record<UserRole, Record<EntityType, ActionType[]>> = {
  admin: {
    client:       ['create', 'read', 'update', 'delete', 'export'],
    project:      ['create', 'read', 'update', 'delete', 'export', 'approve'],
    evaluation:   ['create', 'read', 'update', 'delete', 'export', 'approve'],
    user:         ['create', 'read', 'update', 'delete'],
    scoring_grid: ['create', 'read', 'update', 'delete', 'configure'],
    field_config: ['create', 'read', 'update', 'delete', 'configure'],
  },
  manager: {
    client:       ['create', 'read', 'update', 'delete', 'export'],
    project:      ['create', 'read', 'update', 'delete', 'export', 'approve'],
    evaluation:   ['create', 'read', 'update', 'delete', 'export', 'approve'],
    user:         ['read'],
    scoring_grid: ['read'],
    field_config: ['read'],
  },
  analyst: {
    client:       ['create', 'read', 'update', 'export'],
    project:      ['create', 'read', 'update', 'export'],
    evaluation:   ['create', 'read', 'update', 'export'],
    user:         ['read'],
    scoring_grid: ['read'],
    field_config: ['read'],
  },
  viewer: {
    client:       ['read'],
    project:      ['read'],
    evaluation:   ['read'],
    user:         [],
    scoring_grid: ['read'],
    field_config: ['read'],
  },
};

/**
 * Check if a role has permission for a specific action on an entity
 */
export const hasPermission = (
  role: UserRole,
  entity: EntityType,
  action: ActionType
): boolean => {
  const rolePerms = PERMISSION_MATRIX[role];
  if (!rolePerms) return false;
  const entityPerms = rolePerms[entity];
  if (!entityPerms) return false;
  return entityPerms.includes(action);
};

/**
 * Get all allowed actions for a role on an entity
 */
export const getAllowedActions = (
  role: UserRole,
  entity: EntityType
): ActionType[] => {
  return PERMISSION_MATRIX[role]?.[entity] || [];
};

/**
 * Check if role can access admin features
 */
export const canAccessAdmin = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if role can manage users
 */
export const canManageUsers = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if role can approve evaluations
 */
export const canApproveEvaluations = (role: UserRole): boolean => {
  return role === 'admin' || role === 'manager';
};

/**
 * Check if role can configure scoring grids
 */
export const canConfigureScoring = (role: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Check if role can export data
 */
export const canExport = (role: UserRole): boolean => {
  return role !== 'viewer';
};

/**
 * Get the full permission matrix (for admin UI display)
 */
export const getPermissionMatrix = (): Record<UserRole, Record<EntityType, ActionType[]>> => {
  return PERMISSION_MATRIX;
};

/**
 * Get role display label in French
 */
export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrateur',
    manager: 'Manager',
    analyst: 'Analyste',
    viewer: 'Lecteur',
  };
  return labels[role] || role;
};

/**
 * Get action display label in French
 */
export const getActionLabel = (action: ActionType): string => {
  const labels: Record<ActionType, string> = {
    create: 'Créer',
    read: 'Lire',
    update: 'Modifier',
    delete: 'Supprimer',
    export: 'Exporter',
    approve: 'Approuver',
    configure: 'Configurer',
  };
  return labels[action] || action;
};
