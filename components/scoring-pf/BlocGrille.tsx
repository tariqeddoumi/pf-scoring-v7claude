"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOMAINES_GRILLE, type DomaineGrille } from "@/lib/modele-pf/parametres";
import { estSectoriel } from "@/lib/modele-pf/referentiel";
import { Texte, fmtNombre, fmtPct, type PropsBloc } from "./champs";
import { ChoixSituation } from "./ChoixSituation";

/** Bloc 8 : grille à situations, par domaine (D7 est le noyau, saisi à part). */
export function BlocGrille({ s, modifier, r, P, lecture, voirScores, manquants, cible }: PropsBloc & { cible?: string | null }) {
  const [ouvert, setOuvert] = useState<DomaineGrille | null>(() => premierIncomplet());
  // Un clic sur une saisie manquante de la grille ouvre son domaine.
  useEffect(() => {
    const d = cible?.match(/^(D\d)\.\d$/)?.[1] as DomaineGrille | undefined;
    if (d) setOuvert(d);
  }, [cible]);
  const poids = s.phase ? P.poidsDomaines[s.phase] : null;

  function premierIncomplet(): DomaineGrille | null {
    return DOMAINES_GRILLE.find((d) => P.sousCriteres[d].some((sc) => !s.grille[sc.cle]?.niveau)) ?? "D1";
  }

  return (
    <div className="space-y-2">
      <p className="text-[12.5px] text-muted-foreground">
        Pour chaque sous-critère, choisissez la situation décrite qui correspond au dossier.
        Les descriptions marquées « secteur » sont propres au secteur choisi. Complétude de la grille : <strong className="text-foreground">{fmtPct(r.completude, 0)}</strong>.
      </p>
      {DOMAINES_GRILLE.map((dom) => {
        const scs = P.sousCriteres[dom];
        const faits = scs.filter((sc) => s.grille[sc.cle]?.niveau).length;
        const sansPoids = poids !== null && poids[dom] <= 0;
        const aSaisir = scs.some((sc) => manquants.has(sc.cle));
        const estOuvert = ouvert === dom;
        return (
          <section key={dom} className="rounded-lg border border-border bg-card">
            <button type="button" aria-expanded={estOuvert} onClick={() => setOuvert(estOuvert ? null : dom)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="font-mono text-[12.5px] text-muted-foreground">{dom}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-foreground">{P.libellesDomaines[dom]}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {faits}/{scs.length} sous-critères{poids ? ` · poids ${fmtPct(poids[dom], 0)}` : ""}{sansPoids ? " · sans poids dans cette phase" : ""}
                </span>
              </span>
              {aSaisir && <span className="rounded bg-warning/15 px-1.5 py-px text-[10.5px] font-semibold text-warning">À saisir</span>}
              {voirScores && r.domaines?.[dom] !== undefined && (
                <span className="rounded bg-surface px-2 py-0.5 text-[13px] font-semibold tabulaire" title="Note du domaine (sur 100)">{fmtNombre(r.domaines[dom], 1)}</span>
              )}
              <ChevronDown size={16} className={cn("shrink-0 text-muted-foreground transition-transform", estOuvert && "rotate-180")} />
            </button>
            {estOuvert && (
              <div className="space-y-3 border-t border-border p-4">
                <div className="grid gap-3 xl:grid-cols-2">
                  {scs.map((sc) => (
                    <ChoixSituation key={sc.cle} cle={sc.cle}
                      libelle={`${sc.libelle} (${fmtPct(sc.poids, 0)})${estSectoriel(sc.cle) && s.secteur ? " · secteur" : ""}`}
                      secteur={s.secteur} niveau={s.grille[sc.cle]?.niveau} commentaire={s.grille[sc.cle]?.commentaire ?? ""}
                      lecture={lecture} manquant={manquants.has(sc.cle)}
                      onNiveau={(n) => modifier((x) => { x.grille[sc.cle] = { niveau: n, commentaire: x.grille[sc.cle]?.commentaire ?? "" }; })}
                      onCommentaire={(t) => modifier((x) => { x.grille[sc.cle] = { niveau: x.grille[sc.cle]?.niveau ?? null, commentaire: t }; })} />
                  ))}
                </div>
                <div>
                  <label htmlFor={`pf-champ-comm-${dom}`} className="mb-1 block text-[12px] font-medium text-foreground">Commentaire du domaine</label>
                  <Texte cible={`comm-${dom}`} valeur={s.commentairesDomaines[dom] ?? ""} lecture={lecture} lignes={2}
                    onChange={(t) => modifier((x) => { x.commentairesDomaines[dom] = t; })} />
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
