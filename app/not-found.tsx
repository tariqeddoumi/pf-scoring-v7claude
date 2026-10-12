import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-5 text-sm text-muted-foreground">Cette page n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/dashboard" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
