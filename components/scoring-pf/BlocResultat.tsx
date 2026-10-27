"use client";

import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";
import { gradeDeLaNote, ORDRE_DOMAINES, ORDRE_PLAFONDS, ORDRE_VERROUS, type CodeVerrou } from "@/lib/modele-pf/parametres";
import { AVIS, DECISIONS, justificationExigee } from "@/lib/modele-pf/saisie";
import { Champ, Liste, OuiNon, Texte, Calcule, fmtNombre, fmtPct, type PropsBloc } from "./champs";
import { MarqueOrigine } from "./origine";

const AUTO: CodeVerrou[] = ["B3", "B7"];

/** Blocs 9 à 13 : agrégation, verrous, plafonds, note approuvée, commentaires et décision. */
export function BlocResultat({ s, modifier, r, P, lecture, voirScores, manquants }: PropsBloc) {
  const m = (c: string) => manquants.has(c);
  const b = s.bloc13;
  const ecrire = <K extends keyof typeof b>(k: K, v: (typeof b)[K]) => modifier((x) => { x.bloc13[k] = v; });
  const exigeJustif = justificationExigee(s, r);
  return (
    <div className="space-y-4">
      {voirScores && (
        <SectionCard titre="Bloc 9 · Agrégation" description="Chaque domaine pèse selon la phase ; D7 est le noyau financier (N1 à N6)." sansPadding>
          <table className="w-full min-w-[520px] text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Domaine</th><th className="px-3 py-2 text-right">Poids</th><th className="px-3 py-2 text-right">Note /100</th><th className="px-3 py-2 text-right">Contribution</th></tr>
            </thead>
            <tbody>
              {ORDRE_DOMAINES.map((d) => (
                <tr key={d} className="border-t border-border">
                  <td className="px-3 py-1.5"><span className="font-mono text-muted-foreground">{d}</span> {P.libellesDomaines[d]}</td>
                  <td className="px-3 py-1.5 text-right tabulaire">{r.poids ? fmtPct(r.poids[d], 0) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabulaire">{fmtNombre(d === "D7" ? r.d7 : r.domaines?.[d], 1)}</td>
                  <td className="px-3 py-1.5 text-right tabulaire">{fmtNombre(r.contributions?.[d], 2)}</td>
                </tr>
              ))}
              <tr className="border-t border-border font-semibold">
                <td className="px-3 py-2">Score</td><td /><td />
                <td className="px-3 py-2 text-right tabulaire">{fmtNombre(r.score, 2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3">
            <Calcule libelle="Note calculée" valeur={r.noteCalculee === null ? "—" : `${r.noteCalculee} / 10`} />
            <Calcule libelle="Couverture de la grille" valeur={fmtPct(r.couvertureGrille, 0)} />
            <Calcule libelle="Complétude" valeur={fmtPct(r.completude, 0)} ton={r.completude !== null && r.completude < 1 ? "vigilance" : undefined} />
          </div>
        </SectionCard>
      )}

      <SectionCard titre="Bloc 10 · Verrous" description="X1 à X4 excluent toute note ; B1 à B8 bloquent un stade du processus. B3 et B7 sont aussi détectés par le calcul." sansPadding>
        <div id="pf-verrous" className="scroll-mt-40">
          <table className="w-full min-w-[620px] text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Verrou</th><th className="px-3 py-2">Stade bloqué</th><th className="px-3 py-2">Constaté ?</th><th className="px-3 py-2">État</th></tr>
            </thead>
            <tbody>
              {ORDRE_VERROUS.map((v) => {
                const actif = r.verrousActifs.includes(v);
                const detecte = actif && AUTO.includes(v) && s.verrous[v] !== "Oui";
                const vide = s.verrous[v] === undefined || s.verrous[v] === null;
                return (
                  <tr key={v} className="border-t border-border align-top">
                    <td className="px-3 py-2"><span className="font-mono font-semibold">{v}</span> <span className="text-muted-foreground">{P.verrous[v].libelle}</span> <MarqueOrigine cles={[`verrou.${v}`]} /></td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{P.verrous[v].stade}</td>
                    <td className="px-3 py-2"><OuiNon cible={`verrou-${v}`} valeur={s.verrous[v]} lecture={lecture} manquant={m("verrous") && vide}
                      onChange={(x) => modifier((d) => { d.verrous[v] = x; })} /></td>
                    <td className={cn("px-3 py-2 whitespace-nowrap font-medium", actif ? "text-destructive" : "text-muted-foreground")}>
                      {actif ? (detecte ? "Actif (détecté)" : "Actif") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard titre="Bloc 11 · Plafonds de note" description="Un plafond actif limite la note approuvée ; « n.r. » signale une donnée non renseignée." sansPadding>
        <table className="w-full min-w-[560px] text-[13px]">
          <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-3 py-2">Plafond</th>{voirScores && <th className="px-3 py-2 text-right">Note max.</th>}<th className="px-3 py-2">Actif</th></tr>
          </thead>
          <tbody>
            {ORDRE_PLAFONDS.map((c) => {
              const e = r.plafonds[c];
              return (
                <tr key={c} className="border-t border-border">
                  <td className="px-3 py-1.5"><span className="font-mono font-semibold">{c}</span> <span className="text-muted-foreground">{P.plafonds[c].libelle}</span></td>
                  {voirScores && <td className="px-3 py-1.5 text-right tabulaire">{P.plafonds[c].niveau}</td>}
                  <td className={cn("px-3 py-1.5 font-medium", e === "Oui" ? "text-destructive" : e === "n.r." ? "text-warning" : "text-muted-foreground")}>{e}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard titre="Bloc 12 · Note approuvée">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {voirScores && <Calcule libelle="Note calculée" valeur={r.noteCalculee ?? "—"} />}
          {voirScores && <Calcule libelle="Plafond retenu" valeur={r.plafondsActifs.length ? `${r.plafond} (${r.plafondsActifs.join(", ")})` : "Aucun"} ton={r.plafondsActifs.length ? "vigilance" : undefined} />}
          {voirScores && <Calcule libelle="Note approuvée" valeur={r.noteApprouvee === null ? "—" : `${r.noteApprouvee}${typeof r.noteApprouvee === "number" ? ` — ${r.libelle} (${gradeDeLaNote(r.noteApprouvee, P) ?? "—"})` : ""}`} />}
          <Calcule libelle="Régime d'analyse" valeur={r.regimeRetenu ?? "—"} />
        </div>
        <p className={cn("mt-3 text-[13px] font-medium", r.statut.startsWith("Note validable") ? "text-success" : "text-warning")}>{r.statut}</p>
        {voirScores && r.orientation && r.orientation !== "—" && <p className="mt-1 text-[12.5px] text-muted-foreground">Orientation : {r.orientation}</p>}
      </SectionCard>

      <SectionCard titre="Bloc 13 · Commentaires, conditions et avis">
        <div className="grid gap-3 lg:grid-cols-2">
          <Champ cible="synthese" libelle="Synthèse de l'analyste" manquant={m("synthese")} className="lg:col-span-2">
            <Texte cible="synthese" valeur={b.synthese} lecture={lecture} lignes={4} manquant={m("synthese")} onChange={(t) => ecrire("synthese", t)} />
          </Champ>
          <Champ cible="forces" libelle="Points forts"><Texte cible="forces" valeur={b.forces} lecture={lecture} onChange={(t) => ecrire("forces", t)} /></Champ>
          <Champ cible="faiblesses" libelle="Points de vigilance"><Texte cible="faiblesses" valeur={b.faiblesses} lecture={lecture} onChange={(t) => ecrire("faiblesses", t)} /></Champ>
          <Champ cible="conditions" libelle="Conditions et covenants proposés" className="lg:col-span-2">
            <Texte cible="conditions" valeur={b.conditions} lecture={lecture} onChange={(t) => ecrire("conditions", t)} />
          </Champ>
          <Champ cible="justification" libelle={`Justification des écarts${exigeJustif ? " (exigée)" : ""}`} manquant={m("justification")} className="lg:col-span-2"
            aide={exigeJustif ? "Un plafond, un verrou ou une information insuffisante est actif : expliquez-le et dites ce qui le lèvera." : undefined}>
            <Texte cible="justification" valeur={b.justification} lecture={lecture} manquant={m("justification")} onChange={(t) => ecrire("justification", t)} />
          </Champ>
          <Champ cible="avis" libelle="Avis de l'analyste">
            <Liste cible="avis" valeur={b.avis} lecture={lecture} options={AVIS.map((a) => [a, a] as const)} onChange={(v) => ecrire("avis", v)} />
          </Champ>
          <Champ cible="avisMotif" libelle="Motif de l'avis"><Texte cible="avisMotif" valeur={b.avisMotif} lecture={lecture} lignes={2} max={2000} onChange={(t) => ecrire("avisMotif", t)} /></Champ>
          <Champ cible="decision" libelle="Décision du comité">
            <Liste cible="decision" valeur={b.decision} lecture={lecture} options={DECISIONS.map((a) => [a, a] as const)} onChange={(v) => ecrire("decision", v)} />
          </Champ>
          <Champ cible="decisionCommentaire" libelle="Commentaire de la décision"><Texte cible="decisionCommentaire" valeur={b.decisionCommentaire} lecture={lecture} lignes={2} max={2000} onChange={(t) => ecrire("decisionCommentaire", t)} /></Champ>
        </div>
      </SectionCard>
    </div>
  );
}
