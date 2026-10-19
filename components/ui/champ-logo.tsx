"use client";

import { useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { LOGO_TAILLE_MAX, LOGO_TYPES, motifLogoInvalide } from "@/lib/logo";

/**
 * Logo : aperçu, adresse web, ou image déposée depuis le poste (enregistrée avec le
 * paramétrage, sans dépendre du stockage de fichiers).
 */
export function ChampLogo({ id, valeur, onChange, placeholder = "https://www.mabanque.ma/logo.png" }: {
  id: string; valeur: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const fichier = useRef<HTMLInputElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const depose = valeur.startsWith("data:");
  const motif = motifLogoInvalide(valeur);

  function lire(f: File | undefined) {
    setErreur(null);
    if (!f) return;
    if (!(LOGO_TYPES as readonly string[]).includes(f.type)) { setErreur("Format accepté : PNG, JPEG, WebP ou SVG."); return; }
    if (f.size > LOGO_TAILLE_MAX) { setErreur(`Image trop lourde (${Math.ceil(f.size / 1024)} Ko) : ${Math.ceil(LOGO_TAILLE_MAX / 1024)} Ko au plus.`); return; }
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface">
          {valeur && !motif ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valeur} alt="Aperçu du logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageUp size={18} className="text-muted-foreground" aria-hidden />
          )}
        </span>
        <div className="flex min-w-0 flex-wrap gap-2">
          <button type="button" onClick={() => fichier.current?.click()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] font-medium hover:bg-accent">
            <ImageUp size={14} /> Déposer une image
          </button>
          {valeur && (
            <button type="button" onClick={() => { onChange(""); setErreur(null); }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] text-muted-foreground hover:text-destructive">
              <X size={14} /> Retirer
            </button>
          )}
          <input ref={fichier} type="file" accept={LOGO_TYPES.join(",")} className="sr-only" aria-label="Fichier du logo"
            onChange={(e) => { lire(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      {depose ? (
        <p className="text-[12px] text-muted-foreground">Image déposée ({Math.ceil((valeur.length * 3) / 4 / 1024)} Ko) — ou remplacez-la par une adresse web.</p>
      ) : (
        <input id={id} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
      )}
      {(erreur || motif) && <p role="alert" className="text-[12px] text-destructive">{erreur ?? motif}</p>}
      <p className="text-[11.5px] text-muted-foreground">PNG, JPEG, WebP ou SVG, {Math.ceil(LOGO_TAILLE_MAX / 1024)} Ko au plus ; format carré ou horizontal sur fond transparent de préférence.</p>
    </div>
  );
}
