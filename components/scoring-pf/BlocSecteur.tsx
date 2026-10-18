"use client";

import { SectionCard } from "@/components/ui/section-card";
import { champsSecteur } from "@/lib/modele-pf/referentiel";
import { CLASSE_SAISIE, Calcule, fmtX, type PropsBloc } from "./champs";
import { Lignes } from "./BlocFinancement";

/** Blocs 4 et 5 : données propres au secteur (avec leur source) et hypothèses d'exploitation. */
export function BlocSecteur({ s, modifier, r, P, lecture }: PropsBloc) {
  const champs = champsSecteur(s.secteur);
  const donnee = (i: number) => s.donneesSecteur[i] ?? { valeur: null, source: "" };
  const ecrire = (i: number, f: (d: { valeur: string | number | null; source: string }) => void) =>
    modifier((x) => {
      while (x.donneesSecteur.length <= i) x.donneesSecteur.push({ valeur: null, source: "" });
      f(x.donneesSecteur[i]);
    });
  return (
    <div className="space-y-4">
      <SectionCard
        titre="Bloc 4 · Données sectorielles"
        description={s.secteur ? `Données attendues pour le secteur ${P.secteurs[s.secteur].libelle}, avec la pièce d'où elles viennent.` : "Choisissez d'abord le secteur (onglet Identification)."}
      >
        {champs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée sectorielle tant que le secteur n’est pas choisi.</p>
        ) : (
          <div className="space-y-2">
            {champs.map((c, i) => (
              <div key={c.libelle} className="grid items-center gap-2 sm:grid-cols-[minmax(0,1.2fr)_10rem_minmax(0,1fr)]">
                <label htmlFor={`pf-champ-secteur-${i}`} className="text-[13px] text-foreground">
                  {c.libelle}{c.unite && <span className="text-muted-foreground"> ({c.unite})</span>}
                </label>
                <input id={`pf-champ-secteur-${i}`} value={donnee(i).valeur === null ? "" : String(donnee(i).valeur)} disabled={lecture} maxLength={200}
                  onChange={(e) => {
                    const t = e.target.value;
                    const n = Number(t.replace(/\s/g, "").replace(",", "."));
                    ecrire(i, (d) => { d.valeur = t.trim() === "" ? null : Number.isFinite(n) && /^[\d\s,.-]+$/.test(t) ? n : t; });
                  }}
                  className={`${CLASSE_SAISIE} tabulaire`} />
                <input aria-label={`Source : ${c.libelle}`} value={donnee(i).source} disabled={lecture} maxLength={300} placeholder="Source (pièce, page)"
                  onChange={(e) => ecrire(i, (d) => { d.source = e.target.value; })} className={CLASSE_SAISIE} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Calcule libelle="Écart sectoriel sur les seuils" valeur={s.secteur ? `${P.secteurs[s.secteur].delta >= 0 ? "+" : ""}${P.secteurs[s.secteur].delta.toLocaleString("fr-FR")}x` : "—"} />
          <Calcule libelle="Seuil vigilance retenu" valeur={fmtX(r.seuils?.[1])} />
          <Calcule libelle="Seuil favorable retenu" valeur={fmtX(r.seuils?.[2])} />
        </div>
      </SectionCard>

      <SectionCard titre="Bloc 5 · Hypothèses d'exploitation" description="Hypothèses clés du modèle financier du sponsor, telles que la banque les retient.">
        <Lignes
          lignes={s.hypotheses}
          lecture={lecture}
          max={20}
          libelleAjout="Ajouter une hypothèse"
          ajouter={() => modifier((x) => { x.hypotheses.push({ libelle: "", valeur: "" }); })}
          retirer={(i) => modifier((x) => { x.hypotheses.splice(i, 1); })}
          rendu={(h, i) => (
            <>
              <input aria-label={`Hypothèse ${i + 1}`} value={h.libelle} disabled={lecture} maxLength={200} placeholder="Hypothèse (ex. productible P90)"
                onChange={(e) => modifier((x) => { x.hypotheses[i].libelle = e.target.value; })} className={CLASSE_SAISIE} />
              <input aria-label={`Valeur de l'hypothèse ${i + 1}`} value={h.valeur} disabled={lecture} maxLength={300} placeholder="Valeur retenue"
                onChange={(e) => modifier((x) => { x.hypotheses[i].valeur = e.target.value; })} className={`${CLASSE_SAISIE} sm:w-64 sm:shrink-0`} />
            </>
          )}
        />
      </SectionCard>
    </div>
  );
}
