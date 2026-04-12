import { useState, useCallback } from "react";

interface UseOptimisticDeleteProps<T> {
  items: T[];
  itemId: string;
  getItemKey?: (item: T) => string;
  onDelete: (id: string) => Promise<void>;
}

export function useOptimisticDelete<T>({
  items,
  itemId,
  getItemKey = (item: any) => item.id,
  onDelete,
}: UseOptimisticDeleteProps<T>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedItems, setDeletedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Find and remove the item optimistically
  const deletedItem = items.find((item) => getItemKey(item) === itemId);

  const handleOptimisticDelete = useCallback(async () => {
    if (!deletedItem) return;

    try {
      setIsDeleting(true);
      setError(null);

      // Optimistically update UI
      setDeletedItems((prev) => [...prev, itemId]);

      // Make API call
      await onDelete(itemId);

      // Keep the item deleted
      setDeletedItems((prev) => prev.filter((id) => id !== itemId));
    } catch (err) {
      // Restore the item on error
      setDeletedItems((prev) => prev.filter((id) => id !== itemId));
      setError(err instanceof Error ? err.message : "Failed to delete item");
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [deletedItem, itemId, onDelete]);

  const filteredItems = items.filter(
    (item) => !deletedItems.includes(getItemKey(item))
  );

  return {
    filteredItems,
    isDeleting,
    error,
    handleOptimisticDelete,
    clearError: () => setError(null),
  };
}
