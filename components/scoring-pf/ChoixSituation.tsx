"use client";

import { cn } from "@/lib/utils";
import { situations, type Niveau } from "@/lib/modele-pf/saisie";
import { Texte } from "./champs";
import { OrigineChamp } from "./origine";

const TONS = ["border-success/60 bg-success/10", "border-success/40 bg-success/5", "border-warning/60 bg-warning/10", "border-destructive/60 bg-destructive/10", "border-border bg-surface"];

/**
 * Choix d'une situation décrite (niveau 1 à 4, ou 5 = « Info. insuffisante ») pour un
 * sous-critère ou un indicateur N4 à N6, avec son commentaire : exigé dès que la
 * situation est critique ou l'information insuffisante.
 */
export function ChoixSituation({ cle, libelle, secteur, niveau, commentaire, onNiveau, onCommentaire, lecture, manquant, aideCommentaire }: {
  cle: string; libelle: string; secteur: string | null; niveau: Niveau | null | undefined; commentaire: string;
  onNiveau: (n: Niveau | null) => void; onCommentaire: (t: string) => void; lecture: boolean; manquant?: boolean; aideCommentaire?: string;
}) {
  const opts = situations(cle, secteur);
  const exige = (niveau ?? 0) >= 4;
  return (
    <fieldset id={`pf-${cle}`} className={cn("scroll-mt-40 rounded-md border p-3", manquant ? "border-warning" : "border-border")}>
      <legend className="px-1 text-[13px] font-semibold text-foreground">
        <span className="font-mono text-muted-foreground">{cle}</span> {libelle}
        {manquant && <span className="ml-1.5 rounded bg-warning/15 px-1 py-px text-[10.5px] font-semibold text-warning">À saisir</span>}
      </legend>
      <div className="space-y-1">
        {opts.map((o, i) => {
          const n = (i + 1) as Niveau;
          const [tete, ...reste] = o.split(" — ");
          const choisi = niveau === n;
          return (
            <label key={n} className={cn("flex cursor-pointer items-start gap-2 rounded border px-2 py-1.5 text-[12.5px] transition-colors",
              choisi ? TONS[i] : "border-transparent hover:bg-surface", lecture && "cursor-default")}>
              <input type="radio" name={`pf-situation-${cle}`} className="mt-0.5" checked={choisi} disabled={lecture}
                onChange={() => onNiveau(n)} onClick={() => { if (choisi && !lecture) onNiveau(null); }} />
              <span>
                <span className="font-semibold text-foreground">{tete}</span>
                {reste.length > 0 && <span className="text-muted-foreground"> — {reste.join(" — ")}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <OrigineChamp cle={cle} />
      <div className="mt-2">
        <label htmlFor={`pf-champ-${cle}-commentaire`} className="mb-1 block text-[12px] font-medium text-foreground">
          {aideCommentaire ?? "Commentaire"}{exige && <span className="ml-0.5 text-destructive">*</span>}
        </label>
        <Texte cible={`${cle}-commentaire`} valeur={commentaire} onChange={onCommentaire} lecture={lecture} lignes={2} max={2000}
          manquant={exige && !commentaire.trim()}
          placeholder={exige ? "Exigé : faits constatés et pièces à l'appui" : "Faits constatés, pièces à l'appui"} />
        <OrigineChamp cle={/^N[4-6]$/.test(cle) ? `${cle}.justification` : `${cle}.commentaire`} />
      </div>
    </fieldset>
  );
}
