import { cn } from "@/lib/utils";

/**
 * Bloc de contenu avec en-tête.
 *
 * Remplace les compositions « rounded-lg border bg-card » répétées d'un écran à
 * l'autre, dont les épaisseurs et les paddings divergeaient.
 */
export function SectionCard({
  titre,
  description,
  actions,
  children,
  className,
  sansPadding,
}: {
  titre?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Pour un tableau ou une liste qui gère ses propres marges intérieures. */
  sansPadding?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(titre || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {titre && (
              <h2 className="text-[14.5px] font-semibold text-foreground">{titre}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {/* Sans marge intérieure, le contenu est souvent un tableau : il défile dans la carte
          au lieu d'élargir la page sur téléphone. */}
      <div className={sansPadding ? "defilement-x overflow-x-auto" : "p-4"}>{children}</div>
    </section>
  );
}
