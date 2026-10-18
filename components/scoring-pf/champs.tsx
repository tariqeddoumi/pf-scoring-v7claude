"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SaisiePF } from "@/lib/modele-pf/saisie";
import type { ResultatPF } from "@/lib/modele-pf/moteur";
import type { ParametresModele } from "@/lib/modele-pf/parametres";

/** Ce que chaque bloc reçoit de l'écran : la saisie, sa mise à jour et le calcul en direct. */
export interface PropsBloc {
  s: SaisiePF;
  /** Modifie une copie de la saisie (la fonction peut muter son argument). */
  modifier: (f: (s: SaisiePF) => void) => void;
  r: ResultatPF;
  P: ParametresModele;
  lecture: boolean;
  voirScores: boolean;
  /** Cibles des saisies exigées encore manquantes (champ surligné). */
  manquants: Set<string>;
}

export const CLASSE_SAISIE =
  "h-8 w-full rounded border border-border bg-background px-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none disabled:opacity-70";

const libelleCls = "mb-1 block text-[12px] font-medium text-foreground";

/** Conteneur d'un champ : ancre « pf-<cible> » pour la liste des saisies manquantes. */
export function Champ({ cible, libelle, manquant, aide, children, className }: {
  cible: string; libelle: string; manquant?: boolean; aide?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div id={`pf-${cible}`} className={cn("scroll-mt-40", className)}>
      <label htmlFor={`pf-champ-${cible}`} className={libelleCls}>
        {libelle}
        {manquant && <span className="ml-1.5 rounded bg-warning/15 px-1 py-px text-[10.5px] font-semibold text-warning">À saisir</span>}
      </label>
      {children}
      {aide && <p className="mt-1 text-[11.5px] text-muted-foreground">{aide}</p>}
    </div>
  );
}

/** Nombre saisi en texte (virgule acceptée), relu en clair : la valeur ne saute pas pendant la frappe. */
export function Nombre({ cible, valeur, onChange, lecture, suffixe, min, max, placeholder, manquant }: {
  cible: string; valeur: number | null; onChange: (v: number | null) => void; lecture?: boolean;
  suffixe?: string; min?: number; max?: number; placeholder?: string; manquant?: boolean;
}) {
  const [texte, setTexte] = useState(valeur === null ? "" : String(valeur).replace(".", ","));
  useEffect(() => {
    const lu = texte.trim() === "" ? null : Number(texte.replace(/\s/g, "").replace(",", "."));
    if (lu !== valeur) setTexte(valeur === null ? "" : String(valeur).replace(".", ","));
    // Synchronisation seulement quand la valeur change de l'extérieur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur]);
  return (
    <div className="relative">
      <input
        id={`pf-champ-${cible}`}
        inputMode="decimal"
        value={texte}
        disabled={lecture}
        placeholder={placeholder}
        aria-invalid={manquant || undefined}
        onChange={(e) => {
          setTexte(e.target.value);
          const brut = e.target.value.replace(/\s/g, "").replace(",", ".");
          if (brut === "") return onChange(null);
          let n = Number(brut);
          if (!Number.isFinite(n)) return;
          if (min !== undefined) n = Math.max(min, n);
          if (max !== undefined) n = Math.min(max, n);
          onChange(n);
        }}
        className={cn(CLASSE_SAISIE, "tabulaire", suffixe && "pr-12", manquant && "border-warning")}
      />
      {suffixe && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11.5px] text-muted-foreground">{suffixe}</span>}
    </div>
  );
}

export function OuiNon({ cible, valeur, onChange, lecture, manquant }: {
  cible: string; valeur: "Oui" | "Non" | null | undefined; onChange: (v: "Oui" | "Non" | null) => void; lecture?: boolean; manquant?: boolean;
}) {
  return (
    <div id={`pf-champ-${cible}`} role="radiogroup" className={cn("inline-flex overflow-hidden rounded border", manquant ? "border-warning" : "border-border")}>
      {(["Oui", "Non"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valeur === v}
          disabled={lecture}
          onClick={() => onChange(valeur === v ? null : v)}
          className={cn("h-8 px-3 text-[12.5px] font-medium transition-colors disabled:cursor-default",
            valeur === v ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-surface")}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function Liste<T extends string>({ cible, valeur, onChange, options, lecture, vide = "Choisir…", manquant }: {
  cible: string; valeur: T | null; onChange: (v: T | null) => void; options: readonly (readonly [T, string])[];
  lecture?: boolean; vide?: string; manquant?: boolean;
}) {
  return (
    <select
      id={`pf-champ-${cible}`}
      value={valeur ?? ""}
      disabled={lecture}
      onChange={(e) => onChange((e.target.value || null) as T | null)}
      className={cn(CLASSE_SAISIE, manquant && "border-warning")}
    >
      <option value="">{vide}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Texte({ cible, valeur, onChange, lecture, lignes = 3, placeholder, max = 5000, manquant }: {
  cible: string; valeur: string; onChange: (v: string) => void; lecture?: boolean; lignes?: number; placeholder?: string; max?: number; manquant?: boolean;
}) {
  return (
    <textarea
      id={`pf-champ-${cible}`}
      value={valeur}
      rows={lignes}
      maxLength={max}
      disabled={lecture}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full rounded border border-border bg-background px-2 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none disabled:opacity-70",
        manquant && "border-warning")}
    />
  );
}

/** Valeur calculée, affichée en lecture seule à côté des saisies. */
export function Calcule({ libelle, valeur, ton }: { libelle: string; valeur: React.ReactNode; ton?: "favorable" | "vigilance" | "alerte" }) {
  const t = ton === "favorable" ? "text-success" : ton === "vigilance" ? "text-warning" : ton === "alerte" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded border border-dashed border-border px-2.5 py-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{libelle}</p>
      <p className={cn("text-[14px] font-semibold tabulaire", t)}>{valeur}</p>
    </div>
  );
}

export const fmtNombre = (v: number | null | undefined, dec = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: dec });
export const fmtPct = (v: number | null | undefined, dec = 1) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: dec })} %`;
export const fmtX = (v: number | null | undefined) =>
  v === null || v === undefined || !Number.isFinite(v) ? "—" : `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;

export function Grille2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
