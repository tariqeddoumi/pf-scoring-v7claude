import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
  message?: string;
  count?: number;
  timestamp?: string;
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  options?: { status?: number; count?: number; message?: string }
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(options?.count !== undefined && { count: options.count }),
      ...(options?.message && { message: options.message }),
      timestamp: new Date().toISOString(),
    },
    { status: options?.status || 200 }
  );
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string,
  options?: {
    status?: number;
    errorCode?: string;
    errors?: Array<{ field: string; message: string }>;
  }
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(options?.errorCode && { errorCode: options.errorCode }),
      ...(options?.errors && { errors: options.errors }),
      timestamp: new Date().toISOString(),
    },
    { status: options?.status || 400 }
  );
}

/**
 * Handle validation errors with field-level details
 */
export function validationError(
  errors: Array<{ field: string; message: string }>
): NextResponse<ApiResponse> {
  return errorResponse(
    "Erreur de validation",
    {
      status: 400,
      errorCode: "VAL_001",
      errors,
    }
  );
}

/**
 * Handle not found errors
 */
export function notFoundError(
  resource: string
): NextResponse<ApiResponse> {
  return errorResponse(
    `${resource} non trouvé`,
    {
      status: 404,
      errorCode: "NOT_FOUND",
    }
  );
}

/**
 * Handle unauthorized errors
 */
export function unauthorizedError(): NextResponse<ApiResponse> {
  return errorResponse(
    "Non autorisé",
    {
      status: 401,
      errorCode: "UNAUTHORIZED",
    }
  );
}

/**
 * Handle forbidden errors
 */
export function forbiddenError(): NextResponse<ApiResponse> {
  return errorResponse(
    "Accès refusé",
    {
      status: 403,
      errorCode: "FORBIDDEN",
    }
  );
}

/**
 * Handle server errors
 */
export function serverError(
  message: string = "Erreur serveur interne"
): NextResponse<ApiResponse> {
  return errorResponse(
    message,
    {
      status: 500,
      errorCode: "SERVER_ERROR",
    }
  );
}
