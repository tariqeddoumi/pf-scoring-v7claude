import prisma from "@/lib/prisma-client";

/**
 * Model loader - loads and caches scoring model versions with full tree structure.
 * Organizes nodes into parent-child hierarchy for traversal and calculation.
 *
 * ARCHITECTURE NOTE (pour débutants) :
 * -----------------------------------------
 * Un modèle de scoring est un arbre :
 *   - Racines (depth 0) : Domaines (ex: "Risque Financier")
 *   - Niveau 1 : Critères (ex: "Endettement")
 *   - Feuilles (depth max) : Questions réelles à scorer
 *
 * Quand on calcule le score, on part DES FEUILLES vers la RACINE.
 * C'est ce qu'on appelle l'agrégation "bottom-up".
 *
 * Ce fichier stocke l'arbre en mémoire (cache) pour éviter des requêtes
 * répétées à la base de données.
 */

export interface NodeMeta {
  id: string;
  versionId: string;
  parentNodeId: string | null;
  nodeType: string;
  code: string;
  label: string;
  shortLabel: string | null;
  description: string | null;
  depth: number;
  orderIndex: number;
  isActive: boolean;
  isTerminal: boolean;
  isScored: boolean;
  isMandatory: boolean;
  weight: number | null;
  weightMode: string | null;
  aggregationMethod: string | null;
  answerType: string | null;
  scoringMethod: string | null;
  scoreMin: number | null;
  scoreMax: number | null;
  childrenCount: number;
}

export interface ModelTree {
  versionId: string;
  modelId: string;
  modelCode: string;
  modelLabel: string;
  nodesById: Map<string, NodeMeta>;
  childrenOf: Map<string, string[]>; // parentId → [childId, childId, ...]
  rootNodeIds: string[]; // Depth 0 nodes
  leafNodeIds: string[]; // Terminal or unscored nodes
}

const modelCache = new Map<string, ModelTree>();

export class ModelLoader {
  /**
   * Load a scoring model version with full tree structure.
   * Results are cached by versionId.
   */
  static async loadVersion(versionId: string): Promise<ModelTree> {
    if (modelCache.has(versionId)) {
      return modelCache.get(versionId)!;
    }

    const version = await prisma.scoringModelVersion.findUnique({
      where: { id: versionId },
      include: { model: true },
    });
    if (!version) throw new Error(`Model version not found: ${versionId}`);

    const nodes = await prisma.scoringNode.findMany({
      where: { versionId, isActive: true },
      select: {
        id: true,
        versionId: true,
        parentNodeId: true,
        nodeType: true,
        code: true,
        label: true,
        shortLabel: true,
        description: true,
        depth: true,
        orderIndex: true,
        isActive: true,
        isTerminal: true,
        isScored: true,
        isMandatory: true,
        weight: true,
        weightMode: true,
        aggregationMethod: true,
        answerType: true,
        scoringMethod: true,
        scoreMin: true,
        scoreMax: true,
      },
    });

    const nodesById = new Map<string, NodeMeta>();
    const childrenOf = new Map<string, string[]>();
    const rootNodeIds: string[] = [];
    const leafNodeIds: string[] = [];

    // First pass: populate nodes and find roots
    for (const node of nodes) {
      const meta: NodeMeta = {
        ...node,
        childrenCount: 0,
      };
      nodesById.set(node.id, meta);
      if (node.depth === 0) rootNodeIds.push(node.id);
    }

    // Second pass: build parent-child relationships
    for (const node of nodes) {
      if (!node.parentNodeId) continue;
      const children = childrenOf.get(node.parentNodeId) || [];
      children.push(node.id);
      childrenOf.set(node.parentNodeId, children);
    }

    // Third pass: count children and identify leaves
    for (const [parentId, childrenList] of childrenOf.entries()) {
      const parent = nodesById.get(parentId);
      if (parent) parent.childrenCount = childrenList.length;
    }

    for (const node of nodesById.values()) {
      const hasChildren = childrenOf.has(node.id);
      if (!hasChildren || node.isTerminal) leafNodeIds.push(node.id);
    }

    const tree: ModelTree = {
      versionId,
      modelId: version.modelId,
      modelCode: version.model.code,
      modelLabel: version.model.label,
      nodesById,
      childrenOf,
      rootNodeIds,
      leafNodeIds,
    };

    modelCache.set(versionId, tree);
    return tree;
  }

  /**
   * Traverse nodes in depth-first PRE-ORDER (parent → children).
   * Utile pour afficher l'arbre, générer des breadcrumbs, etc.
   *
   * ⚠️ NE PAS utiliser pour le calcul de scores (utiliser traverseBottomUp).
   */
  static traverseDepthFirst(
    tree: ModelTree,
    callback: (node: NodeMeta, depth: number) => void
  ): void {
    const visited = new Set<string>();

    const visit = (nodeId: string, depth: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = tree.nodesById.get(nodeId);
      if (!node) return;

      // On traite le parent EN PREMIER, puis ses enfants (pré-ordre)
      callback(node, depth);

      const children = tree.childrenOf.get(nodeId) || [];
      for (const childId of children) {
        visit(childId, depth + 1);
      }
    };

    for (const rootId of tree.rootNodeIds) {
      visit(rootId, 0);
    }
  }

  /**
   * Traverse nodes in POST-ORDER (children → parent).
   * OBLIGATOIRE pour le calcul de scores : les feuilles doivent être calculées
   * avant que le parent puisse agréger leurs résultats.
   *
   * Exemple : pour calculer le score de "Risque Financier",
   * on doit d'abord avoir scoré "Endettement", "Liquidité", etc.
   */
  static traverseBottomUp(
    tree: ModelTree,
    callback: (node: NodeMeta) => void
  ): void {
    const visited = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // On traite LES ENFANTS D'ABORD (post-ordre), puis le parent
      const children = tree.childrenOf.get(nodeId) || [];
      for (const childId of children) {
        visit(childId);
      }

      const node = tree.nodesById.get(nodeId);
      if (node) callback(node);
    };

    for (const rootId of tree.rootNodeIds) {
      visit(rootId);
    }
  }

  /**
   * Get the path from root to a node (useful for UI breadcrumbs).
   */
  static getNodePath(tree: ModelTree, nodeId: string): NodeMeta[] {
    const path: NodeMeta[] = [];
    let current = nodeId;
    const visited = new Set<string>();
    while (current && !visited.has(current)) {
      visited.add(current);
      const node = tree.nodesById.get(current);
      if (!node) break;
      path.unshift(node);
      current = node.parentNodeId || "";
    }
    return path;
  }

  /**
   * Clear cache (useful for testing or when model changes).
   */
  static clearCache(): void {
    modelCache.clear();
  }

  /**
   * Invalidate a specific version from cache.
   */
  static invalidateVersion(versionId: string): void {
    modelCache.delete(versionId);
  }
}
