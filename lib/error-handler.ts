/**
 * Gestionnaire d'erreurs structuré
 * Crée des réponses d'erreur cohérentes avec codes de référence
 */

import { NextResponse } from "next/server";
import { ERROR_CODES, ErrorCode, ErrorCategory } from "./error-codes";

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    timestamp: string;
    requestId?: string;
    details?: string;
  };
}

/**
 * Créer une réponse d'erreur structurée
 */
export function createErrorResponse(
  errorCode: string,
  details?: string,
  requestId?: string
): { response: NextResponse<ErrorResponse>; errorInfo: ErrorCode } {
  const errorInfo = ERROR_CODES[errorCode];

  if (!errorInfo) {
    console.error(`Code d'erreur invalide: ${errorCode}`);
    return createErrorResponse("ERR_SRV_001", `Code d'erreur invalide: ${errorCode}`, requestId);
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorInfo.code,
      message: errorInfo.message,
      category: errorInfo.category,
      timestamp: new Date().toISOString(),
      requestId,
      ...(details && { details }),
    },
  };

  return {
    response: NextResponse.json(response, { status: errorInfo.httpStatus }),
    errorInfo,
  };
}

/**
 * Journaliser une erreur avec contexte
 */
export function logError(
  errorCode: string,
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  const errorInfo = ERROR_CODES[errorCode];
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    code: errorCode,
    message: errorInfo?.message || "Erreur inconnue",
    category: errorInfo?.category || "UNKNOWN",
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  };

  console.error(`[${errorInfo?.category || "ERROR"}] ${errorCode}:`, logEntry);
}

/**
 * Traiter les erreurs Prisma et les mapper aux codes d'erreur
 */
export function handlePrismaError(error: Record<string, unknown>): string {
  const code = error.code as string | undefined;

  if (code === "P2002") {
    // Unique constraint failed
    return "ERR_DB_004";
  }
  if (code === "P2025") {
    // Record not found
    return "ERR_DB_003";
  }
  if (code === "P2003") {
    // Foreign key constraint failed
    return "ERR_DB_005";
  }

  return "ERR_DB_002";
}

/**
 * Traiter les erreurs JWT
 */
export function handleJWTError(error: Record<string, unknown>): string {
  const name = error.name as string | undefined;

  if (name === "TokenExpiredError") {
    return "ERR_AUTH_003";
  }
  if (name === "JsonWebTokenError") {
    return "ERR_AUTH_002";
  }

  return "ERR_AUTH_001";
}

/**
 * Traiter les erreurs de validation
 */
export function handleValidationError(error: Record<string, unknown>): string {
  const name = error.name as string | undefined;

  if (name === "ValidationError") {
    return "ERR_VAL_001";
  }

  return "ERR_VAL_001";
}

/**
 * Créer une réponse d'erreur à partir d'une exception connue
 */
export function handleError(error: unknown): string {
  if (!error) {
    return "ERR_SRV_001";
  }

  const err = error as Record<string, unknown>;

  // Erreur Prisma
  if ((err.constructor as { name?: string })?.name === "PrismaClientKnownRequestError") {
    return handlePrismaError(err);
  }

  // Erreur JWT
  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    return handleJWTError(err);
  }

  // Erreur de validation
  if (err.name === "ValidationError") {
    return handleValidationError(err);
  }

  // Erreur de connexion réseau
  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return "ERR_NET_001";
  }

  // Erreur générique de serveur
  return "ERR_SRV_001";
}

/**
 * Middleware pour capturer et logger les erreurs non gérées
 */
export function captureError(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>
): void {
  const errorCode = handleError(error);
  logError(errorCode, error, {
    operation,
    ...context,
  });
}
