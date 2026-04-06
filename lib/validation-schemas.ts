/**
 * Comprehensive Zod Validation Schemas for Phase 6 Backend
 * Used for request validation across all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// PAGINATION & COMMON SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').min(1).max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  nom: z.string().min(1, 'Last name is required').max(100),
  prenom: z.string().min(1, 'First name is required').max(100),
  role: z.enum(['admin', 'manager', 'analyst', 'viewer']).default('analyst'),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(),
});

export const changeUserRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'analyst', 'viewer']),
});

export const userListQuerySchema = paginationSchema.extend({
  role: z.enum(['admin', 'manager', 'analyst', 'viewer']).optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const createProjectSchema = z.object({
  nom: z.string().min(3, 'Project name must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  secteur: z.string().min(1, 'Sector is required').max(100),
  montant: z.number().positive('Amount must be positive').max(1e12, 'Amount exceeds maximum'),
  devise: z.string().length(3).default('MAD'),
  countryCode: z.string().length(2).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateProjectStatusSchema = z.object({
  status: z.enum(['brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete']),
});

export const projectListQuerySchema = paginationSchema.extend({
  status: z.enum(['brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete']).optional(),
  secteur: z.string().optional(),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================================
// EVALUATION SCHEMAS
// ============================================================================

export const createEvaluationSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  analystId: z.string().uuid('Invalid analyst ID'),
  scoringResult: z.object({
    finalScore: z.number().min(0).max(10, 'Score must be between 0 and 10'),
    rating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']),
    recommendation: z.enum(['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REJECT']),
  }),
  stressTestResult: z.object({
    scenarios: z.array(z.any()),
    summary: z.object({
      allPass: z.boolean(),
      vulnerableScenarios: z.array(z.string()),
      overallRating: z.enum(['RESILIENT', 'ADEQUATE', 'VULNERABLE', 'CRITICAL']),
    }),
  }).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateEvaluationSchema = z.object({
  notes: z.string().max(5000).optional(),
  status: z.enum(['brouillon', 'soumis', 'valide', 'rejete']).optional(),
});

export const submitEvaluationSchema = z.object({
  evaluationId: z.string().uuid(),
});

export const validateEvaluationSchema = z.object({
  evaluationId: z.string().uuid(),
});

export const rejectEvaluationSchema = z.object({
  evaluationId: z.string().uuid(),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(1000),
});

export const evaluationListQuerySchema = paginationSchema.extend({
  status: z.enum(['brouillon', 'soumis', 'valide', 'rejete']).optional(),
  projectId: z.string().uuid().optional(),
  analystId: z.string().uuid().optional(),
  rating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']).optional(),
});

export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationInput = z.infer<typeof updateEvaluationSchema>;

// ============================================================================
// SCORING SCHEMAS
// ============================================================================

export const calculatedScoringSchema = z.object({
  evaluationId: z.string().uuid(),
});

export const stressTestSchema = z.object({
  evaluationId: z.string().uuid(),
  scenarios: z.array(z.string()).optional(),
});

// ============================================================================
// ADMIN/CONFIGURATION SCHEMAS
// ============================================================================

export const createDomainSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z_]+$/),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  weight: z.number().min(0).max(1).default(0.125),
  orderIndex: z.number().int().default(0),
});

export const updateDomainSchema = createDomainSchema.partial().omit({ code: true });

export const createCountrySchema = z.object({
  code: z.string().length(2).regex(/^[A-Z]{2}$/),
  label: z.string().min(1).max(100),
  riskScore: z.number().min(0).max(100).default(50),
});

export const updateCountryRiskSchema = z.object({
  riskScore: z.number().min(0).max(100),
});

export const updateSystemConfigSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string().max(10000),
  description: z.string().optional(),
});

// ============================================================================
// AUDIT LOG SCHEMAS
// ============================================================================

export const auditLogQuerySchema = paginationSchema.extend({
  entityType: z.enum(['user', 'project', 'evaluation', 'scoring', 'config']).optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'READ', 'VALIDATE', 'REJECT', 'SUBMIT', 'CALCULATE']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.enum(['success', 'failure']).optional(),
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const validationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string(),
      code: z.string(),
    })).optional(),
  }),
});

// ============================================================================
// TYPE EXPORTS FOR USE IN SERVICES
// ============================================================================

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryRiskInput = z.infer<typeof updateCountryRiskSchema>;
export type UpdateSystemConfigInput = z.infer<typeof updateSystemConfigSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
