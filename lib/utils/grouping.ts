/**
 * Grouping Utilities - Consolidate repeated grouping patterns
 * Used across multiple scoring engines
 */

/**
 * Group items by a property that references a parent
 * @example groupByParentId([{nodeId: '1', ...}, {nodeId: '2', ...}], 'nodeId')
 *          → Map('1' → [...], '2' → [...])
 */
export function groupByKey<T extends Record<K, string>, K extends keyof T>(
  items: T[],
  key: K
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const parentId = item[key] as string;
    const list = map.get(parentId) || [];
    list.push(item);
    map.set(parentId, list);
  }
  return map;
}

/**
 * Alias for grouping by nodeId specifically (most common use case)
 */
export function groupByNodeId<T extends { nodeId: string }>(items: T[]): Map<string, T[]> {
  return groupByKey(items, 'nodeId' as never);
}

/**
 * Batch items by id for faster O(1) lookups instead of O(n) search
 */
export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

/**
 * Get items from grouped map, returning empty array if key not found
 */
export function getGroupOrEmpty<T>(
  groupedMap: Map<string, T[]>,
  key: string
): T[] {
  return groupedMap.get(key) || [];
}
