"use client";

import { SectionCard } from "@/components/ui/section-card";
import { libelleCritere } from "@/lib/modele-pf/referentiel";
import { INFO_INSUFFISANTE } from "@/lib/modele-pf/moteur";
import type { SaisiePF } from "@/lib/modele-pf/saisie";
import { Champ, Nombre, OuiNon, Liste, Calcule, Grille2, fmtX, fmtPct, fmtNombre, type PropsBloc } from "./champs";
import { ChoixSituation } from "./ChoixSituation";

type Plafonds = SaisiePF["donneesPlafonds"];

const LIBELLES_N = ["N1 · DSCR minimum de base", "N2 · DSCR minimum stressé", "N3 · Couverture du besoin (P1) ou LLCR"];

/** Bloc 7 : noyau financier (N1 à N3 calculés, N4 à N6 par situation) et données des plafonds. */
export function BlocNoyau({ s, modifier, r, P, lecture, voirScores, manquants }: PropsBloc) {
  const m = (c: string) => manquants.has(c);
  const d = s.donneesPlafonds;
  const pl = <K extends keyof Plafonds>(k: K, v: Plafonds[K]) => modifier((x) => { x.donneesPlafonds[k] = v; });
  const note = (v: number | typeof INFO_INSUFFISANTE | null) => (v === null ? "—" : v === INFO_INSUFFISANTE ? "Info. insuff." : fmtNombre(v, 0));
  const notesN3: [string, string][] = [
    [String(P.ancres.tresFavorable), `Très favorable (${P.ancres.tresFavorable})`], [String(P.ancres.favorable), `Favorable (${P.ancres.favorable})`],
    [String(P.ancres.vigilance), `Vigilance (${P.ancres.vigilance})`], [String(P.ancres.critique), `Critique (${P.ancres.critique})`],
    [INFO_INSUFFISANTE, INFO_INSUFFISANTE],
  ];
  return (
    <div className="space-y-4">
      <SectionCard titre="Bloc 7 · Indicateurs calculés" description="N1 et N2 se classent sur les seuils du routage ; N3 mesure la couverture du besoin en construction, le LLCR ensuite.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Calcule libelle={LIBELLES_N[0]} valeur={<>{fmtX(r.dscrMin)}{voirScores && <span className="ml-2 text-[12px] font-normal text-muted-foreground">note {note(r.noyau?.[0] ?? null)}</span>}</>} />
          <Calcule libelle={LIBELLES_N[1]} valeur={<>{fmtX(r.dscrMinStresse)}{voirScores && <span className="ml-2 text-[12px] font-normal text-muted-foreground">note {note(r.noyau?.[1] ?? null)}</span>}</>} />
          <Calcule libelle={LIBELLES_N[2]} valeur={<>{s.phase === "P1" ? fmtPct(r.couverture) : fmtX(d.llcr)}{voirScores && <span className="ml-2 text-[12px] font-normal text-muted-foreground">note {note(r.noyau?.[2] ?? null)}</span>}</>} />
        </div>
        {s.phase && s.phase !== "P1" && (
          <div className="mt-3 max-w-sm">
            <Champ cible="n3Llcr" libelle="N3 hors construction : appréciation du LLCR" manquant={m("n3Llcr")}>
              <Liste cible="n3Llcr" valeur={s.n3Llcr === null ? null : String(s.n3Llcr)} lecture={lecture} manquant={m("n3Llcr")} options={notesN3}
                onChange={(v) => modifier((x) => { x.n3Llcr = v === null ? null : v === INFO_INSUFFISANTE ? INFO_INSUFFISANTE : (Number(v) as 100); })} />
            </Champ>
          </div>
        )}
      </SectionCard>

      <SectionCard titre="Bloc 7 · Indicateurs qualitatifs du noyau" description="Choisissez la situation décrite qui correspond au dossier ; une justification est exigée si elle est critique ou si l'information manque.">
        <div className="grid gap-3 lg:grid-cols-3">
          {(["N4", "N5", "N6"] as const).map((n) => (
            <ChoixSituation key={n} cle={n} libelle={libelleCritere(n)} secteur={s.secteur} niveau={s.noyau[n]?.niveau}
              commentaire={s.noyau[n]?.justification ?? ""} lecture={lecture} manquant={m(n)} aideCommentaire="Justification"
              onNiveau={(v) => modifier((x) => { x.noyau[n] = { niveau: v, justification: x.noyau[n]?.justification ?? "" }; })}
              onCommentaire={(t) => modifier((x) => { x.noyau[n] = { niveau: x.noyau[n]?.niveau ?? null, justification: t }; })} />
          ))}
        </div>
      </SectionCard>

      <SectionCard titre="Bloc 7 · Données des plafonds" description="Chaque donnée alimente un plafond de note (C4 à C14) ; voir l'onglet Résultat pour leur état.">
        <Grille2>
          <Champ cible="llcr" libelle="LLCR (C4)" manquant={m("llcr")}><Nombre cible="llcr" valeur={d.llcr} onChange={(v) => pl("llcr", v)} lecture={lecture} suffixe="x" min={0} manquant={m("llcr")} /></Champ>
          <Champ cible="dsraMois" libelle="DSRA (C7)" manquant={m("dsraMois")}><Nombre cible="dsraMois" valeur={d.dsraMois} onChange={(v) => pl("dsraMois", v)} lecture={lecture} suffixe="mois" min={0} manquant={m("dsraMois")} /></Champ>
          <Champ cible="expositionDevises" libelle="Exposition nette en devises / service annuel (C6)" manquant={m("expositionDevises")}>
            <Nombre cible="expositionDevises" valeur={d.expositionDevises === null ? null : Math.round(d.expositionDevises * 1000) / 10} onChange={(v) => pl("expositionDevises", v === null ? null : v / 100)} lecture={lecture} suffixe="%" min={0} manquant={m("expositionDevises")} />
          </Champ>
          <Champ cible="detteARefinancer" libelle="Dette à refinancer à maturité / nominal (C8)" manquant={m("detteARefinancer")}>
            <Nombre cible="detteARefinancer" valeur={d.detteARefinancer === null ? null : Math.round(d.detteARefinancer * 1000) / 10} onChange={(v) => pl("detteARefinancer", v === null ? null : v / 100)} lecture={lecture} suffixe="%" min={0} max={100} manquant={m("detteARefinancer")} />
          </Champ>
          {(d.detteARefinancer ?? 0) > P.seuils.c8 && (
            <Champ cible="strategieRefinancement" libelle="Stratégie de refinancement approuvée ?" manquant={m("strategieRefinancement")}>
              <OuiNon cible="strategieRefinancement" valeur={d.strategieRefinancement} onChange={(v) => pl("strategieRefinancement", v)} lecture={lecture} manquant={m("strategieRefinancement")} />
            </Champ>
          )}
          <Champ cible="partAcheteur" libelle="Part des recettes de l'acheteur principal (C10)" manquant={m("partAcheteur")}>
            <Nombre cible="partAcheteur" valeur={d.partAcheteur === null ? null : Math.round(d.partAcheteur * 1000) / 10} onChange={(v) => pl("partAcheteur", v === null ? null : v / 100)} lecture={lecture} suffixe="%" min={0} max={100} manquant={m("partAcheteur")} />
          </Champ>
          <Champ cible="qualiteAcheteur" libelle="Qualité de crédit de l'acheteur principal" manquant={m("qualiteAcheteur")}>
            <Liste cible="qualiteAcheteur" valeur={d.qualiteAcheteur} onChange={(v) => pl("qualiteAcheteur", v)} lecture={lecture} manquant={m("qualiteAcheteur")}
              options={[["≥ BBB−", "≥ BBB− (interne)"], ["< BBB−", "< BBB− (interne)"], ["Non noté", "Non noté"]] as const} />
          </Champ>
          {s.regime !== "R4" && (
            <Champ cible="dureeContrat" libelle="Durée résiduelle du contrat de revenus (C5)" manquant={m("dureeContrat")}>
              <Nombre cible="dureeContrat" valeur={d.dureeContrat} onChange={(v) => pl("dureeContrat", v)} lecture={lecture} suffixe="ans" min={0} manquant={m("dureeContrat")} />
            </Champ>
          )}
          <Champ cible="dureeDette" libelle="Durée résiduelle de la dette" manquant={m("dureeDette")}>
            <Nombre cible="dureeDette" valeur={d.dureeDette} onChange={(v) => pl("dureeDette", v)} lecture={lecture} suffixe="ans" min={0} manquant={m("dureeDette")} />
          </Champ>
          {d.dureeContrat !== null && d.dureeDette !== null && d.dureeContrat < d.dureeDette && (
            <Champ cible="solutionContrat" libelle="Solution documentée (contrat plus court que la dette) ?" manquant={m("solutionContrat")}>
              <OuiNon cible="solutionContrat" valeur={d.solutionContrat} onChange={(v) => pl("solutionContrat", v)} lecture={lecture} manquant={m("solutionContrat")} />
            </Champ>
          )}
          {s.climatEleve === "Oui" && (
            <Champ cible="planClimat" libelle="Plan d'adaptation climatique financé ? (C11)" manquant={m("planClimat")}>
              <OuiNon cible="planClimat" valeur={d.planClimat} onChange={(v) => pl("planClimat", v)} lecture={lecture} manquant={m("planClimat")} />
            </Champ>
          )}
          <Champ cible="capaciteSponsor" libelle="Capacité résiduelle du sponsor suffisante ? (C12)" manquant={m("capaciteSponsor")}>
            <OuiNon cible="capaciteSponsor" valeur={d.capaciteSponsor} onChange={(v) => pl("capaciteSponsor", v)} lecture={lecture} manquant={m("capaciteSponsor")} />
          </Champ>
          <Champ cible="operateurRemplacable" libelle="Opérateur remplaçable ? (C13)" manquant={m("operateurRemplacable")}>
            <OuiNon cible="operateurRemplacable" valeur={d.operateurRemplacable} onChange={(v) => pl("operateurRemplacable", v)} lecture={lecture} manquant={m("operateurRemplacable")} />
          </Champ>
          {d.operateurRemplacable === "Non" && (
            <Champ cible="ecartOm" libelle="Écart entre fin du contrat O&M et fin de la dette" manquant={m("ecartOm")}>
              <Nombre cible="ecartOm" valeur={d.ecartOm} onChange={(v) => pl("ecartOm", v)} lecture={lecture} suffixe="ans" min={0} manquant={m("ecartOm")} />
            </Champ>
          )}
          <Champ cible="expositionGroupe" libelle="Facteur commun au-delà de la limite interne du groupe ? (C14)" manquant={m("expositionGroupe")}>
            <OuiNon cible="expositionGroupe" valeur={d.expositionGroupe} onChange={(v) => pl("expositionGroupe", v)} lecture={lecture} manquant={m("expositionGroupe")} />
          </Champ>
        </Grille2>
      </SectionCard>
    </div>
  );
}
