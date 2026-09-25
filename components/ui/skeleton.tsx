import { cn } from "@/lib/utils";

/** Bloc de chargement. Évite le saut de mise en page pendant une attente. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
