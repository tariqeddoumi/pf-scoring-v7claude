"use client";

import { createContext, useContext } from "react";
import { Calculator, ClipboardPaste, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaisiePF } from "@/lib/modele-pf/saisie";
import { afficherValeur, lireChamp, libelleChamp } from "@/lib/modele-pf/champs-ia";
import { LIBELLES_CONFIANCE, LIBELLES_ORIGINE, memeValeur, type OrigineChamp, type TypeOrigine } from "@/lib/modele-pf/origines";

/** Saisie affichée : donne accès aux origines des valeurs depuis n'importe quel champ. */
export const SaisieContexte = createContext<SaisiePF | null>(null);

const ICONES: Record<TypeOrigine, typeof Sparkles> = { ia: Sparkles, calcul: Calculator, reference: BookOpen, collage: ClipboardPaste };

const dateCourte = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
};

function lire(s: SaisiePF | null, cle: string): { o: OrigineChamp; conforme: boolean } | null {
  const o = s?.origines?.[cle];
  if (!s || !o) return null;
  return { o, conforme: memeValeur(lireChamp(s, cle), o.valeur) };
}

/** Phrase d'origine d'une valeur : « Proposé par l'IA le … · Source : … · confiance … ». */
function phrase(o: OrigineChamp): string {
  const date = dateCourte(o.le);
  return [
    `${LIBELLES_ORIGINE[o.type]}${date ? ` le ${date}` : ""}`,
    o.source && (o.type === "ia" ? `Source : ${o.source}` : o.source),
    o.confiance && LIBELLES_CONFIANCE[o.confiance],
  ].filter(Boolean).join(" · ");
}

/**
 * Commentaire d'origine sous un champ : d'où vient la valeur, avec la justification de
 * l'IA dépliable. Si l'analyste a changé la valeur depuis, l'origine reste lisible
 * comme valeur initiale.
 */
export function OrigineChamp({ cle, className }: { cle: string; className?: string }) {
  const s = useContext(SaisieContexte);
  const lu = lire(s, cle);
  if (!lu) return null;
  const { o, conforme } = lu;
  const Icone = ICONES[o.type];
  const tete = conforme
    ? phrase(o)
    : `Modifié par l'analyste — valeur initiale « ${afficherValeur(cle, o.valeur)} » (${phrase(o).charAt(0).toLowerCase()}${phrase(o).slice(1)})`;
  const contenu = (
    <>
      <Icone size={12} className="mt-px shrink-0" aria-hidden />
      <span>{tete}</span>
    </>
  );
  const ton = conforme ? "text-primary" : "text-muted-foreground";
  if (!o.detail) return <p className={cn("mt-1 flex items-start gap-1 text-[11.5px]", ton, className)}>{contenu}</p>;
  return (
    <details className={cn("mt-1 text-[11.5px]", className)}>
      <summary className={cn("flex cursor-pointer list-none items-start gap-1", ton)}>{contenu}</summary>
      <p className="mt-1 whitespace-pre-line border-l-2 border-border pl-2 text-muted-foreground">{o.detail}</p>
    </details>
  );
}

/** Repère d'origine d'une ligne de tableau : icône et détail au survol, pour une ou plusieurs clés. */
export function MarqueOrigine({ cles }: { cles: string[] }) {
  const s = useContext(SaisieContexte);
  const lus = cles.map((c) => ({ c, lu: lire(s, c) })).filter((x) => x.lu);
  if (!s || !lus.length) return null;
  const types = new Set(lus.map((x) => x.lu!.o.type));
  const Icone = types.size === 1 ? ICONES[[...types][0]] : Sparkles;
  const modifie = lus.some((x) => !x.lu!.conforme);
  const texte = lus.map(({ c, lu }) => `${libelleChamp(c, s)} : ${phrase(lu!.o)}${lu!.conforme ? "" : ` (modifié depuis ; valeur initiale ${afficherValeur(c, lu!.o.valeur)})`}`).join("\n");
  return (
    <span title={texte} aria-label={texte} role="img" className={cn("inline-flex", modifie ? "text-muted-foreground" : "text-primary")}>
      <Icone size={13} />
    </span>
  );
}

/** Résumé des sources d'un tableau : « 12 valeurs proposées par l'IA · Source : … ». */
export function ResumeOrigines({ prefixe, className }: { prefixe: RegExp; className?: string }) {
  const s = useContext(SaisieContexte);
  if (!s) return null;
  const lus = Object.entries(s.origines ?? {}).filter(([c]) => prefixe.test(c));
  if (!lus.length) return null;
  const parType = new Map<TypeOrigine, Set<string>>();
  for (const [, o] of lus) {
    if (!parType.has(o.type)) parType.set(o.type, new Set());
    if (o.source) parType.get(o.type)!.add(o.source);
  }
  return (
    <div className={cn("space-y-0.5 border-b border-border px-4 py-2 text-[11.5px] text-primary", className)}>
      {[...parType].map(([type, sources]) => {
        const Icone = ICONES[type];
        const n = lus.filter(([, o]) => o.type === type).length;
        return (
          <p key={type} className="flex items-start gap-1">
            <Icone size={12} className="mt-px shrink-0" aria-hidden />
            <span>
              {LIBELLES_ORIGINE[type]} : {n} valeur{n > 1 ? "s" : ""}
              {sources.size > 0 && ` · ${type === "ia" ? "Source : " : ""}${[...sources].slice(0, 3).join(" ; ")}${sources.size > 3 ? "…" : ""}`}
              {" "}— détail au survol de l&apos;icône de chaque ligne
            </span>
          </p>
        );
      })}
    </div>
  );
}
