"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, RotateCcw, Save } from "lucide-react";
import { apiGet, apiPut, messageErreurApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { hasMinimumRole, type UserRole } from "@/lib/permissions";
import { usePermission } from "@/lib/hooks/usePermission";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { Nombre } from "@/components/scoring-pf/champs";
import {
  anomaliesParametres, GRADES, ORDRE_DOMAINES, ORDRE_PLAFONDS, type Grade,
  type ParametresModele, type CodeRegime, type CodeSecteur, type CodePhase,
} from "@/lib/modele-pf/parametres";

const SEUILS: [keyof ParametresModele["seuils"], string, string][] = [
  ["sCapex", "Régime S : CAPEX maximum", "MMAD"], ["sExpo", "Régime S : exposition maximum", "MMAD"], ["sDuree", "Régime S : durée maximum", "ans"],
  ["lCapex", "Escalade en L : CAPEX au-delà de", "MMAD"], ["lExpo", "Escalade en L : exposition au-delà de", "MMAD"], ["lNbContreparties", "Escalade en L : contreparties clés au-delà de", ""],
  ["n3TresFavorable", "N3 (P1) : couverture très favorable dès", "x"], ["n3Favorable", "N3 (P1) : couverture favorable dès", "x"], ["n3Vigilance", "N3 (P1) : couverture vigilance dès", "x"],
  ["c1", "C1 : DSCR minimum de base sous", "x"], ["c3", "C3 : DSCR stressé sous", "x"], ["c4", "C4 : LLCR sous", "x"],
  ["c6", "C6 : exposition en devises au-delà de (fraction)", ""], ["c7", "C7 : DSRA sous", "mois"], ["c8", "C8 : dette à refinancer au-delà de (fraction)", ""],
  ["c9", "C9 : quote-part de dette au-delà de (fraction)", ""], ["c10", "C10 : part de l'acheteur au-delà de (fraction)", ""], ["c13", "C13 : écart O&M / dette au-delà de", "ans"],
  ["couvertureGrille", "C15 : couverture de la grille sous (fraction)", ""],
];
const pct = (v: number) => Math.round(v * 10000) / 100;

/**
 * Paramètres du modèle Project Finance : valeurs candidates du modèle, surchargeables
 * par l'administrateur après validation par les experts. Un scoring soumis ou validé
 * garde les paramètres de son calcul : sa note reste reproductible.
 */
export default function ParametresModelePFPage() {
  const { user } = usePermission();
  const admin = !!user && hasMinimumRole(user.role as UserRole, "scoring_admin");
  const [P, setP] = useState<ParametresModele | null>(null);
  const [defaut, setDefaut] = useState<ParametresModele | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ton: "ok" | "erreur"; texte: string } | null>(null);

  useEffect(() => {
    apiGet("/api/modele-pf/parametres").then(async (r) => {
      if (!r.ok) { setMessage({ ton: "erreur", texte: await messageErreurApi(r, "Paramètres indisponibles.") }); return; }
      const d = await r.json();
      setP(d.parametres);
      setDefaut(d.defaut);
    });
  }, []);

  const anomalies = useMemo(() => (P ? anomaliesParametres(P) : []), [P]);
  const maj = (f: (p: ParametresModele) => void) => setP((prec) => { if (!prec) return prec; const c = structuredClone(prec); f(c); return c; });

  async function enregistrer() {
    if (!P) return;
    setEnvoi(true);
    setMessage(null);
    const surcharge = {
      regimes: Object.fromEntries(Object.entries(P.regimes).map(([k, v]) => [k, { seuils: v.seuils }])),
      secteurs: Object.fromEntries(Object.entries(P.secteurs).map(([k, v]) => [k, { delta: v.delta }])),
      phases: Object.fromEntries(Object.entries(P.phases).map(([k, v]) => [k, { majoration: v.majoration }])),
      poidsDomaines: P.poidsDomaines, poidsNoyau: P.poidsNoyau, ancres: P.ancres,
      plafonds: Object.fromEntries(Object.entries(P.plafonds).map(([k, v]) => [k, { niveau: v.niveau }])),
      seuils: P.seuils,
      correspondanceGrades: P.correspondanceGrades,
    };
    const r = await apiPut("/api/modele-pf/parametres", surcharge);
    setEnvoi(false);
    if (!r.ok) {
      const d = await r.clone().json().catch(() => ({}));
      setMessage({ ton: "erreur", texte: d.anomalies?.length ? d.anomalies.join(" · ") : await messageErreurApi(r, "Enregistrement impossible.") });
      return;
    }
    setP((await r.json()).parametres);
    setMessage({ ton: "ok", texte: "Paramètres enregistrés : ils s'appliquent aux scorings au brouillon dès leur prochain calcul." });
  }

  if (!P || !defaut) {
    return message ? <p role="alert" className="mt-10 text-center text-destructive">{message.texte}</p>
      : <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={30} /></div>;
  }
  const lecture = !admin;
  const diff = (a: number, b: number) => Math.abs(a - b) > 1e-9;

  return (
    <div>
      <PageHeader
        retour={{ href: "/admin", libelle: "Paramétrage" }}
        titre="Paramètres du modèle Project Finance"
        description="Valeurs candidates du modèle, à ajuster après validation par les experts. Les valeurs modifiées sont signalées."
        actions={admin && (
          <>
            <button type="button" onClick={() => setP(structuredClone(defaut))} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px]">
              <RotateCcw size={14} /> Valeurs candidates
            </button>
            <button type="button" onClick={enregistrer} disabled={envoi || anomalies.length > 0} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
              {envoi ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
            </button>
          </>
        )}
      />
      {lecture && <p className="mb-3 text-[13px] text-muted-foreground">Consultation seule : la modification est réservée à l&apos;administrateur du modèle.</p>}
      {message && (
        <p role={message.ton === "erreur" ? "alert" : "status"} className={cn("mb-3 rounded-md border px-3 py-2 text-[13px]", message.ton === "erreur" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-success/40 bg-success/10 text-success")}>
          {message.ton === "ok" && <Check size={14} className="mr-1 inline" />}{message.texte}
        </p>
      )}
      {anomalies.length > 0 && (
        <div role="alert" className="mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-warning">
          <AlertTriangle size={14} className="mr-1 inline" />{anomalies.join(" · ")}
        </div>
      )}

      {/* min-w-0 : sans lui, une carte de grille prend la largeur de son tableau et la page déborde sur téléphone. */}
      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <SectionCard titre="Seuils DSCR par régime de revenus" description="Critique, vigilance, favorable (exploitation stabilisée)." sansPadding>
          <table className="w-full text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Régime</th><th className="px-2 py-2">Critique</th><th className="px-2 py-2">Vigilance</th><th className="px-2 py-2">Favorable</th></tr>
            </thead>
            <tbody>
              {(Object.keys(P.regimes) as CodeRegime[]).map((k) => (
                <tr key={k} className="border-t border-border">
                  <td className="px-3 py-1.5"><span className="font-mono font-semibold">{k}</span> <span className="text-muted-foreground">{P.regimes[k].libelle}</span></td>
                  {[0, 1, 2].map((i) => (
                    <td key={i} className={cn("w-24 px-2 py-1.5", diff(P.regimes[k].seuils[i], defaut.regimes[k].seuils[i]) && "bg-warning/10")}>
                      <Nombre cible={`reg-${k}-${i}`} valeur={P.regimes[k].seuils[i]} lecture={lecture} suffixe="x" min={0} max={10}
                        onChange={(v) => maj((p) => { p.regimes[k].seuils[i] = v ?? defaut.regimes[k].seuils[i]; })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard titre="Écarts sectoriels et majoration de phase" description="S'ajoutent aux seuils DSCR du régime." sansPadding>
          <table className="w-full text-[13px]">
            <tbody>
              {(Object.keys(P.secteurs) as CodeSecteur[]).map((k) => (
                <tr key={k} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-1.5"><span className="font-mono font-semibold">{k}</span> <span className="text-muted-foreground">{P.secteurs[k].libelle}</span></td>
                  <td className={cn("w-28 px-2 py-1.5", diff(P.secteurs[k].delta, defaut.secteurs[k].delta) && "bg-warning/10")}>
                    <Nombre cible={`sec-${k}`} valeur={P.secteurs[k].delta} lecture={lecture} suffixe="x" min={-1} max={1}
                      onChange={(v) => maj((p) => { p.secteurs[k].delta = v ?? 0; })} />
                  </td>
                </tr>
              ))}
              {(Object.keys(P.phases) as CodePhase[]).map((k) => (
                <tr key={k} className="border-t border-border">
                  <td className="px-3 py-1.5"><span className="font-mono font-semibold">{k}</span> <span className="text-muted-foreground">Majoration — {P.phases[k].libelle}</span></td>
                  <td className={cn("w-28 px-2 py-1.5", diff(P.phases[k].majoration, defaut.phases[k].majoration) && "bg-warning/10")}>
                    <Nombre cible={`ph-${k}`} valeur={P.phases[k].majoration} lecture={lecture} suffixe="x" min={0} max={1}
                      onChange={(v) => maj((p) => { p.phases[k].majoration = v ?? 0; })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard titre="Poids des domaines par phase" description="Chaque colonne totalise 100 %." className="xl:col-span-2" sansPadding>
          <table className="w-full min-w-[560px] text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Domaine</th>{(["P1", "P2", "P3"] as const).map((ph) => <th key={ph} className="px-2 py-2">{ph} · {P.phases[ph].libelle}</th>)}</tr>
            </thead>
            <tbody>
              {ORDRE_DOMAINES.map((d) => (
                <tr key={d} className="border-t border-border">
                  <td className="px-3 py-1.5"><span className="font-mono text-muted-foreground">{d}</span> {P.libellesDomaines[d]}</td>
                  {(["P1", "P2", "P3"] as const).map((ph) => (
                    <td key={ph} className={cn("w-32 px-2 py-1.5", diff(P.poidsDomaines[ph][d], defaut.poidsDomaines[ph][d]) && "bg-warning/10")}>
                      <Nombre cible={`pd-${ph}-${d}`} valeur={pct(P.poidsDomaines[ph][d])} lecture={lecture} suffixe="%" min={0} max={100}
                        onChange={(v) => maj((p) => { p.poidsDomaines[ph][d] = (v ?? 0) / 100; })} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border font-semibold">
                <td className="px-3 py-1.5">Total</td>
                {(["P1", "P2", "P3"] as const).map((ph) => {
                  const t = Object.values(P.poidsDomaines[ph]).reduce((s, x) => s + x, 0);
                  return <td key={ph} className={cn("px-3 py-1.5 tabulaire", Math.abs(t - 1) > 1e-6 && "text-destructive")}>{pct(t).toLocaleString("fr-FR")} %</td>;
                })}
              </tr>
            </tbody>
          </table>
        </SectionCard>

        <SectionCard titre="Noyau financier et ancres" description="Poids de N1 à N6 dans D7 ; notes attachées à chaque situation.">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {P.poidsNoyau.map((w, i) => (
              <div key={i} className={cn("rounded p-1", diff(w, defaut.poidsNoyau[i]) && "bg-warning/10")}>
                <label htmlFor={`pf-champ-pn-${i}`} className="mb-1 block text-[12px] font-medium">N{i + 1}</label>
                <Nombre cible={`pn-${i}`} valeur={pct(w)} lecture={lecture} suffixe="%" min={0} max={100} onChange={(v) => maj((p) => { p.poidsNoyau[i] = (v ?? 0) / 100; })} />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {([["tresFavorable", "Très favorable"], ["favorable", "Favorable"], ["vigilance", "Vigilance"], ["critique", "Critique"], ["infoInsuffisante", "Info. insuffisante"]] as const).map(([k, l]) => (
              <div key={k} className={cn("rounded p-1", diff(P.ancres[k], defaut.ancres[k]) && "bg-warning/10")}>
                <label htmlFor={`pf-champ-anc-${k}`} className="mb-1 block text-[12px] font-medium">{l}</label>
                <Nombre cible={`anc-${k}`} valeur={P.ancres[k]} lecture={lecture} min={0} max={100} onChange={(v) => maj((p) => { p.ancres[k] = v ?? defaut.ancres[k]; })} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard titre="Correspondance avec l'échelle de la banque" description="Grade (AAA à D) reporté sur le projet pour chaque note approuvée, à la validation." sansPadding>
          <table className="w-full text-[13px]">
            <tbody>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => {
                const ligne = P.conversion.find((c) => c.note === n);
                const g = P.correspondanceGrades?.[String(n)] ?? defaut.correspondanceGrades[String(n)];
                return (
                  <tr key={n} className="border-t border-border first:border-t-0">
                    <td className="px-3 py-1.5"><span className="font-semibold tabulaire">{n}</span> <span className="text-muted-foreground">{ligne?.libelle}</span></td>
                    <td className={cn("w-28 px-2 py-1.5", g !== defaut.correspondanceGrades[String(n)] && "bg-warning/10")}>
                      <select aria-label={`Grade de la note ${n}`} value={g} disabled={lecture}
                        onChange={(e) => maj((p) => { p.correspondanceGrades = { ...(p.correspondanceGrades ?? defaut.correspondanceGrades), [String(n)]: e.target.value as Grade }; })}
                        className="h-8 w-full rounded border border-border bg-background px-2 text-[13px]">
                        {GRADES.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard titre="Plafonds de note" description="Note maximale (1 à 10) quand le plafond est actif." sansPadding>
          <table className="w-full text-[13px]">
            <tbody>
              {ORDRE_PLAFONDS.map((c) => (
                <tr key={c} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-1.5"><span className="font-mono font-semibold">{c}</span> <span className="text-muted-foreground">{P.plafonds[c].libelle}</span></td>
                  <td className={cn("w-20 px-2 py-1.5", P.plafonds[c].niveau !== defaut.plafonds[c].niveau && "bg-warning/10")}>
                    <Nombre cible={`pl-${c}`} valeur={P.plafonds[c].niveau} lecture={lecture} min={1} max={10}
                      onChange={(v) => maj((p) => { p.plafonds[c].niveau = Math.round(v ?? defaut.plafonds[c].niveau); })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard titre="Seuils des règles" description="Proportionnalité S/M/L, classement de N3 en construction, déclenchement des plafonds." className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SEUILS.map(([k, l, u]) => (
              <div key={k} className={cn("rounded p-1", diff(P.seuils[k], defaut.seuils[k]) && "bg-warning/10")}>
                <label htmlFor={`pf-champ-seuil-${k}`} className="mb-1 block text-[12px] font-medium">{l}</label>
                <Nombre cible={`seuil-${k}`} valeur={P.seuils[k]} lecture={lecture} suffixe={u || undefined} min={0}
                  onChange={(v) => maj((p) => { p.seuils[k] = v ?? defaut.seuils[k]; })} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
