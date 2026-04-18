/**
 * Scoring Leaves Service
 *
 * Determines which nodes in the scoring tree are "leaves" (input points)
 * based on the flexible scoreLeafDepth configuration.
 *
 * This allows:
 * - Scoring at domain level (depth 0)
 * - Scoring at criterion level (depth 1) [DEFAULT]
 * - Scoring at sub-criterion level (depth 2+)
 * - Different depths for different branches
 */

export interface ScoringNode {
  id: string;
  code: string;
  label: string;
  depth: number;
  nodeType: string;
  scoreLeafDepth?: number | null;
  isScoringLeaf: boolean;
  children?: ScoringNode[];
  answerType?: string;
  options?: any[];
  ranges?: any[];
}

/**
 * Determine if a node is a scoring leaf based on scoreLeafDepth configuration
 */
export function isScoringLeaf(node: ScoringNode, parentLeafDepth?: number): boolean {
  // If explicitly marked, use that
  if (node.isScoringLeaf === true) {
    return true;
  }

  // Determine the effective scoreLeafDepth
  const effectiveLeafDepth = node.scoreLeafDepth ?? parentLeafDepth ?? 1; // Default to depth 1 (criterion)

  // This is a leaf if its depth equals the configured leaf depth
  if (node.depth === effectiveLeafDepth) {
    return true;
  }

  // If no children and has answerType, it's a leaf
  if (!node.children || node.children.length === 0) {
    return node.answerType !== undefined && node.answerType !== null;
  }

  return false;
}

/**
 * Get all scoring leaves from a node and its descendants
 * Returns only nodes where users should input answers
 */
export function getScoringLeaves(
  node: ScoringNode,
  parentLeafDepth?: number
): ScoringNode[] {
  // Determine effective leaf depth for this subtree
  const effectiveLeafDepth = node.scoreLeafDepth ?? parentLeafDepth ?? 1;

  // If this node is at or past the leaf depth, return it
  if (node.depth >= effectiveLeafDepth) {
    return [node];
  }

  // Otherwise, recurse into children
  if (node.children && node.children.length > 0) {
    return node.children.flatMap(child =>
      getScoringLeaves(child, effectiveLeafDepth)
    );
  }

  // Leaf of tree by default
  return [node];
}

/**
 * Get all scoring leaves from an array of nodes (typically domains)
 */
export function getScoringLeavesFromNodes(nodes: ScoringNode[]): ScoringNode[] {
  return nodes.flatMap(node => getScoringLeaves(node));
}

/**
 * Build a scoring-leaf-only tree for evaluation UI
 * Keeps the hierarchy but only includes leaves and their paths
 */
export function buildScoringLeafTree(node: ScoringNode, parentLeafDepth?: number): ScoringNode | null {
  const effectiveLeafDepth = node.scoreLeafDepth ?? parentLeafDepth ?? 1;

  // If this is a scoring leaf, return it (no children)
  if (node.depth >= effectiveLeafDepth) {
    return {
      ...node,
      children: undefined,
    };
  }

  // Otherwise, recursively build children
  if (node.children && node.children.length > 0) {
    const scoringChildren = node.children
      .map(child => buildScoringLeafTree(child, effectiveLeafDepth))
      .filter((child): child is ScoringNode => child !== null);

    if (scoringChildren.length === 0) {
      return null; // No scoring children, skip this branch
    }

    return {
      ...node,
      children: scoringChildren,
    };
  }

  return null; // No children and not a leaf
}

/**
 * Calculate the path to a scoring leaf from the root
 * Example: "D1 > Financial Risk > C1.1 > Leverage Ratio"
 */
export function getNodePath(
  node: ScoringNode,
  parents: ScoringNode[] = []
): string {
  const path = [...parents, node];
  return path.map(n => n.label).join(" > ");
}

/**
 * Get the depth-based prefix for display
 * D1, D1.C1, D1.C1.SC1, etc.
 */
export function getHierarchicalCode(node: ScoringNode): string {
  if (!node.code) return "";
  // Use the code as-is since it should encode hierarchy
  return node.code;
}

/**
 * Count the number of scoring leaves in a tree
 */
export function countScoringLeaves(
  node: ScoringNode,
  parentLeafDepth?: number
): number {
  const leaves = getScoringLeaves(node, parentLeafDepth);
  return leaves.length;
}

/**
 * Get statistics about the scoring structure
 */
export function getScoringStats(nodes: ScoringNode[]): {
  totalNodes: number;
  totalLeaves: number;
  maxDepth: number;
  depthDistribution: Record<number, number>;
  leafsPerDomain: Record<string, number>;
} {
  const stats = {
    totalNodes: 0,
    totalLeaves: 0,
    maxDepth: 0,
    depthDistribution: {} as Record<number, number>,
    leafsPerDomain: {} as Record<string, number>,
  };

  function traverse(node: ScoringNode) {
    stats.totalNodes++;
    stats.maxDepth = Math.max(stats.maxDepth, node.depth);

    // Count by depth
    stats.depthDistribution[node.depth] = (stats.depthDistribution[node.depth] || 0) + 1;

    // Check if scoring leaf
    if (isScoringLeaf(node)) {
      stats.totalLeaves++;
    }

    // Count leaves per domain
    if (node.nodeType === "DOMAIN") {
      const domainLeaves = getScoringLeaves(node);
      stats.leafsPerDomain[node.code] = domainLeaves.length;
    }

    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return stats;
}
