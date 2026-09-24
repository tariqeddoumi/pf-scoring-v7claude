"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle, Info, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import {
  LIBELLES_SEVERITE,
  LIBELLES_TYPE,
  type Alerte,
  type SeveriteAlerte,
} from "@/lib/services/alert-derivation";

const STYLE_SEVERITE: Record<SeveriteAlerte, string> = {
  critique: "border-destructive/50 bg-destructive/10",
  vigilance: "border-warning/50 bg-warning/10",
  information: "border-ring/50 bg-primary/10",
};

function IconeSeverite({ severite }: { severite: SeveriteAlerte }) {
  if (severite === "critique")
    return <AlertCircle className="text-destructive shrink-0" size={20} />;
  if (severite === "vigilance")
    return <AlertCircle className="text-warning shrink-0" size={20} />;
  return <Info className="text-primary shrink-0" size={20} />;
}

/**
 * Alertes du portefeuille.
 *
 * L'écran affichait quatre alertes fabriquées, nommant des projets inexistants avec
 * des ratios inventés. Les alertes sont désormais dérivées des évaluations réellement
 * calculées. Elles ne se suppriment ni ne se marquent comme lues : une alerte n'est
 * pas un message, c'est l'état d'un dossier — elle disparaît quand la condition qui
 * l'a produite cesse, et écarter d'un clic un seuil rédhibitoire n'aurait aucun sens.
 */
export default function AlertsPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [filtre, setFiltre] = useState<SeveriteAlerte | "toutes">("toutes");

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/alerts");
      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(corps.error ?? "Chargement impossible.");
      }
      setAlertes((await res.json()).data ?? []);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const parSeverite = useMemo(
    () => ({
      critique: alertes.filter((a) => a.severite === "critique").length,
      vigilance: alertes.filter((a) => a.severite === "vigilance").length,
      information: alertes.filter((a) => a.severite === "information").length,
    }),
    [alertes]
  );

  const visibles = useMemo(
    () => (filtre === "toutes" ? alertes : alertes.filter((a) => a.severite === filtre)),
    [alertes, filtre]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Alertes</h1>
        <p className="text-muted-foreground mt-2">
          Conditions relevées sur les évaluations calculées. Une alerte disparaît
          d&apos;elle-même lorsque la situation qui l&apos;a produite est corrigée.
        </p>
      </div>

      {erreur && (
        <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {erreur}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <BoutonFiltre
          actif={filtre === "toutes"}
          onClick={() => setFiltre("toutes")}
          label="Toutes"
          valeur={alertes.length}
        />
        {(["critique", "vigilance", "information"] as SeveriteAlerte[]).map((s) => (
          <BoutonFiltre
            key={s}
            actif={filtre === s}
            onClick={() => setFiltre(s)}
            label={LIBELLES_SEVERITE[s]}
            valeur={parSeverite[s]}
          />
        ))}
      </div>

      <div className="space-y-3">
        {visibles.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="mx-auto text-success mb-3" size={32} />
            <p className="text-foreground font-semibold">
              {alertes.length === 0
                ? "Aucune alerte"
                : "Aucune alerte de ce niveau"}
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {alertes.length === 0
                ? "Aucune évaluation calculée ne présente de condition à signaler."
                : "Changez de filtre pour voir les autres."}
            </p>
          </Card>
        ) : (
          visibles.map((alerte) => (
            <div
              key={alerte.id}
              className={`rounded-lg border p-4 ${STYLE_SEVERITE[alerte.severite]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <IconeSeverite severite={alerte.severite} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-semibold text-foreground">
                        {alerte.titre}
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {alerte.projectName}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-foreground mt-1">
                      {alerte.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">
                        {LIBELLES_TYPE[alerte.type]}
                      </span>
                      <span>
                        Dernier calcul :{" "}
                        {new Date(alerte.date).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={alerte.lienAction}
                  className="p-2 text-primary hover:bg-accent rounded-lg transition-colors shrink-0"
                  aria-label={`Ouvrir l'évaluation — ${alerte.titre}`}
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BoutonFiltre({
  actif,
  onClick,
  label,
  valeur,
}: {
  actif: boolean;
  onClick: () => void;
  label: string;
  valeur: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className={`rounded-lg border p-4 text-left transition-colors ${
        actif
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:bg-accent"
      }`}
    >
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{valeur}</p>
    </button>
  );
}
