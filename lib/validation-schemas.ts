/**
 * Comprehensive Zod Validation Schemas for Phase 6 Backend
 * Used for request validation across all API endpoints
 */

import { z } from "zod";

// ============================================================================
// PAGINATION & COMMON SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address").min(1).max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  nom: z.string().min(1, "Last name is required").max(100),
  prenom: z.string().min(1, "First name is required").max(100),
  role: z.enum(["admin", "manager", "analyst", "viewer"]).default("analyst"),
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .optional(),
  });

export const changeUserRoleSchema = z.object({
  role: z.enum(["admin", "manager", "analyst", "viewer"]),
});

export const userListQuerySchema = paginationSchema.extend({
  role: z.enum(["admin", "manager", "analyst", "viewer"]).optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

const numberOrString = (defaultVal: number | null = null) =>
  z.union([
    z.number().nullable(),
    z.string().transform(v => v === "" ? defaultVal : parseFloat(v)).pipe(z.number().nullable()),
  ]).nullable().optional();

const intOrString = (defaultVal: number | null = null) =>
  z.union([
    z.number().int().nullable(),
    z.string().transform(v => v === "" ? defaultVal : parseInt(v)).pipe(z.number().nullable()),
  ]).nullable().optional();

export const createProjectSchema = z.object({
  nom: z
    .string()
    .min(3, "Le nom du projet doit contenir au moins 3 caractères")
    .max(200),
  description: z.string().max(5000).optional().default(""),
  secteur: z.string().max(100).optional().default(""),
  montant: numberOrString(0),
  devise: z.string().length(3).default("MAD"),
  countryCode: z.string().max(5).optional().nullable(),
  clientId: z.string().uuid("ID client invalide").optional().nullable(),
  status: z.string().optional(),
  // Extended fields
  pays: z.string().trim().max(100).nullable().optional(),
  sponsorPrincipal: z.string().trim().max(200).nullable().optional(),
  nomSPV: z.string().trim().max(200).nullable().optional(),
  constructeurEPC: z.string().trim().max(200).nullable().optional(),
  operateurOM: z.string().trim().max(200).nullable().optional(),
  technologie: z.string().trim().max(200).nullable().optional(),
  capaciteInstallee: numberOrString(),
  debutConstruction: z.string().nullable().optional(),
  finConstruction: z.string().nullable().optional(),
  coutTotal: numberOrString(),
  financement: numberOrString(),
  apportPropre: numberOrString(),
  structureCapitalePrincipale: z.string().trim().max(500).nullable().optional(),
  dureeCredit: intOrString(),
  taux: numberOrString(),
  typeCredit: z.string().trim().max(100).nullable().optional(),
  dureeProjet: intOrString(),
  periodeAmorce: intOrString(),
  periodeRemboursement: intOrString(),
  tauxCouverture: numberOrString(),
  ratio: numberOrString(),
  scoreGlobal: numberOrString(),
  grade: z.string().max(10).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateProjectStatusSchema = z.object({
  status: z.enum(["brouillon", "en_cours", "en_revue", "approuve", "rejete"]),
});

export const projectListQuerySchema = paginationSchema.extend({
  status: z
    .enum(["brouillon", "en_cours", "en_revue", "approuve", "rejete"])
    .optional(),
  secteur: z.string().optional(),
  search: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const createClientSchema = z.object({
  nom: z
    .string()
    .min(1, { message: "Le nom du client est requis (ERR_VALID_001)" })
    .min(3, { message: "Le nom doit contenir au moins 3 caractères" })
    .max(200, { message: "Le nom ne doit pas dépasser 200 caractères" })
    .trim(),
  email: z
    .string()
    .email({ message: "Format email invalide (ERR_VALID_002)" })
    .trim()
    .nullable()
    .optional(),
  telephone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{6,}$|^$/, {
      message: "Format téléphone invalide (ERR_VALID_003)",
    })
    .trim()
    .nullable()
    .optional(),
  secteur: z.string().trim().max(100).nullable().optional(),
  pays: z.string().trim().max(100).nullable().optional(),
  type: z.string().max(50).optional().default("Entreprise"),
  description: z.string().trim().max(5000).nullable().optional(),
  // Extended fields
  raisonSociale: z.string().trim().max(200).nullable().optional(),
  nomCommercial: z.string().trim().max(200).nullable().optional(),
  typeClient: z.string().max(50).nullable().optional(),
  formeJuridique: z.string().max(50).nullable().optional(),
  segmentClientele: z.string().max(100).nullable().optional(),
  effectifs: z.union([z.number().int().min(0), z.string().transform(v => v === "" ? null : parseInt(v)).pipe(z.number().nullable())]).nullable().optional(),
  capitalSocial: z.union([z.number().min(0), z.string().transform(v => v === "" ? null : parseFloat(v)).pipe(z.number().nullable())]).nullable().optional(),
  chiffreAffaires: z.union([z.number().min(0), z.string().transform(v => v === "" ? null : parseFloat(v)).pipe(z.number().nullable())]).nullable().optional(),
  ville: z.string().trim().max(100).nullable().optional(),
  adresse: z.string().trim().max(500).nullable().optional(),
  codePostal: z.string().trim().max(20).nullable().optional(),
  website: z.string().trim().max(500).nullable().optional(),
  centreAffaires: z.string().trim().max(200).nullable().optional(),
  gestionnaire: z.string().trim().max(200).nullable().optional(),
  ratingInterne: z.string().max(10).nullable().optional(),
  statutBancaire: z.string().max(50).nullable().optional(),
  dateRelation: z.string().nullable().optional(),
  exposition: z.union([z.number().min(0), z.string().transform(v => v === "" ? null : parseFloat(v)).pipe(z.number().nullable())]).nullable().optional(),
  statusKYC: z.string().max(50).nullable().optional(),
  statusConformite: z.string().max(50).nullable().optional(),
  status: z.string().max(50).nullable().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientListQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ============================================================================
// EVALUATION SCHEMAS
// ============================================================================

export const createEvaluationSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  scoringResult: z.record(z.string(), z.unknown()).optional(),
  finalScore: z.number().min(0).max(10).optional(),
  stressTestResult: z
    .object({
      scenarios: z.array(z.unknown()),
      summary: z.object({
        allPass: z.boolean(),
        vulnerableScenarios: z.array(z.string()),
        overallRating: z.enum([
          "RESILIENT",
          "ADEQUATE",
          "VULNERABLE",
          "CRITICAL",
        ]),
      }),
    })
    .optional(),
  notes: z.string().max(5000).optional(),
});

export const updateEvaluationSchema = z.object({
  notes: z.string().max(5000).optional(),
  status: z.enum(["brouillon", "soumis", "valide", "rejete"]).optional(),
});

export const submitEvaluationSchema = z.object({
  id: z.string().uuid().optional(),
  finalScore: z.number().min(0).max(10),
  rating: z.enum(["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"]).optional(),
  probabilityOfDefault: z.number().min(0).max(1).optional(),
  triggeredNOGOs: z.array(z.unknown()).optional(),
  appliedMALUS: z.record(z.string(), z.unknown()).optional(),
  malusTotal: z.number().optional(),
  notes: z.string().max(5000).optional(),
});

export const validateEvaluationSchema = z.object({
  id: z.string().uuid().optional(),
  recommendation: z
    .enum(["APPROVE", "APPROVE_WITH_CONDITIONS", "REJECT"])
    .optional(),
  notes: z.string().max(5000).optional(),
});

export const rejectEvaluationSchema = z.object({
  id: z.string().uuid().optional(),
  reason: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const evaluationListQuerySchema = paginationSchema.extend({
  status: z.enum(["brouillon", "soumis", "valide", "rejete"]).optional(),
  projectId: z.string().uuid().optional(),
  analystId: z.string().uuid().optional(),
  rating: z.enum(["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"]).optional(),
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
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_]+$/),
  label: z.string().min(1).max(200),
  description: z.string().optional(),
  weight: z.number().min(0).max(1).default(0.125),
  orderIndex: z.number().int().default(0),
});

export const updateDomainSchema = createDomainSchema
  .partial()
  .omit({ code: true });

export const createCountrySchema = z.object({
  code: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/),
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
  entityType: z
    .enum(["user", "project", "evaluation", "scoring", "config"])
    .optional(),
  entityId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z
    .enum([
      "CREATE",
      "UPDATE",
      "DELETE",
      "READ",
      "VALIDATE",
      "REJECT",
      "SUBMIT",
      "CALCULATE",
    ])
    .optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.enum(["success", "failure"]).optional(),
});

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const validationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
          code: z.string(),
        })
      )
      .optional(),
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
