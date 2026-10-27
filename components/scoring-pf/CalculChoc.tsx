"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { calculerChoc } from "@/lib/modele-pf/scenarios";
import { Champ, Nombre, fmtNombre } from "./champs";

const pourcent = (v: number) => `${fmtNombre(v * 100, 1)} %`;

/**
 * Passage d'un scénario exprimé en hypothèses (baisse des recettes, hausse des charges)
 * au choc sur les CFADS, à partir du compte d'une année type. Les hypothèses repartent des
 * valeurs de référence quand la référence change (changement de secteur).
 */
export function CalculChoc({ prefixe, reference, baisseRef, hausseRef, onAppliquer }: {
  prefixe: string; reference: string | null; baisseRef: number | null; hausseRef: number | null;
  /** Choc arrondi, description des hypothèses et détail du calcul (pour l'origine de la valeur). */
  onAppliquer: (choc: number, source: string, detail: string) => void;
}) {
  const [recettes, setRecettes] = useState<number | null>(null);
  const [charges, setCharges] = useState<number | null>(null);
  const [baisse, setBaisse] = useState<number | null>(baisseRef === null ? null : baisseRef * 100);
  const [hausse, setHausse] = useState<number | null>(hausseRef === null ? null : hausseRef * 100);
  const [referenceVue, setReferenceVue] = useState(reference);
  if (referenceVue !== reference) {
    setReferenceVue(reference);
    setBaisse(baisseRef === null ? null : baisseRef * 100);
    setHausse(hausseRef === null ? null : hausseRef * 100);
  }
  const calcul = recettes !== null && charges !== null && baisse !== null && hausse !== null
    ? calculerChoc(recettes, charges, baisse / 100, hausse / 100) : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Champ cible={`${prefixe}-recettes`} libelle="Recettes d'une année type" aide="MMAD, scénario central">
          <Nombre cible={`${prefixe}-recettes`} valeur={recettes} min={0} onChange={setRecettes} />
        </Champ>
        <Champ cible={`${prefixe}-charges`} libelle="Charges d'exploitation" aide="MMAD, même année">
          <Nombre cible={`${prefixe}-charges`} valeur={charges} min={0} onChange={setCharges} />
        </Champ>
        <Champ cible={`${prefixe}-baisse`} libelle="Baisse des recettes">
          <Nombre cible={`${prefixe}-baisse`} valeur={baisse} suffixe="%" min={0} max={100} onChange={setBaisse} />
        </Champ>
        <Champ cible={`${prefixe}-hausse`} libelle="Hausse des charges">
          <Nombre cible={`${prefixe}-hausse`} valeur={hausse} suffixe="%" min={0} max={200} onChange={setHausse} />
        </Champ>
      </div>
      {recettes !== null && charges !== null && !calcul && (
        <p className="text-[12.5px] text-warning">Les recettes doivent dépasser les charges pour calculer un choc.</p>
      )}
      {calcul && recettes !== null && charges !== null && baisse !== null && hausse !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border px-3 py-2.5 text-[12.5px]">
          <p className="tabulaire">
            CFADS central {fmtNombre(calcul.cfadsCentral)} → stressé {fmtNombre(calcul.cfadsStresse)} · choc = ({fmtNombre(recettes * baisse / 100)} de recettes perdues
            {" "}+ {fmtNombre(charges * hausse / 100)} de charges en plus) ÷ {fmtNombre(calcul.cfadsCentral)} = <strong>{pourcent(calcul.choc)}</strong>
          </p>
          <button type="button" onClick={() => onAppliquer(Math.round(calcul.choc * 1000) / 1000,
            `recettes ${fmtNombre(recettes)} MMAD (− ${fmtNombre(baisse)} %), charges ${fmtNombre(charges)} MMAD (+ ${fmtNombre(hausse)} %)`,
            `CFADS central ${fmtNombre(calcul.cfadsCentral)} → stressé ${fmtNombre(calcul.cfadsStresse)} MMAD ; choc = (recettes perdues + charges supplémentaires) ÷ CFADS central = ${pourcent(calcul.choc)}.`)}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <Calculator size={14} /> Appliquer ce choc
          </button>
        </div>
      )}
    </>
  );
}
