"use client";

import Link from "next/link";
import { Champ, Liste, Nombre, OuiNon, Calcule, Grille2, fmtX, type PropsBloc } from "./champs";
import { SectionCard } from "@/components/ui/section-card";
import type { SaisiePF } from "@/lib/modele-pf/saisie";
import type { CodeRegime, CodeSecteur, CodePhase } from "@/lib/modele-pf/parametres";

export interface ProjetPF {
  id: string; nom: string; codeProjet: string | null; secteur: string | null;
  client: { id: string; nom: string; codeClientT24: string | null; radical: string | null } | null;
}

type Prop = keyof SaisiePF["proportionnalite"];

/** Blocs 1 et 2 : identification, routage (régime, secteur, phase) et proportionnalité S/M/L. */
export function BlocIdentification({ s, modifier, r, P, lecture, manquants, projet }: PropsBloc & { projet: ProjetPF }) {
  const m = (c: string) => manquants.has(c);
  const prop = <K extends Prop>(k: K, v: SaisiePF["proportionnalite"][K]) => modifier((x) => { x.proportionnalite[k] = v; });
  const pr = s.proportionnalite;
  const ouiNonProp: [Prop, string][] = [
    ["toutEnMad", "Recettes, coûts et dette en dirhams ?"], ["technologieEprouvee", "Technologie éprouvée ?"],
    ["acheteurUnique", "Acheteur principal unique ?"], ["premiereReference", "Première référence technologique ?"],
    ["consortium", "Opération consortiale ?"], ["contratPlus20Ans", "Contrat de revenus de plus de 20 ans ?"],
  ];
  return (
    <div className="space-y-4">
      <SectionCard titre="Bloc 1 · Identification et routage" description="Les codes viennent des fiches client et projet ; le routage fixe les seuils DSCR et les poids des domaines.">
        <div className="mb-4 grid gap-3 sm:grid-cols-3" id="pf-codes">
          <Code libelle="Code client T24" valeur={projet.client?.codeClientT24} lien={projet.client ? `/clients/${projet.client.id}` : undefined} manquant={m("codes")} />
          <Code libelle="Radical client" valeur={projet.client?.radical} lien={projet.client ? `/clients/${projet.client.id}` : undefined} manquant={m("codes")} />
          <Code libelle="Code projet" valeur={projet.codeProjet} lien={`/projects/${projet.id}`} manquant={m("codes")} />
        </div>
        <Grille2>
          <Champ cible="regime" libelle="Régime de revenus" manquant={m("regime")}>
            <Liste<CodeRegime> cible="regime" valeur={s.regime} lecture={lecture} manquant={m("regime")}
              onChange={(v) => modifier((x) => { x.regime = v; })}
              options={(Object.keys(P.regimes) as CodeRegime[]).map((k) => [k, `${k} — ${P.regimes[k].libelle}`] as const)} />
          </Champ>
          <Champ cible="secteur" libelle="Secteur" manquant={m("secteur")}>
            <Liste<CodeSecteur> cible="secteur" valeur={s.secteur} lecture={lecture} manquant={m("secteur")}
              onChange={(v) => modifier((x) => { x.secteur = v; x.donneesSecteur = []; })}
              options={(Object.keys(P.secteurs) as CodeSecteur[]).map((k) => [k, `${k} — ${P.secteurs[k].libelle}`] as const)} />
          </Champ>
          <Champ cible="phase" libelle="Phase" manquant={m("phase")}>
            <Liste<CodePhase> cible="phase" valeur={s.phase} lecture={lecture} manquant={m("phase")}
              onChange={(v) => modifier((x) => { x.phase = v; })}
              options={(Object.keys(P.phases) as CodePhase[]).map((k) => [k, `${k} — ${P.phases[k].libelle}`] as const)} />
          </Champ>
          <Champ cible="periodicite" libelle="Périodicité de l'échéancier">
            <Liste cible="periodicite" valeur={s.periodicite} lecture={lecture} vide="Semestrielle"
              onChange={(v) => modifier((x) => { x.periodicite = v ?? "Semestrielle"; })}
              options={[["Semestrielle", "Semestrielle"], ["Trimestrielle", "Trimestrielle"], ["Mensuelle", "Mensuelle"]] as const} />
          </Champ>
        </Grille2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Calcule libelle="Seuil critique" valeur={fmtX(r.seuils?.[0])} />
          <Calcule libelle="Seuil vigilance" valeur={fmtX(r.seuils?.[1])} />
          <Calcule libelle="Seuil favorable" valeur={fmtX(r.seuils?.[2])} />
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          Seuils DSCR = seuils du régime + écart du secteur{s.phase === "P2" ? " + majoration de montée en charge" : ""}.
        </p>
      </SectionCard>

      <SectionCard titre="Bloc 2 · Proportionnalité" description="Le régime d'analyse S, M ou L se calcule ; une seule complexité suffit à escalader.">
        <Grille2>
          <Champ cible="exposition" libelle="Exposition de la banque (MMAD)" manquant={m("exposition")} aide="Reprise du total des crédits rattachés à la création.">
            <Nombre cible="exposition" valeur={pr.exposition} onChange={(v) => prop("exposition", v)} lecture={lecture} suffixe="MMAD" min={0} manquant={m("exposition")} />
          </Champ>
          <Champ cible="duree" libelle="Durée du financement" manquant={m("duree")}>
            <Nombre cible="duree" valeur={pr.duree} onChange={(v) => prop("duree", v)} lecture={lecture} suffixe="ans" min={0} manquant={m("duree")} />
          </Champ>
          <Champ cible="nbContreparties" libelle="Nombre de contreparties clés" manquant={m("nbContreparties")}>
            <Nombre cible="nbContreparties" valeur={pr.nbContreparties} onChange={(v) => prop("nbContreparties", v === null ? null : Math.round(v))} lecture={lecture} min={0} manquant={m("nbContreparties")} />
          </Champ>
          {ouiNonProp.map(([k, l]) => (
            <Champ key={k} cible={k} libelle={l} manquant={m(k)}>
              <OuiNon cible={k} valeur={pr[k] as "Oui" | "Non" | null} onChange={(v) => prop(k, v as never)} lecture={lecture} manquant={m(k)} />
            </Champ>
          ))}
          {s.phase === "P1" && (
            <Champ cible="epcCleEnMain" libelle="EPC clé-en-main de moins de 18 mois ?" manquant={m("epcCleEnMain")}>
              <OuiNon cible="epcCleEnMain" valeur={pr.epcCleEnMain} onChange={(v) => prop("epcCleEnMain", v)} lecture={lecture} manquant={m("epcCleEnMain")} />
            </Champ>
          )}
          <Champ cible="climatEleve" libelle="Site à risque climatique physique élevé ?" manquant={m("climatEleve")}>
            <OuiNon cible="climatEleve" valeur={s.climatEleve} onChange={(v) => modifier((x) => { x.climatEleve = v; })} lecture={lecture} manquant={m("climatEleve")} />
          </Champ>
        </Grille2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Calcule libelle="Régime calculé" valeur={r.regimeCalcule ?? "—"} />
          <Calcule libelle="Régime retenu" valeur={r.regimeRetenu ?? "—"} ton={r.regimeRetenu === "L" ? "vigilance" : undefined} />
        </div>
        {r.motifsEscalade.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12px] text-muted-foreground">
            {r.motifsEscalade.map((x) => <li key={x}>{x}</li>)}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function Code({ libelle, valeur, lien, manquant }: { libelle: string; valeur: string | null | undefined; lien?: string; manquant?: boolean }) {
  return (
    <div className="rounded border border-border bg-surface px-2.5 py-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{libelle}</p>
      {valeur ? (
        <p className="font-mono text-[13.5px] text-foreground">{valeur}</p>
      ) : (
        <p className={manquant ? "text-[12.5px] text-warning" : "text-[12.5px] text-muted-foreground"}>
          Non renseigné{lien && <> — <Link href={lien} className="text-primary hover:underline">compléter la fiche</Link></>}
        </p>
      )}
    </div>
  );
}
