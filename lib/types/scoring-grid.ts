// ─── Core Types ────────────────────────────────────────────────────────────────

export type ScoringNodeType =
  | "DOMAIN"
  | "GROUP"
  | "CRITERION"
  | "SUB_CRITERION"
  | "SUB_SUB_CRITERION"
  | "LEAF"
  | "BLOCK";

export type ScoringAnswerType =
  | "OPTION_SINGLE"
  | "OPTION_MULTI"
  | "NUMERIC_RANGE"
  | "BOOLEAN"
  | "TEXT"
  | "FORMULA";

export type VersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AggregationMethod =
  | "WEIGHTED_AVERAGE"
  | "AVERAGE"
  | "WEIGHTED_SUM"
  | "MIN"
  | "MAX";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface ScoringModel {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
}

export interface ScoringModelVersion {
  id: string;
  modelId: string;
  versionNumber: number;
  label: string;
  status: VersionStatus;
  isPublished: boolean;
  changeReason?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface ScoringNodeOption {
  id: string;
  nodeId: string;
  label: string;
  code?: string;
  value?: string;
  score: number;
  orderIndex: number;
  isActive: boolean;
  color?: string;
}

export interface ScoringNodeRange {
  id: string;
  nodeId: string;
  label?: string;
  minValue: number;
  maxValue: number;
  minIncluded: boolean;
  maxIncluded: boolean;
  score: number;
  orderIndex: number;
  isActive: boolean;
}

export interface ScoringNode {
  id: string;
  versionId: string;
  parentNodeId: string | null;
  nodeType: ScoringNodeType;
  code: string;
  label: string;
  shortLabel?: string;
  description?: string;
  depth: number;
  orderIndex: number;
  weight?: number;
  aggregationMethod?: AggregationMethod;
  answerType?: ScoringAnswerType;
  isScoringLeaf: boolean;
  isTerminal: boolean;
  isActive: boolean;
  // Runtime tree
  childNodes?: ScoringNode[];
  options?: ScoringNodeOption[];
  ranges?: ScoringNodeRange[];
}

// ─── Validation ────────────────────────────────────────────────────────────────

export interface GridValidationError {
  nodeId: string;
  nodePath: string;
  field: "weight" | "score" | "range" | "options" | "consistency";
  message: string;
  severity: "error" | "warning";
}

export interface GridValidationResult {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: GridValidationError[];
}

// ─── Statistics ────────────────────────────────────────────────────────────────

export interface GridStatistics {
  totalDomains: number;
  totalCriteria: number;
  totalSubCriteria: number;
  totalSubSubCriteria: number;
  totalScoringLeaves: number;
  totalOptions: number;
  totalRanges: number;
  completionRate: number; // % of leaves with options/ranges configured
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface NodeFormState {
  label: string;
  shortLabel: string;
  description: string;
  weight: string;
  aggregationMethod: AggregationMethod;
  answerType: ScoringAnswerType | "";
  isScoringLeaf: boolean;
}
