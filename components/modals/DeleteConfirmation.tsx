/**
 * Reusable Delete Confirmation Modal
 * Used in all list pages for consistent deletion workflow
 */

interface DeleteConfirmationProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmation({
  isOpen,
  title = 'Confirmer la suppression',
  message = 'Êtes-vous sûr ? Cette action est irréversible.',
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm w-full">
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
