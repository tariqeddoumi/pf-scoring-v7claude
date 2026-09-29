"use client";

import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { formatMADCompact } from "@/lib/utils";

/**
 * Éléments de formulaire partagés.
 *
 * Les quatre formulaires de l'application (client, projet, en création comme en
 * modification) redéfinissaient chacun leurs champs, avec des classes divergentes et,
 * surtout, des libellés jamais associés à leur champ : un clic sur le libellé ne
 * donnait pas le focus et les lecteurs d'écran n'annonçaient rien.
 */

export const CLASSE_CHAMP =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none";

export function Etiquette({
  cle,
  libelle,
  obligatoire,
}: {
  cle: string;
  libelle: string;
  obligatoire?: boolean;
}) {
  return (
    <label
      htmlFor={`champ-${cle}`}
      className="mb-1 block text-[12.5px] font-medium text-foreground"
    >
      {libelle}
      {obligatoire && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

export function Aide({ texte, erreur }: { texte?: string; erreur?: string }) {
  if (erreur) return <p className="mt-1 text-[12px] text-destructive">{erreur}</p>;
  if (texte) return <p className="mt-1 text-[12px] text-muted-foreground">{texte}</p>;
  return null;
}

export function Champ({
  cle,
  libelle,
  valeur,
  onChange,
  type = "text",
  placeholder,
  aide,
  erreur,
  obligatoire,
  multiligne,
  lignes = 3,
  suffixe,
}: {
  cle: string;
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  aide?: string;
  erreur?: string;
  obligatoire?: boolean;
  multiligne?: boolean;
  lignes?: number;
  /** Unité affichée dans le champ : ans, %, x, MW… */
  suffixe?: string;
}) {
  return (
    <div>
      <Etiquette cle={cle} libelle={libelle} obligatoire={obligatoire} />
      {multiligne ? (
        <textarea
          id={`champ-${cle}`}
          value={valeur}
          rows={lignes}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={CLASSE_CHAMP}
        />
      ) : (
        <div className="relative">
          <input
            id={`champ-${cle}`}
            type={type}
            value={valeur}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-invalid={erreur ? true : undefined}
            className={`${CLASSE_CHAMP} ${suffixe ? "pr-12 tabulaire" : ""} ${
              erreur ? "border-destructive" : ""
            }`}
          />
          {suffixe && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">
              {suffixe}
            </span>
          )}
        </div>
      )}
      <Aide texte={aide} erreur={erreur} />
    </div>
  );
}

/**
 * Montant : la saisie brute d'un milliard se fait à un zéro près. La valeur est
 * relue en clair sous le champ.
 */
export function ChampMontant({
  cle,
  libelle,
  valeur,
  onChange,
  erreur,
  devise = "MAD",
  aide,
}: {
  cle: string;
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  erreur?: string;
  devise?: string;
  aide?: string;
}) {
  const nombre = valeur.trim() === "" ? null : Number(valeur);
  const lisible =
    nombre !== null && Number.isFinite(nombre)
      ? devise === "MAD"
        ? formatMADCompact(nombre)
        : `${nombre.toLocaleString("fr-FR")} ${devise}`
      : undefined;
  return (
    <div>
      {/* L'unité suit la devise du projet : le libellé « (MAD) » était codé en dur,
          y compris sur un financement en euros. */}
      <Etiquette cle={cle} libelle={`${libelle} (${devise})`} />
      <input
        id={`champ-${cle}`}
        type="number"
        min={0}
        step="1000"
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-invalid={erreur ? true : undefined}
        className={`${CLASSE_CHAMP} tabulaire ${erreur ? "border-destructive" : ""}`}
      />
      <Aide texte={lisible ? `= ${lisible}` : aide} erreur={erreur} />
    </div>
  );
}

export interface OptionChoix {
  valeur: string;
  libelle: string;
  aide?: string;
}

export function Selecteur({
  cle,
  libelle,
  valeur,
  onChange,
  options,
  aide,
  obligatoire,
  erreur,
}: {
  cle: string;
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  options: OptionChoix[];
  aide?: string;
  obligatoire?: boolean;
  erreur?: string;
}) {
  // Une valeur héritée absente du référentiel reste proposée : sinon la fiche
  // afficherait « Sélectionner » et un simple enregistrement l'effacerait.
  const inconnue = valeur && !options.some((o) => o.valeur === valeur);
  const aideOption = options.find((o) => o.valeur === valeur)?.aide;
  return (
    <div>
      <Etiquette cle={cle} libelle={libelle} obligatoire={obligatoire} />
      <select
        id={`champ-${cle}`}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className={`${CLASSE_CHAMP} ${erreur ? "border-destructive" : ""}`}
      >
        <option value="">— Non renseigné —</option>
        {inconnue && <option value={valeur}>{valeur} (hors référentiel)</option>}
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </select>
      <Aide texte={aideOption ?? aide} erreur={erreur} />
    </div>
  );
}

/** Liste de référence avec saisie libre possible, pour secteur ou gestionnaire. */
export function SelecteurLibre({
  cle,
  libelle,
  valeur,
  onChange,
  options,
  aide,
}: {
  cle: string;
  libelle: string;
  valeur: string;
  onChange: (v: string) => void;
  options: OptionChoix[];
  aide?: string;
}) {
  return (
    <div>
      <Etiquette cle={cle} libelle={libelle} />
      <input
        id={`champ-${cle}`}
        list={`liste-${cle}`}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        className={CLASSE_CHAMP}
      />
      <datalist id={`liste-${cle}`}>
        {options.map((o) => (
          <option key={o.valeur} value={o.valeur}>
            {o.libelle}
          </option>
        ))}
      </datalist>
      <Aide texte={aide} />
    </div>
  );
}

/**
 * Barre d'actions suivant le défilement : les formulaires font plusieurs écrans de
 * haut et leur bouton d'enregistrement était au fond du dernier onglet.
 */
export function BarreActions({
  libelleAction,
  enCours,
  nbModifies,
  hrefAnnuler,
  desactiveSiInchange = true,
}: {
  libelleAction: string;
  enCours: boolean;
  nbModifies: number;
  hrefAnnuler: string;
  desactiveSiInchange?: boolean;
}) {
  const bloque = enCours || (desactiveSiInchange && nbModifies === 0);
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
      {nbModifies > 0 && (
        <span className="mr-auto text-[12.5px] text-muted-foreground">
          {nbModifies} champ{nbModifies > 1 ? "s" : ""} modifié
          {nbModifies > 1 ? "s" : ""}
        </span>
      )}
      <Link
        href={hrefAnnuler}
        className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        Annuler
      </Link>
      <button
        type="submit"
        disabled={bloque}
        title={
          desactiveSiInchange && nbModifies === 0
            ? "Aucune modification à enregistrer"
            : undefined
        }
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {enCours ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        {libelleAction}
      </button>
    </div>
  );
}

/** Contrôle de cohérence affiché pendant la saisie. */
export function Controle({
  etat,
  children,
}: {
  etat: "ok" | "alerte" | "erreur" | "neutre";
  children: React.ReactNode;
}) {
  const couleurs = {
    ok: "text-success",
    alerte: "text-warning",
    erreur: "text-destructive",
    neutre: "text-muted-foreground",
  } as const;
  return (
    <li className={`flex items-start gap-2 text-[12.5px] ${couleurs[etat]}`}>
      <span aria-hidden className="mt-[2px]">
        {etat === "ok" ? "✓" : etat === "neutre" ? "·" : "!"}
      </span>
      <span>{children}</span>
    </li>
  );
}
