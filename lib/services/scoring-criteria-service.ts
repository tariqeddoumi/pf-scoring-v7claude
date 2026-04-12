/**
 * Scoring Criteria Service
 * Manages scoring criteria, thresholds, and grille configurations
 * Enables fully parameterizable scoring engine
 */

import prisma from '@/lib/prisma';
import { ScoringCriterion, ScoringThreshold, ScoringOption, ScoringGrille } from '@prisma/client';

// In-memory cache for scoring criteria
let scoringCache: {
  data: Map<string, any>;
  timestamp: number;
  ttl: number;
} = {
  data: new Map(),
  timestamp: 0,
  ttl: 10 * 60 * 1000, // 10 minutes TTL
};

/**
 * Clear scoring cache
 */
export const clearScoringCache = (key?: string) => {
  if (key) {
    scoringCache.data.delete(key);
  } else {
    scoringCache.data.clear();
  }
};

/**
 * Check if cache is valid
 */
const isCacheValid = (): boolean => {
  return Date.now() - scoringCache.timestamp < scoringCache.ttl;
};

// ============================================================================
// SCORING CRITERIA OPERATIONS
// ============================================================================

/**
 * Get all scoring criteria
 */
export const getAllScoringCriteria = async (
  categoryFilter?: string
): Promise<ScoringCriterion[]> => {
  const cacheKey = `all_criteria_${categoryFilter || 'all'}`;

  if (isCacheValid() && scoringCache.data.has(cacheKey)) {
    return scoringCache.data.get(cacheKey);
  }

  try {
    const criteria = await prisma.scoringCriterion.findMany({
      where: categoryFilter ? { category: categoryFilter, isActive: true } : { isActive: true },
      orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
      include: {
        thresholds: { orderBy: { orderIndex: 'asc' } },
        options: { orderBy: { orderIndex: 'asc' } },
      },
    });

    scoringCache.data.set(cacheKey, criteria);
    scoringCache.timestamp = Date.now();

    return criteria;
  } catch (error) {
    console.error('Error fetching scoring criteria:', error);
    throw new Error('Failed to load scoring criteria');
  }
};

/**
 * Get a specific criterion
 */
export const getScoringCriterion = async (
  id: string
): Promise<(ScoringCriterion & { thresholds: ScoringThreshold[]; options: ScoringOption[] }) | null> => {
  try {
    return await prisma.scoringCriterion.findUnique({
      where: { id },
      include: {
        thresholds: { orderBy: { orderIndex: 'asc' } },
        options: { orderBy: { orderIndex: 'asc' } },
      },
    });
  } catch (error) {
    console.error(`Error fetching criterion ${id}:`, error);
    return null;
  }
};

/**
 * Create new scoring criterion
 */
export const createScoringCriterion = async (
  data: Omit<ScoringCriterion, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScoringCriterion> => {
  try {
    const criterion = await prisma.scoringCriterion.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });

    clearScoringCache();
    return criterion;
  } catch (error) {
    console.error('Error creating scoring criterion:', error);
    throw new Error('Failed to create scoring criterion');
  }
};

/**
 * Update scoring criterion
 */
export const updateScoringCriterion = async (
  id: string,
  data: Partial<ScoringCriterion>
): Promise<ScoringCriterion> => {
  try {
    const updated = await prisma.scoringCriterion.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    clearScoringCache();
    return updated;
  } catch (error) {
    console.error(`Error updating criterion ${id}:`, error);
    throw new Error('Failed to update scoring criterion');
  }
};

/**
 * Delete scoring criterion
 */
export const deleteScoringCriterion = async (id: string): Promise<void> => {
  try {
    await prisma.scoringCriterion.delete({
      where: { id },
    });

    clearScoringCache();
  } catch (error) {
    console.error(`Error deleting criterion ${id}:`, error);
    throw new Error('Failed to delete scoring criterion');
  }
};

// ============================================================================
// SCORING THRESHOLD OPERATIONS
// ============================================================================

/**
 * Get thresholds for a criterion
 */
export const getCriterionThresholds = async (
  criterionId: string
): Promise<ScoringThreshold[]> => {
  try {
    return await prisma.scoringThreshold.findMany({
      where: { criterionId },
      orderBy: { orderIndex: 'asc' },
    });
  } catch (error) {
    console.error(`Error fetching thresholds for criterion ${criterionId}:`, error);
    throw new Error('Failed to load thresholds');
  }
};

/**
 * Create new threshold
 */
export const createScoringThreshold = async (
  data: Omit<ScoringThreshold, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScoringThreshold> => {
  try {
    const threshold = await prisma.scoringThreshold.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });

    clearScoringCache();
    return threshold;
  } catch (error) {
    console.error('Error creating threshold:', error);
    throw new Error('Failed to create threshold');
  }
};

/**
 * Update threshold
 */
export const updateScoringThreshold = async (
  id: string,
  data: Partial<ScoringThreshold>
): Promise<ScoringThreshold> => {
  try {
    const updated = await prisma.scoringThreshold.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    clearScoringCache();
    return updated;
  } catch (error) {
    console.error(`Error updating threshold ${id}:`, error);
    throw new Error('Failed to update threshold');
  }
};

/**
 * Delete threshold
 */
export const deleteScoringThreshold = async (id: string): Promise<void> => {
  try {
    await prisma.scoringThreshold.delete({
      where: { id },
    });

    clearScoringCache();
  } catch (error) {
    console.error(`Error deleting threshold ${id}:`, error);
    throw new Error('Failed to delete threshold');
  }
};

// ============================================================================
// SCORING OPTION OPERATIONS
// ============================================================================

/**
 * Get options for a criterion
 */
export const getCriterionOptions = async (
  criterionId: string
): Promise<ScoringOption[]> => {
  try {
    return await prisma.scoringOption.findMany({
      where: { criterionId },
      orderBy: { orderIndex: 'asc' },
    });
  } catch (error) {
    console.error(`Error fetching options for criterion ${criterionId}:`, error);
    throw new Error('Failed to load options');
  }
};

/**
 * Create new option
 */
export const createScoringOption = async (
  data: Omit<ScoringOption, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScoringOption> => {
  try {
    const option = await prisma.scoringOption.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });

    clearScoringCache();
    return option;
  } catch (error) {
    console.error('Error creating option:', error);
    throw new Error('Failed to create option');
  }
};

/**
 * Update option
 */
export const updateScoringOption = async (
  id: string,
  data: Partial<ScoringOption>
): Promise<ScoringOption> => {
  try {
    const updated = await prisma.scoringOption.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    clearScoringCache();
    return updated;
  } catch (error) {
    console.error(`Error updating option ${id}:`, error);
    throw new Error('Failed to update option');
  }
};

/**
 * Delete option
 */
export const deleteScoringOption = async (id: string): Promise<void> => {
  try {
    await prisma.scoringOption.delete({
      where: { id },
    });

    clearScoringCache();
  } catch (error) {
    console.error(`Error deleting option ${id}:`, error);
    throw new Error('Failed to delete option');
  }
};

// ============================================================================
// SCORING GRILLE OPERATIONS
// ============================================================================

/**
 * Get all scoring grilles
 */
export const getAllScoringGrilles = async (
  activeOnly: boolean = true
): Promise<ScoringGrille[]> => {
  const cacheKey = `all_grilles_${activeOnly}`;

  if (isCacheValid() && scoringCache.data.has(cacheKey)) {
    return scoringCache.data.get(cacheKey);
  }

  try {
    const grilles = await prisma.scoringGrille.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    scoringCache.data.set(cacheKey, grilles);
    scoringCache.timestamp = Date.now();

    return grilles;
  } catch (error) {
    console.error('Error fetching scoring grilles:', error);
    throw new Error('Failed to load scoring grilles');
  }
};

/**
 * Get specific grille
 */
export const getScoringGrille = async (id: string): Promise<ScoringGrille | null> => {
  try {
    return await prisma.scoringGrille.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error fetching grille ${id}:`, error);
    return null;
  }
};

/**
 * Get default grille
 */
export const getDefaultScoringGrille = async (): Promise<ScoringGrille | null> => {
  try {
    return await prisma.scoringGrille.findFirst({
      where: { isDefault: true, isActive: true },
    });
  } catch (error) {
    console.error('Error fetching default grille:', error);
    return null;
  }
};

/**
 * Create new grille
 */
export const createScoringGrille = async (
  data: Omit<ScoringGrille, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ScoringGrille> => {
  try {
    const grille = await prisma.scoringGrille.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });

    clearScoringCache();
    return grille;
  } catch (error) {
    console.error('Error creating grille:', error);
    throw new Error('Failed to create grille');
  }
};

/**
 * Update grille
 */
export const updateScoringGrille = async (
  id: string,
  data: Partial<ScoringGrille>
): Promise<ScoringGrille> => {
  try {
    const updated = await prisma.scoringGrille.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    clearScoringCache();
    return updated;
  } catch (error) {
    console.error(`Error updating grille ${id}:`, error);
    throw new Error('Failed to update grille');
  }
};

/**
 * Publish grille (make active and set published date)
 */
export const publishScoringGrille = async (id: string): Promise<ScoringGrille> => {
  try {
    const updated = await prisma.scoringGrille.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        isActive: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    clearScoringCache();
    return updated;
  } catch (error) {
    console.error(`Error publishing grille ${id}:`, error);
    throw new Error('Failed to publish grille');
  }
};

/**
 * Delete grille
 */
export const deleteScoringGrille = async (id: string): Promise<void> => {
  try {
    await prisma.scoringGrille.delete({
      where: { id },
    });

    clearScoringCache();
  } catch (error) {
    console.error(`Error deleting grille ${id}:`, error);
    throw new Error('Failed to delete grille');
  }
};

/**
 * Calculate score based on criterion thresholds
 */
export const calculateScore = async (
  criterionId: string,
  value: number
): Promise<number | null> => {
  try {
    const criterion = await getScoringCriterion(criterionId);

    if (!criterion || criterion.scoreType !== 'NUMERIC') {
      return null;
    }

    // Find matching threshold
    const threshold = criterion.thresholds.find(
      (t) => value >= t.minValue && value <= t.maxValue
    );

    return threshold?.score || null;
  } catch (error) {
    console.error('Error calculating score:', error);
    return null;
  }
};

/**
 * Validate weights sum to 1.0 for a category
 */
export const validateWeights = async (category: string): Promise<boolean> => {
  try {
    const criteria = await getAllScoringCriteria(category);
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    // Allow 0.01 tolerance for floating point errors
    return Math.abs(totalWeight - 1.0) < 0.01;
  } catch (error) {
    console.error('Error validating weights:', error);
    return false;
  }
};

/**
 * Reweight criteria to normalize weights to 1.0
 */
export const normalizeWeights = async (category: string): Promise<void> => {
  try {
    const criteria = await getAllScoringCriteria(category);
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    if (totalWeight === 0) {
      throw new Error('Cannot normalize with zero total weight');
    }

    for (const criterion of criteria) {
      const normalizedWeight = criterion.weight / totalWeight;
      await updateScoringCriterion(criterion.id, {
        weight: normalizedWeight,
      });
    }
  } catch (error) {
    console.error('Error normalizing weights:', error);
    throw new Error('Failed to normalize weights');
  }
};
