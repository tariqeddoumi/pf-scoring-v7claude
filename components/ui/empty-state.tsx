import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * État vide.
 *
 * Les écrans affichaient « Aucune donnée », « Aucun résultat » ou un tableau vide sans
 * en-tête, selon l'endroit — et jamais ce qu'il fallait faire ensuite. Un état vide
 * utile dit ce qui manque et propose l'action qui le comble.
 */
export function EmptyState({
  titre,
  description,
  action,
  icone,
  className,
}: {
  titre: string;
  description?: string;
  action?: { href: string; libelle: string };
  icone?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-12 text-center", className)}>
      {icone && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center text-muted-foreground">
          {icone}
        </div>
      )}
      <p className="text-[15px] font-medium text-foreground">{titre}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {action.libelle}
        </Link>
      )}
    </div>
  );
}
