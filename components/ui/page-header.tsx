import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * En-tête d'écran : titre, contexte, actions.
 *
 * Chacun des trente-six écrans composait le sien : tailles de titre, espacements et
 * placement des actions variaient d'un écran à l'autre. Une seule définition ici, et
 * la page ne s'occupe plus que de son contenu.
 */
export function PageHeader({
  titre,
  description,
  retour,
  actions,
  meta,
}: {
  titre: string;
  description?: string;
  /** Lien de retour, pour les écrans de détail et de formulaire. */
  retour?: { href: string; libelle: string };
  actions?: React.ReactNode;
  /** Éléments de contexte affichés sous le titre (statut, note, dates…). */
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      {retour && (
        <Link
          href={retour.href}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          {retour.libelle}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
            {titre}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
