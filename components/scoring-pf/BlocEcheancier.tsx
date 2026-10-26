"use client";

import { useState } from "react";
import { Calculator, ClipboardPaste, ListOrdered, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";
import type { ResultatPeriode } from "@/lib/modele-pf/moteur";
import { SCENARIOS_REFERENCE, calculerChoc } from "@/lib/modele-pf/scenarios";
import { Champ, Nombre, Texte, Calcule, CLASSE_SAISIE, fmtX, fmtNombre, type PropsBloc } from "./champs";

const MAX_PERIODES = 60;
const TON_CLASSE: Record<string, string> = {
  Critique: "text-destructive", Vigilance: "text-warning", Favorable: "text-success", "Très favorable": "text-success", Différé: "text-muted-foreground",
};

const lireNombre = (t: string | undefined): number | null => {
  if (t === undefined) return null;
  const v = t.replace(/[\s  ]/g, "").replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Bloc 6 : échéancier daté (CFADS et service de la dette par période) et scénario défavorable. */
export function BlocEcheancier({ s, modifier, r, P, lecture, manquants }: PropsBloc) {
  const m = (c: string) => manquants.has(c);
  const [collage, setCollage] = useState<string | null>(null);
  const [annee, setAnnee] = useState(String(new Date().getFullYear() + 1));
  const [info, setInfo] = useState<string | null>(null);

  // Le moteur ne garde que les périodes complètes : on les rapproche des lignes saisies.
  const parLigne: (ResultatPeriode | null)[] = [];
  let k = 0;
  for (const p of s.periodes) parLigne.push(p.cfads !== null && p.service !== null ? (r.periodes[k++] ?? null) : null);

  function coller() {
    if (!collage) return;
    const lignes = collage.split(/\r?\n/).map((l) => l.split(/\t|;/)).filter((c) => c.some((x) => x.trim() !== ""));
    const lues = lignes
      .map((c) => ({ libelle: (c[0] ?? "").trim().slice(0, 60), cfads: lireNombre(c[1]), service: lireNombre(c[2]), cfadsStresse: lireNombre(c[3]) }))
      .filter((p) => p.cfads !== null || p.service !== null)
      .slice(0, MAX_PERIODES);
    modifier((x) => { x.periodes = lues.map((p) => ({ ...p, service: p.service === null ? null : Math.max(0, p.service) })); });
    setInfo(`${lues.length} période(s) reprise(s)${lignes.length > lues.length ? `, ${lignes.length - lues.length} ligne(s) ignorée(s) (en-têtes ou au-delà de ${MAX_PERIODES})` : ""}.`);
    setCollage(null);
  }

  function numeroter() {
    const a0 = Number(annee);
    if (!Number.isInteger(a0)) return;
    const parAn = s.periodicite === "Mensuelle" ? 12 : s.periodicite === "Trimestrielle" ? 4 : 2;
    const pref = s.periodicite === "Mensuelle" ? "M" : s.periodicite === "Trimestrielle" ? "T" : "S";
    modifier((x) => { x.periodes.forEach((p, i) => { p.libelle = `${pref}${(i % parAn) + 1} ${a0 + Math.floor(i / parAn)}`; }); });
  }

  return (
    <div className="space-y-4">
      <SectionCard titre="Bloc 6 · Scénario défavorable" description="Le choc s'applique aux CFADS de chaque période, sauf si un CFADS stressé est saisi.">
        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
          <Champ cible="choc" libelle="Choc sur les CFADS" manquant={m("choc")}>
            <Nombre cible="choc" valeur={s.choc === null ? null : Math.round(s.choc * 1000) / 10} suffixe="%" min={0} max={95} lecture={lecture} manquant={m("choc")}
              onChange={(v) => modifier((x) => { x.choc = v === null ? null : v / 100; })} />
          </Champ>
          <Champ cible="descriptionStress" libelle="Description du scénario">
            <Texte cible="descriptionStress" valeur={s.descriptionStress} max={500} lignes={2} lecture={lecture}
              placeholder="Ex. productible P90 et baisse de 10 % du tarif à partir de 2030"
              onChange={(v) => modifier((x) => { x.descriptionStress = v; })} />
          </Champ>
        </div>
      </SectionCard>

      <AideScenario s={s} modifier={modifier} lecture={lecture} />

      <SectionCard
        titre="Bloc 6 · Échéancier daté"
        description={`Jusqu'à ${MAX_PERIODES} périodes, montants en MMAD. Les seuils de classement viennent du routage.`}
        actions={!lecture && (
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCollage(collage === null ? "" : null)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
              <ClipboardPaste size={14} /> Coller depuis Excel
            </button>
          </div>
        )}
        sansPadding
      >
        {collage !== null && (
          <div className="space-y-2 border-b border-border bg-surface px-4 py-3">
            <p className="text-[12.5px] text-muted-foreground">Copiez dans Excel les colonnes Période, CFADS, Service de la dette et, si besoin, CFADS stressé, puis collez-les ici. Les lignes collées remplacent l&apos;échéancier.</p>
            <textarea aria-label="Échéancier collé depuis Excel" rows={6} value={collage} onChange={(e) => setCollage(e.target.value)}
              className="w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-[12px]" />
            <div className="flex gap-2">
              <button type="button" onClick={coller} disabled={!collage.trim()} className="h-8 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">Reprendre ces lignes</button>
              <button type="button" onClick={() => setCollage(null)} className="h-8 rounded border border-border px-3 text-xs">Annuler</button>
            </div>
          </div>
        )}
        {info && <p role="status" className="border-b border-border px-4 py-2 text-[12.5px] text-muted-foreground">{info}</p>}
        <div id="pf-periodes" className="scroll-mt-40">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 px-2 py-2 text-right">#</th>
                <th className="px-2 py-2">Période</th>
                <th className="px-2 py-2 text-right">CFADS</th>
                <th className="px-2 py-2 text-right">Service dette</th>
                <th className="px-2 py-2 text-right">CFADS stressé</th>
                <th className="px-2 py-2 text-right">DSCR</th>
                <th className="px-2 py-2 text-right">DSCR stressé</th>
                <th className="px-2 py-2">Classe</th>
                {!lecture && <th className="w-8" />}
              </tr>
            </thead>
            <tbody>
              {s.periodes.map((p, i) => {
                const rp = parLigne[i];
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 text-right text-muted-foreground tabulaire">{i + 1}</td>
                    <td className="px-2 py-1">
                      <input aria-label={`Libellé de la période ${i + 1}`} value={p.libelle} disabled={lecture} maxLength={60}
                        onChange={(e) => modifier((x) => { x.periodes[i].libelle = e.target.value; })} className={`${CLASSE_SAISIE} w-28`} />
                    </td>
                    <td className="px-2 py-1"><div className="ml-auto w-28"><Nombre cible={`cfads-${i}`} valeur={p.cfads} lecture={lecture} onChange={(v) => modifier((x) => { x.periodes[i].cfads = v; })} /></div></td>
                    <td className="px-2 py-1"><div className="ml-auto w-28"><Nombre cible={`service-${i}`} valeur={p.service} lecture={lecture} min={0} manquant={p.cfads !== null && p.service === null} onChange={(v) => modifier((x) => { x.periodes[i].service = v; })} /></div></td>
                    <td className="px-2 py-1"><div className="ml-auto w-28"><Nombre cible={`stresse-${i}`} valeur={p.cfadsStresse} lecture={lecture} placeholder="auto" onChange={(v) => modifier((x) => { x.periodes[i].cfadsStresse = v; })} /></div></td>
                    <td className="px-2 py-1 text-right tabulaire">{fmtX(rp?.dscr)}</td>
                    <td className="px-2 py-1 text-right tabulaire">{fmtX(rp?.dscrStresse)}</td>
                    <td className={cn("px-2 py-1 text-[12.5px] font-medium", rp ? TON_CLASSE[rp.classe] : "")}>{rp?.classe ?? "—"}</td>
                    {!lecture && (
                      <td className="px-1 py-1">
                        <button type="button" aria-label={`Retirer la période ${i + 1}`} onClick={() => modifier((x) => { x.periodes.splice(i, 1); })} className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive"><Trash2 size={14} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {s.periodes.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-5 text-center text-muted-foreground">Aucune période : ajoutez-en ou collez l&apos;échéancier depuis Excel.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {!lecture && (
          <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-2.5">
            {s.periodes.length < MAX_PERIODES && (
              <button type="button" onClick={() => modifier((x) => { x.periodes.push({ libelle: "", cfads: null, service: null, cfadsStresse: null }); })} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
                <Plus size={13} /> Ajouter une période
              </button>
            )}
            {s.periodes.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px]">
                <ListOrdered size={14} className="text-muted-foreground" />
                Numéroter ({s.periodicite.toLowerCase()}) à partir de
                <input aria-label="Première année de l'échéancier" value={annee} onChange={(e) => setAnnee(e.target.value)} inputMode="numeric" className={`${CLASSE_SAISIE} w-20`} />
                <button type="button" onClick={numeroter} className="font-semibold text-primary hover:underline">Appliquer</button>
              </span>
            )}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Calcule libelle="DSCR minimum" valeur={fmtX(r.dscrMin)} ton={tonDscr(r.dscrMin, r.seuils)} />
        <Calcule libelle="DSCR minimum stressé" valeur={fmtX(r.dscrMinStresse)} ton={r.dscrMinStresse !== null && r.dscrMinStresse < P.seuils.c3 ? "alerte" : undefined} />
        <Calcule libelle="Périodes retenues" valeur={fmtNombre(r.periodes.length, 0)} />
        <Calcule libelle="CFADS négatifs" valeur={fmtNombre(r.cfadsNegatifs, 0)} ton={r.cfadsNegatifs > 0 ? "alerte" : undefined} />
      </div>
    </div>
  );
}

/** Scénario de référence du secteur et passage des hypothèses (recettes, charges) au choc sur les CFADS. */
function AideScenario({ s, modifier, lecture }: Pick<PropsBloc, "s" | "modifier" | "lecture">) {
  const ref = s.secteur ? SCENARIOS_REFERENCE[s.secteur] : null;
  const [recettes, setRecettes] = useState<number | null>(null);
  const [charges, setCharges] = useState<number | null>(null);
  const [baisse, setBaisse] = useState<number | null>(ref ? ref.baisseRecettes * 100 : null);
  const [hausse, setHausse] = useState<number | null>(ref ? ref.hausseCharges * 100 : null);
  const [secteurVu, setSecteurVu] = useState(s.secteur);
  // Changement de secteur : on repart des hypothèses de référence du nouveau secteur.
  if (secteurVu !== s.secteur) {
    setSecteurVu(s.secteur);
    setBaisse(ref ? ref.baisseRecettes * 100 : null);
    setHausse(ref ? ref.hausseCharges * 100 : null);
  }
  const calcul = recettes !== null && charges !== null && baisse !== null && hausse !== null
    ? calculerChoc(recettes, charges, baisse / 100, hausse / 100) : null;
  const pourcent = (v: number) => `${fmtNombre(v * 100, 1)} %`;

  return (
    <SectionCard titre="Bloc 6 · Du scénario au choc" description="Le choc se calcule : on refait le compte d'une année type avec les hypothèses défavorables.">
      <div className="space-y-4">
        {ref ? (
          <div className="rounded border border-border bg-surface px-3 py-2.5 text-[12.5px]">
            <p className="font-semibold text-foreground">Scénario de référence du secteur · {ref.risque}</p>
            <p className="mt-0.5 text-foreground">{ref.description}</p>
            <p className="mt-1 text-muted-foreground">Source des chiffres : {ref.source}</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">Valeurs candidates, à valider par le comité de validation du modèle. Adaptez-les au projet en justifiant l&apos;écart.</p>
            {!lecture && (
              <button type="button" onClick={() => modifier((x) => { x.descriptionStress = ref.description; })}
                className="mt-1.5 text-[12.5px] font-semibold text-primary hover:underline">
                Reprendre cette description
              </button>
            )}
          </div>
        ) : (
          <p className="text-[12.5px] text-muted-foreground">Choisissez le secteur du projet (bloc 1) pour afficher son scénario de référence.</p>
        )}

        {!lecture && (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Champ cible="aide-recettes" libelle="Recettes d'une année type" aide="MMAD, scénario central">
                <Nombre cible="aide-recettes" valeur={recettes} min={0} onChange={setRecettes} />
              </Champ>
              <Champ cible="aide-charges" libelle="Charges d'exploitation" aide="MMAD, même année">
                <Nombre cible="aide-charges" valeur={charges} min={0} onChange={setCharges} />
              </Champ>
              <Champ cible="aide-baisse" libelle="Baisse des recettes">
                <Nombre cible="aide-baisse" valeur={baisse} suffixe="%" min={0} max={100} onChange={setBaisse} />
              </Champ>
              <Champ cible="aide-hausse" libelle="Hausse des charges">
                <Nombre cible="aide-hausse" valeur={hausse} suffixe="%" min={0} max={200} onChange={setHausse} />
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
                <button type="button" onClick={() => modifier((x) => { x.choc = Math.round(calcul.choc * 1000) / 1000; })}
                  className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground">
                  <Calculator size={14} /> Appliquer ce choc
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}

function tonDscr(v: number | null, seuils: [number, number, number] | null): "favorable" | "vigilance" | "alerte" | undefined {
  if (v === null || !seuils) return undefined;
  return v < seuils[0] ? "alerte" : v < seuils[2] ? "vigilance" : "favorable";
}
