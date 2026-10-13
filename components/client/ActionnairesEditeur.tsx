"use client";

import { AlertTriangle, Info, Plus, Trash2 } from "lucide-react";
import {
  controlesActionnariat,
  nouvelleLigneActionnaire,
  type LigneActionnaire,
} from "@/lib/clients/saisie";
import {
  QUALITES_ACTIONNAIRE,
  SEUIL_BENEFICIAIRE_EFFECTIF,
  TYPES_PERSONNE,
} from "@/lib/referentiels";
import { CLASSE_CHAMP } from "@/components/ui/form-fields";

/**
 * Actionnaires, dirigeants et bénéficiaires effectifs (connaissance du client,
 * LBC/FT) : une ligne par personne. Les contrôles signalent une détention totale
 * au-delà de 100 %, l'absence de bénéficiaire effectif déclaré et les personnes
 * physiques au-delà du seuil non déclarées.
 */
export function ActionnairesEditeur({
  lignes,
  onChange,
  erreur,
}: {
  lignes: LigneActionnaire[];
  onChange: (lignes: LigneActionnaire[]) => void;
  erreur?: string;
}) {
  const ctl = controlesActionnariat(lignes, SEUIL_BENEFICIAIRE_EFFECTIF);
  const maj = (i: number, champ: Partial<LigneActionnaire>) =>
    onChange(lignes.map((l, j) => (j === i ? { ...l, ...champ } : l)));

  return (
    <div>
      {lignes.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          Aucun actionnaire ni dirigeant renseigné.
        </p>
      ) : (
        <ul className="space-y-3">
          {lignes.map((l, i) => {
            const id = (c: string) => `act-${l.cle}-${c}`;
            return (
              <li
                key={l.cle}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
                  <div className="col-span-2 lg:col-span-4">
                    <label
                      htmlFor={id("nom")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      Nom ou dénomination
                    </label>
                    <input
                      id={id("nom")}
                      value={l.nom}
                      onChange={(e) => maj(i, { nom: e.target.value })}
                      className={CLASSE_CHAMP}
                    />
                  </div>
                  <div className="col-span-1 lg:col-span-3">
                    <label
                      htmlFor={id("type")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      Type
                    </label>
                    <select
                      id={id("type")}
                      value={l.typePersonne}
                      onChange={(e) =>
                        maj(i, {
                          typePersonne: e.target
                            .value as LigneActionnaire["typePersonne"],
                          // Une personne morale n'est pas bénéficiaire effectif : on remonte la chaîne.
                          ...(e.target.value === "Personne morale"
                            ? { beneficiaireEffectif: false }
                            : {}),
                        })
                      }
                      className={CLASSE_CHAMP}
                    >
                      {TYPES_PERSONNE.map((o) => (
                        <option key={o.valeur} value={o.valeur}>
                          {o.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 lg:col-span-3">
                    <label
                      htmlFor={id("qualite")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      Qualité
                    </label>
                    <select
                      id={id("qualite")}
                      value={l.qualite}
                      onChange={(e) =>
                        maj(i, {
                          qualite: e.target
                            .value as LigneActionnaire["qualite"],
                        })
                      }
                      className={CLASSE_CHAMP}
                    >
                      {QUALITES_ACTIONNAIRE.map((o) => (
                        <option key={o.valeur} value={o.valeur}>
                          {o.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1 lg:col-span-2">
                    <label
                      htmlFor={id("pct")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      Détention
                    </label>
                    <div className="relative">
                      <input
                        id={id("pct")}
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={l.pourcentage}
                        onChange={(e) =>
                          maj(i, { pourcentage: e.target.value })
                        }
                        className={`${CLASSE_CHAMP} tabulaire pr-8`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="col-span-1 lg:col-span-4">
                    <label
                      htmlFor={id("pays")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      {l.typePersonne === "Personne morale"
                        ? "Pays d'immatriculation"
                        : "Pays de résidence"}
                    </label>
                    <input
                      id={id("pays")}
                      value={l.pays}
                      onChange={(e) => maj(i, { pays: e.target.value })}
                      className={CLASSE_CHAMP}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-4">
                    <label
                      htmlFor={id("ident")}
                      className="mb-1 block text-[12px] font-medium text-foreground"
                    >
                      {l.typePersonne === "Personne morale"
                        ? "RC ou ICE"
                        : "Pièce d'identité"}
                    </label>
                    <input
                      id={id("ident")}
                      value={l.identifiant}
                      onChange={(e) => maj(i, { identifiant: e.target.value })}
                      className={CLASSE_CHAMP}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 col-span-2 lg:col-span-4 lg:pt-5">
                    <label className="inline-flex items-center gap-2 text-[12.5px] text-foreground">
                      <input
                        type="checkbox"
                        checked={l.beneficiaireEffectif}
                        disabled={l.typePersonne === "Personne morale"}
                        onChange={(e) =>
                          maj(i, { beneficiaireEffectif: e.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      Bénéficiaire effectif
                    </label>
                    <label className="inline-flex items-center gap-2 text-[12.5px] text-foreground">
                      <input
                        type="checkbox"
                        checked={l.ppe}
                        onChange={(e) => maj(i, { ppe: e.target.checked })}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      PPE
                    </label>
                    <button
                      type="button"
                      onClick={() => onChange(lignes.filter((_, j) => j !== i))}
                      aria-label={`Retirer ${l.nom || "cette ligne"}`}
                      className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onChange([...lignes, nouvelleLigneActionnaire()])}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Plus size={15} />
          Ajouter un actionnaire ou dirigeant
        </button>
        {ctl.nombre > 0 && (
          <span
            className={`tabulaire text-[12.5px] ${ctl.depasse ? "font-semibold text-destructive" : "text-muted-foreground"}`}
          >
            Détention renseignée :{" "}
            {ctl.total.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-1.5 text-[12.5px]">
        {erreur && (
          <li className="flex items-start gap-1.5 text-destructive">
            <AlertTriangle size={14} className="mt-[2px] shrink-0" />
            {erreur}
          </li>
        )}
        {ctl.depasse && !erreur && (
          <li className="flex items-start gap-1.5 text-destructive">
            <AlertTriangle size={14} className="mt-[2px] shrink-0" />
            La somme des détentions dépasse 100 %.
          </li>
        )}
        {ctl.aDeclarer.length > 0 && (
          <li className="flex items-start gap-1.5 text-warning">
            <AlertTriangle size={14} className="mt-[2px] shrink-0" />
            {ctl.aDeclarer.join(", ")} détien
            {ctl.aDeclarer.length > 1 ? "nent" : "t"} au moins{" "}
            {SEUIL_BENEFICIAIRE_EFFECTIF} % : bénéficiaire effectif à déclarer.
          </li>
        )}
        {ctl.aucunBeneficiaire && ctl.aDeclarer.length === 0 && (
          <li className="flex items-start gap-1.5 text-warning">
            <AlertTriangle size={14} className="mt-[2px] shrink-0" />
            Aucun bénéficiaire effectif déclaré : à défaut de détenteur
            d&apos;au moins {SEUIL_BENEFICIAIRE_EFFECTIF} %, retenez le
            dirigeant qui exerce le contrôle.
          </li>
        )}
        {lignes.length === 0 && (
          <li className="flex items-start gap-1.5 text-muted-foreground">
            <Info size={14} className="mt-[2px] shrink-0" />
            Identifiez les personnes physiques qui détiennent, directement ou
            indirectement, au moins {SEUIL_BENEFICIAIRE_EFFECTIF} % du capital
            ou des droits de vote, ou qui exercent le contrôle.
          </li>
        )}
      </ul>
    </div>
  );
}
