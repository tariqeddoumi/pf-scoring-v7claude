"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-2xl font-semibold text-foreground">Une erreur est survenue</h1>
        <p className="mb-5 text-sm text-muted-foreground">
          {error.message || "L'écran n'a pas pu s'afficher."}
          {error.digest && <span className="mt-1 block text-xs">Référence : {error.digest}</span>}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
          <Link href="/dashboard" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm text-foreground hover:bg-accent">
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
