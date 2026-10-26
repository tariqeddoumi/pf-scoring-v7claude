"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { Champ, Nombre, OuiNon, Calcule, CLASSE_SAISIE, fmtNombre, fmtPct, type PropsBloc } from "./champs";
import { MarqueOrigine, ResumeOrigines } from "./origine";

export interface CreditPF { id: string; numero: string; nature: string; montant: number | null; devise: string; dureeAns: number | null; role: string | null }

const NATURES = ["Dette senior", "Dette subordonnée", "Fonds propres", "Quasi-fonds propres", "Engagement sponsor",
  "Ligne dédiée engagée", "Subvention encaissée", "Autre ressource"] as const;
type Nature = (typeof NATURES)[number];

/** Bloc 3 : sources et emplois du plan de financement, crédits de la banque rattachés au projet. */
export function BlocFinancement({ s, modifier, r, P, lecture, manquants, credits, projetId }: PropsBloc & { credits: CreditPF[]; projetId: string }) {
  const m = (c: string) => manquants.has(c);
  const couv = r.couverture;
  const tonCouv = couv === null ? undefined : couv >= P.seuils.n3Favorable ? "favorable" : couv >= P.seuils.n3Vigilance ? "vigilance" : "alerte";
  const totalCredits = credits.reduce((t, c) => t + (c.montant ?? 0), 0);
  return (
    <div className="space-y-4">
      <SectionCard titre="Bloc 3 · Sources et emplois" description="Montants à terminaison, en millions de dirhams (MMAD). Seules les ressources engagées comptent.">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div id="pf-emplois" className="scroll-mt-40">
            <h3 className="mb-2 text-[13px] font-semibold text-foreground">Emplois (besoin à terminaison){m("emplois") && <Badge />}</h3>
            <ResumeOrigines prefixe={/^emploi\./} className="mb-2 border-0 px-0 py-0" />
            <Lignes
              lignes={s.emplois}
              lecture={lecture}
              ajouter={() => modifier((x) => { x.emplois.push({ libelle: "", montant: null }); })}
              retirer={(i) => modifier((x) => { x.emplois.splice(i, 1); })}
              max={20}
              rendu={(e, i) => (
                <>
                  <MarqueOrigine cles={[`emploi.${i + 1}.libelle`, `emploi.${i + 1}.montant`]} />
                  <input aria-label={`Emploi ${i + 1}`} value={e.libelle} disabled={lecture} placeholder="Libellé" maxLength={200}
                    onChange={(ev) => modifier((x) => { x.emplois[i].libelle = ev.target.value; })} className={`${CLASSE_SAISIE} min-w-0 flex-[1_1_12rem]`} />
                  <div className="w-36 shrink-0">
                    <Nombre cible={`emploi-${i}`} valeur={e.montant} lecture={lecture} suffixe="MMAD" min={0}
                      onChange={(v) => modifier((x) => { x.emplois[i].montant = v; })} />
                  </div>
                </>
              )}
            />
          </div>
          <div id="pf-ressources" className="scroll-mt-40">
            <h3 className="mb-2 text-[13px] font-semibold text-foreground">Ressources engagées{m("ressources") && <Badge />}</h3>
            <ResumeOrigines prefixe={/^ressource\./} className="mb-2 border-0 px-0 py-0" />
            <Lignes
              lignes={s.ressources}
              lecture={lecture}
              ajouter={() => modifier((x) => { x.ressources.push({ libelle: "", montant: null, nature: null }); })}
              retirer={(i) => modifier((x) => { x.ressources.splice(i, 1); })}
              max={20}
              rendu={(e, i) => (
                <>
                  <MarqueOrigine cles={[`ressource.${i + 1}.libelle`, `ressource.${i + 1}.montant`, `ressource.${i + 1}.nature`]} />
                  <input aria-label={`Ressource ${i + 1}`} value={e.libelle} disabled={lecture} placeholder="Libellé" maxLength={200}
                    onChange={(ev) => modifier((x) => { x.ressources[i].libelle = ev.target.value; })} className={`${CLASSE_SAISIE} min-w-0 flex-[1_1_12rem]`} />
                  <select aria-label={`Nature de la ressource ${i + 1}`} value={e.nature ?? ""} disabled={lecture}
                    onChange={(ev) => modifier((x) => { x.ressources[i].nature = (ev.target.value || null) as Nature | null; })}
                    className={`${CLASSE_SAISIE.replace("w-full", "")} w-44 shrink-0 ${e.montant !== null && !e.nature ? "border-warning" : ""}`}>
                    <option value="">Nature…</option>
                    {NATURES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <div className="w-32 shrink-0">
                    <Nombre cible={`ressource-${i}`} valeur={e.montant} lecture={lecture} suffixe="MMAD" min={0}
                      onChange={(v) => modifier((x) => { x.ressources[i].montant = v; })} />
                  </div>
                </>
              )}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Calcule libelle="Besoin à terminaison" valeur={`${fmtNombre(r.capex)} MMAD`} />
          <Calcule libelle="Ressources engagées" valeur={`${fmtNombre(r.ressources)} MMAD`} />
          <Calcule libelle="Dette" valeur={`${fmtNombre(r.dette)} MMAD`} />
          <Calcule libelle="Couverture du besoin" valeur={fmtPct(couv)} ton={tonCouv} />
          <Calcule libelle="Quote-part de dette" valeur={fmtPct(r.quotePart)} ton={r.quotePart !== null && r.quotePart > P.seuils.c9 ? "alerte" : undefined} />
        </div>
        {s.phase === "P1" && couv !== null && couv >= P.seuils.n3Vigilance && couv < P.seuils.n3Favorable && (
          <div className="mt-4">
            <Champ cible="planRemediation" libelle="Plan de remédiation documenté (couverture entre 95 et 100 %) ?" manquant={m("planRemediation")}>
              <OuiNon cible="planRemediation" valeur={s.planRemediation} lecture={lecture} manquant={m("planRemediation")}
                onChange={(v) => modifier((x) => { x.planRemediation = v; })} />
            </Champ>
          </div>
        )}
      </SectionCard>

      <SectionCard
        titre="Crédits de la banque rattachés au projet"
        description="Saisis sur la fiche projet en attendant leur reprise depuis Evolan."
        actions={<Link href={`/projects/${projetId}`} className="text-[12.5px] font-semibold text-primary hover:underline">Gérer sur la fiche projet</Link>}
        sansPadding
      >
        {credits.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-muted-foreground">Aucun crédit rattaché.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">N° dossier</th><th className="px-3 py-2">Nature</th><th className="px-3 py-2 text-right">Montant</th><th className="px-3 py-2 text-right">Durée</th><th className="px-3 py-2">Rôle</th></tr>
            </thead>
            <tbody>
              {credits.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{c.numero}</td>
                  <td className="px-3 py-2">{c.nature}</td>
                  <td className="px-3 py-2 text-right tabulaire">{fmtNombre(c.montant)} {c.devise === "MAD" ? "MMAD" : `M${c.devise}`}</td>
                  <td className="px-3 py-2 text-right tabulaire">{c.dureeAns === null ? "—" : `${fmtNombre(c.dureeAns)} ans`}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.role ?? "—"}</td>
                </tr>
              ))}
              <tr className="border-t border-border font-semibold">
                <td className="px-3 py-2" colSpan={2}>Total</td>
                <td className="px-3 py-2 text-right tabulaire">{fmtNombre(totalCredits)} MMAD</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}

function Badge() {
  return <span className="ml-1.5 rounded bg-warning/15 px-1 py-px text-[10.5px] font-semibold text-warning">À saisir</span>;
}

/** Liste éditable de lignes (emplois, ressources, hypothèses…). */
export function Lignes<T>({ lignes, rendu, ajouter, retirer, lecture, max, libelleAjout = "Ajouter une ligne" }: {
  lignes: T[]; rendu: (l: T, i: number) => React.ReactNode; ajouter: () => void; retirer: (i: number) => void;
  lecture: boolean; max: number; libelleAjout?: string;
}) {
  return (
    <div className="space-y-1.5">
      {lignes.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5">
          {rendu(l, i)}
          {!lecture && (
            <button type="button" onClick={() => retirer(i)} aria-label="Retirer la ligne" className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {lignes.length === 0 && <p className="text-[12.5px] text-muted-foreground">Aucune ligne.</p>}
      {!lecture && lignes.length < max && (
        <button type="button" onClick={ajouter} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          <Plus size={13} /> {libelleAjout}
        </button>
      )}
    </div>
  );
}

