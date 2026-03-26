import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">PF Scoring</h1>
        <p className="mt-2 text-muted-foreground">
          Application de Scoring Project Finance
        </p>
        <p className="text-sm text-muted-foreground">
          Conforme IFC, EBRD, Basel, Bank Al-Maghrib
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
        >
          Tableau de bord
        </Link>
        <Link
          href="/projects"
          className="rounded-lg bg-secondary px-6 py-3 text-secondary-foreground hover:opacity-90"
        >
          Projets
        </Link>
      </div>
    </div>
  );
}
