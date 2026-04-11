/**
 * Système d'erreurs structuré avec codes et catégories
 * Permet une meilleure traçabilité et compréhension des erreurs
 */

export enum ErrorCategory {
  // Erreurs de réseau
  NETWORK = "NETWORK",

  // Erreurs de base de données
  DATABASE = "DATABASE",

  // Erreurs d'authentification et autorisation
  AUTH = "AUTH",

  // Erreurs de validation de données
  VALIDATION = "VALIDATION",

  // Erreurs de configuration
  CONFIG = "CONFIG",

  // Erreurs métier/logique applicative
  BUSINESS = "BUSINESS",

  // Erreurs de serveur générique
  SERVER = "SERVER",
}

export interface ErrorCode {
  code: string;
  category: ErrorCategory;
  message: string;
  httpStatus: number;
  description: string;
}

/**
 * Catalogue complet des codes d'erreur
 */
export const ERROR_CODES: Record<string, ErrorCode> = {
  // ==================== RÉSEAU ====================
  ERR_NET_001: {
    code: "ERR_NET_001",
    category: ErrorCategory.NETWORK,
    message: "Impossible de se connecter au serveur",
    httpStatus: 503,
    description:
      "La connexion au serveur a échoué. Vérifiez votre connexion Internet.",
  },

  ERR_NET_002: {
    code: "ERR_NET_002",
    category: ErrorCategory.NETWORK,
    message: "Délai d'attente dépassé",
    httpStatus: 408,
    description: "La requête a dépassé le délai maximum d'attente.",
  },

  ERR_NET_003: {
    code: "ERR_NET_003",
    category: ErrorCategory.NETWORK,
    message: "Service indisponible",
    httpStatus: 503,
    description:
      "Le service est temporairement indisponible. Réessayez plus tard.",
  },

  // ==================== BASE DE DONNÉES ====================
  ERR_DB_001: {
    code: "ERR_DB_001",
    category: ErrorCategory.DATABASE,
    message: "Erreur de connexion à la base de données",
    httpStatus: 503,
    description:
      "Impossible de se connecter à la base de données. Vérifiez les paramètres de connexion.",
  },

  ERR_DB_002: {
    code: "ERR_DB_002",
    category: ErrorCategory.DATABASE,
    message: "Erreur lors de la requête à la base de données",
    httpStatus: 500,
    description: "Une erreur s'est produite lors de l'exécution de la requête.",
  },

  ERR_DB_003: {
    code: "ERR_DB_003",
    category: ErrorCategory.DATABASE,
    message: "Enregistrement non trouvé",
    httpStatus: 404,
    description: "L'enregistrement demandé n'existe pas.",
  },

  ERR_DB_004: {
    code: "ERR_DB_004",
    category: ErrorCategory.DATABASE,
    message: "Enregistrement en doublon",
    httpStatus: 409,
    description: "Cet enregistrement existe déjà.",
  },

  ERR_DB_005: {
    code: "ERR_DB_005",
    category: ErrorCategory.DATABASE,
    message: "Erreur de contrainte de base de données",
    httpStatus: 409,
    description:
      "Les données fournis violent une contrainte de la base de données.",
  },

  // ==================== AUTHENTIFICATION ====================
  ERR_AUTH_001: {
    code: "ERR_AUTH_001",
    category: ErrorCategory.AUTH,
    message: "Token d'authentification manquant",
    httpStatus: 401,
    description:
      "Aucun token d'authentification trouvé. Veuillez vous connecter.",
  },

  ERR_AUTH_002: {
    code: "ERR_AUTH_002",
    category: ErrorCategory.AUTH,
    message: "Token d'authentification invalide",
    httpStatus: 401,
    description:
      "Le token d'authentification est invalide ou expiré. Veuillez vous reconnecter.",
  },

  ERR_AUTH_003: {
    code: "ERR_AUTH_003",
    category: ErrorCategory.AUTH,
    message: "Token d'authentification expiré",
    httpStatus: 401,
    description: "Votre session a expiré. Veuillez vous reconnecter.",
  },

  ERR_AUTH_004: {
    code: "ERR_AUTH_004",
    category: ErrorCategory.AUTH,
    message: "Identifiants incorrects",
    httpStatus: 401,
    description: "L'email ou le mot de passe est incorrect.",
  },

  ERR_AUTH_005: {
    code: "ERR_AUTH_005",
    category: ErrorCategory.AUTH,
    message: "Utilisateur non trouvé",
    httpStatus: 404,
    description: "Cet utilisateur n'existe pas.",
  },

  ERR_AUTH_006: {
    code: "ERR_AUTH_006",
    category: ErrorCategory.AUTH,
    message: "Permissions insuffisantes",
    httpStatus: 403,
    description:
      "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
  },

  ERR_AUTH_007: {
    code: "ERR_AUTH_007",
    category: ErrorCategory.AUTH,
    message: "Compte créé avec succès",
    httpStatus: 201,
    description: "Le compte a été créé. Veuillez vous connecter.",
  },

  // ==================== VALIDATION ====================
  ERR_VAL_001: {
    code: "ERR_VAL_001",
    category: ErrorCategory.VALIDATION,
    message: "Données invalides",
    httpStatus: 400,
    description:
      "Les données fournis ne sont pas valides. Vérifiez les champs obligatoires.",
  },

  ERR_VAL_002: {
    code: "ERR_VAL_002",
    category: ErrorCategory.VALIDATION,
    message: "Email invalide",
    httpStatus: 400,
    description: "L'email fourni n'est pas au format valide.",
  },

  ERR_VAL_003: {
    code: "ERR_VAL_003",
    category: ErrorCategory.VALIDATION,
    message: "Mot de passe faible",
    httpStatus: 400,
    description:
      "Le mot de passe ne respecte pas les critères de sécurité minimum.",
  },

  ERR_VAL_004: {
    code: "ERR_VAL_004",
    category: ErrorCategory.VALIDATION,
    message: "Champ obligatoire manquant",
    httpStatus: 400,
    description: "Un ou plusieurs champs obligatoires ne sont pas fournis.",
  },

  ERR_VAL_005: {
    code: "ERR_VAL_005",
    category: ErrorCategory.VALIDATION,
    message: "Format de données incorrect",
    httpStatus: 400,
    description: "Le format des données n'est pas correct.",
  },

  // ==================== CONFIGURATION ====================
  ERR_CFG_001: {
    code: "ERR_CFG_001",
    category: ErrorCategory.CONFIG,
    message: "Variable d'environnement manquante",
    httpStatus: 500,
    description: "Une variable d'environnement requise n'est pas configurée.",
  },

  ERR_CFG_002: {
    code: "ERR_CFG_002",
    category: ErrorCategory.CONFIG,
    message: "Configuration invalide",
    httpStatus: 500,
    description: "La configuration de l'application est invalide.",
  },

  ERR_CFG_003: {
    code: "ERR_CFG_003",
    category: ErrorCategory.CONFIG,
    message: "OAuth non configuré",
    httpStatus: 500,
    description: "Les paramètres OAuth ne sont pas correctement configurés.",
  },

  // ==================== LOGIQUE MÉTIER ====================
  ERR_BUS_001: {
    code: "ERR_BUS_001",
    category: ErrorCategory.BUSINESS,
    message: "Projet non trouvé",
    httpStatus: 404,
    description: "Le projet demandé n'existe pas.",
  },

  ERR_BUS_002: {
    code: "ERR_BUS_002",
    category: ErrorCategory.BUSINESS,
    message: "Utilisateur non trouvé",
    httpStatus: 404,
    description: "L'utilisateur demandé n'existe pas.",
  },

  ERR_BUS_003: {
    code: "ERR_BUS_003",
    category: ErrorCategory.BUSINESS,
    message: "Action non autorisée",
    httpStatus: 403,
    description: "Cette action n'est pas autorisée pour cet utilisateur.",
  },

  ERR_BUS_004: {
    code: "ERR_BUS_004",
    category: ErrorCategory.BUSINESS,
    message: "Erreur lors de la création du projet",
    httpStatus: 500,
    description:
      "Impossible de créer le projet. Vérifiez les données fournies.",
  },

  ERR_BUS_005: {
    code: "ERR_BUS_005",
    category: ErrorCategory.BUSINESS,
    message: "Erreur lors de la création de l'utilisateur",
    httpStatus: 500,
    description: "Impossible de créer l'utilisateur.",
  },

  // ==================== SERVEUR GÉNÉRIQUE ====================
  ERR_SRV_001: {
    code: "ERR_SRV_001",
    category: ErrorCategory.SERVER,
    message: "Erreur interne du serveur",
    httpStatus: 500,
    description:
      "Une erreur interne s'est produite. Veuillez réessayer plus tard.",
  },

  ERR_SRV_002: {
    code: "ERR_SRV_002",
    category: ErrorCategory.SERVER,
    message: "Erreur d'analyse JSON",
    httpStatus: 400,
    description: "Le corps de la requête n'est pas un JSON valide.",
  },

  ERR_SRV_003: {
    code: "ERR_SRV_003",
    category: ErrorCategory.SERVER,
    message: "Méthode non autorisée",
    httpStatus: 405,
    description: "Cette méthode HTTP n'est pas autorisée pour cette ressource.",
  },

  ERR_SRV_004: {
    code: "ERR_SRV_004",
    category: ErrorCategory.SERVER,
    message: "Ressource non trouvée",
    httpStatus: 404,
    description: "La ressource demandée n'a pas été trouvée.",
  },
};

/**
 * Obtenir les informations d'un code d'erreur
 */
export function getErrorCode(code: string): ErrorCode | null {
  return ERROR_CODES[code] || null;
}

/**
 * Vérifier si un code d'erreur existe
 */
export function hasErrorCode(code: string): boolean {
  return code in ERROR_CODES;
}

/**
 * Obtenir tous les codes d'erreur d'une catégorie
 */
export function getErrorsByCategory(category: ErrorCategory): ErrorCode[] {
  return Object.values(ERROR_CODES).filter((err) => err.category === category);
}
