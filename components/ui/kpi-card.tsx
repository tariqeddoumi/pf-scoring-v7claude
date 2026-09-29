import { cn } from "@/lib/utils";

/**
 * Indicateur chiffré.
 *
 * Les quatre indicateurs du tableau de bord étaient des aplats en dégradé bleu, cyan,
 * violet et orange, en couleurs brutes hors de toute palette. La couleur y désignait
 * une carte, pas une information : dans un outil de risque, c'est une couleur perdue.
 * Elle est réservée ici à la valeur lorsqu'elle porte un sens — un seuil franchi, une
 * alerte — et la carte reste neutre le reste du temps.
 */
export function KpiCard({
  libelle,
  valeur,
  unite,
  precision,
  ton = "neutre",
  className,
}: {
  libelle: string;
  valeur: string | number;
  /** Unité affichée en petit à côté de la valeur : « MAD », « / 100 ». */
  unite?: string;
  /** Ligne de contexte sous la valeur : ce que le chiffre recouvre exactement. */
  precision?: string;
  ton?: "neutre" | "favorable" | "vigilance" | "alerte";
  className?: string;
}) {
  const tons = {
    neutre: "text-foreground",
    favorable: "text-success",
    vigilance: "text-warning",
    alerte: "text-destructive",
  } as const;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[27px] font-semibold leading-none tracking-tight tabulaire",
            tons[ton]
          )}
        >
          {valeur}
        </span>
        {unite && (
          <span className="text-[13px] font-normal text-muted-foreground">{unite}</span>
        )}
      </p>
      {precision && (
        <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">
          {precision}
        </p>
      )}
    </div>
  );
}
