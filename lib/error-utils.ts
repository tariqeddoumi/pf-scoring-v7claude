/**
 * Système de gestion d'erreurs professionnel
 * Optimisé pour l'utilisateur final ET le développeur
 */

export interface AppError {
  // Pour l'utilisateur final
  userMessage: string;

  // Pour le développeur (logs)
  debugMessage: string;

  // Identification rapide
  code: string;

  // Contexte technique
  context?: {
    endpoint?: string;
    method?: string;
    payload?: any;
    response?: any;
    timestamp?: string;
    requestId?: string;
  };
}

/**
 * Catégories d'erreurs avec messages prédéfinis
 */
export const ErrorCategories = {
  AUTH: {
    EXPIRED_SESSION: {
      code: 'AUTH_001',
      userMessage: '⚠️ Votre session a expiré. Veuillez vous reconnecter pour continuer.',
      debugMessage: 'JWT token expired or invalid. User needs to re-authenticate.'
    },
    UNAUTHORIZED: {
      code: 'AUTH_002',
      userMessage: '⚠️ Vous n\'avez pas les permissions requises pour cette action.',
      debugMessage: 'User lacks required permissions (role/scope check failed).'
    },
    MISSING_TOKEN: {
      code: 'AUTH_003',
      userMessage: '⚠️ Erreur d\'authentification. Veuillez vous reconnecter.',
      debugMessage: 'No valid authentication token found in cookies or headers.'
    }
  },

  VALIDATION: {
    INVALID_INPUT: {
      code: 'VAL_001',
      userMessage: '⚠️ Veuillez corriger les informations saisies dans le formulaire ci-dessous.',
      debugMessage: 'Schema validation failed. Check field errors for details.'
    },
    DUPLICATE_ENTRY: {
      code: 'VAL_002',
      userMessage: '⚠️ Cet email est déjà utilisé. Veuillez en utiliser un différent.',
      debugMessage: 'Unique constraint violation detected (likely email or identifier).'
    },
    MISSING_REQUIRED: {
      code: 'VAL_003',
      userMessage: '⚠️ Veuillez remplir tous les champs obligatoires.',
      debugMessage: 'Required field(s) are missing or empty.'
    }
  },

  NETWORK: {
    CONNECTION_ERROR: {
      code: 'NET_001',
      userMessage: '⚠️ Erreur de connexion au serveur. Vérifiez votre connexion Internet.',
      debugMessage: 'Network fetch failed. Check browser console for CORS/timeout issues.'
    },
    TIMEOUT: {
      code: 'NET_002',
      userMessage: '⚠️ La requête a dépassé le délai d\'attente. Veuillez réessayer.',
      debugMessage: 'Request timeout. Server may be slow or unreachable.'
    },
    SERVER_ERROR: {
      code: 'SRV_001',
      userMessage: '⚠️ Erreur serveur. Veuillez réessayer ou contacter le support.',
      debugMessage: 'Server returned 500+ error. Check server logs immediately.'
    }
  },

  BUSINESS: {
    INVALID_STATE: {
      code: 'BIZ_001',
      userMessage: '⚠️ Cette action n\'est pas possible dans l\'état actuel.',
      debugMessage: 'Business logic constraint violation (state machine error).'
    },
    RESOURCE_NOT_FOUND: {
      code: 'BIZ_002',
      userMessage: '⚠️ La ressource demandée n\'existe pas ou a été supprimée.',
      debugMessage: 'Resource not found (404). Check if ID/reference is valid.'
    }
  }
};

/**
 * Crée une erreur structurée avec contexte
 */
export function createAppError(
  category: keyof typeof ErrorCategories,
  errorType: string,
  additionalContext?: AppError['context']
): AppError {
  const errorConfig = (ErrorCategories as any)[category]?.[errorType];

  if (!errorConfig) {
    console.error(`Unknown error: ${category}.${errorType}`);
    return {
      code: 'UNKNOWN',
      userMessage: '⚠️ Une erreur inattendue s\'est produite.',
      debugMessage: `Unknown error type: ${category}.${errorType}`,
      context: additionalContext
    };
  }

  return {
    code: errorConfig.code,
    userMessage: errorConfig.userMessage,
    debugMessage: errorConfig.debugMessage,
    context: {
      ...additionalContext,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Log une erreur avec contexte complet (pour développeurs)
 */
export function logAppError(error: AppError) {
  const logGroup = `❌ [${error.code}] ${error.debugMessage}`;

  console.group(logGroup);
  console.error('🐛 Debug Info:', error.context);
  console.error('📝 Full Error:', error);
  console.groupEnd();

  // En production, vous pourriez envoyer cela à un service de monitoring
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTracking(error);
  }
}

/**
 * Parse une réponse d'erreur API et la transforme en AppError
 */
export function parseApiError(apiResponse: any, endpoint: string): AppError {
  const errorCode = apiResponse?.errorCode;
  const errorMessage = apiResponse?.error;

  // Si c'est une erreur d'authentification
  if (apiResponse?.status === 401 || errorCode === 'AUTH_001') {
    return createAppError('AUTH', 'EXPIRED_SESSION', {
      endpoint,
      response: apiResponse
    });
  }

  // Si c'est une erreur de validation
  if (errorCode?.startsWith('ERR_VALID')) {
    return createAppError('VALIDATION', 'INVALID_INPUT', {
      endpoint,
      response: apiResponse
    });
  }

  // Si c'est une erreur de contrainte unique
  if (errorCode === 'ERR_API_002' || errorMessage?.includes('déjà')) {
    return createAppError('VALIDATION', 'DUPLICATE_ENTRY', {
      endpoint,
      response: apiResponse
    });
  }

  // Erreur serveur générique
  return createAppError('NETWORK', 'SERVER_ERROR', {
    endpoint,
    response: apiResponse
  });
}
