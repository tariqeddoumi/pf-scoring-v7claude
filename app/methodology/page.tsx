"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { useVoirScores } from "@/components/providers/visibilite-scores";
import { REGISTRE_TEXTES, statutTexte } from "@/lib/referentiel-reglementaire";
import {
  DOMAINES_GRILLE,
  ORDRE_DOMAINES,
  ORDRE_PLAFONDS,
  ORDRE_VERROUS,
  type CodePhase,
  type ParametresModele,
} from "@/lib/modele-pf/parametres";

const PHASES: CodePhase[] = ["P1", "P2", "P3"];
const pct = (x: number) => `${Math.round(x * 100)} %`;
const dec = (x: number) => x.toFixed(2).replace(".", ",");
const NOYAU = [
  "N1 · DSCR minimum, scénario central",
  "N2 · DSCR minimum, scénario défavorable",
  "N3 · LLCR ou financement à terminaison",
  "N4 · Liquidité (DSRA, lignes, cascade)",
  "N5 · Levier et fonds propres à risque",
  "N6 · Exposition résiduelle taux / change / refinancement",
];

/**
 * Méthodologie : le modèle de scoring Project Finance tel qu'il est appliqué, lu dans
 * les paramètres en vigueur.
 *
 * La page décrivait la version publiée de l'ancien questionnaire générique, que plus
 * aucune évaluation n'utilise : un analyste ne pouvait pas y retrouver la note d'un
 * dossier. La conversion en note et le niveau des plafonds ne sont présentés qu'aux
 * rôles qui voient les scores.
 */
export default function MethodologiePage() {
  const voirScores = useVoirScores();
  const [P, setP] = useState<ParametresModele | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiGet("/api/modele-pf/parametres");
      if (!res.ok) {
        setErreur(await messageErreurApi(res, "Chargement de la méthodologie impossible."));
        return;
      }
      setP((await res.json()).parametres);
    })().catch(() => setErreur("Chargement de la méthodologie impossible."));
  }, []);

  if (erreur) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
        {erreur}
      </div>
    );
  }
  if (!P) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  const nbSousCriteres = DOMAINES_GRILLE.reduce((s, d) => s + P.sousCriteres[d].length, 0);

  return (
    <div>
      <PageHeader
        titre="Méthodologie"
        description="Modèle de scoring Project Finance en vigueur : paramètres appliqués par l'outil à chaque calcul."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tuile libelle="Domaines" valeur={ORDRE_DOMAINES.length} />
        <Tuile libelle="Critères de la grille" valeur={nbSousCriteres} />
        <Tuile libelle="Indicateurs du noyau" valeur={NOYAU.length} />
        <Tuile libelle="Plafonds et verrous" valeur={ORDRE_PLAFONDS.length + ORDRE_VERROUS.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            titre="Comment la note est construite"
            description="La note approuvée est la plus basse entre la note calculée et les plafonds actifs."
          >
            <ol className="list-inside list-decimal space-y-1.5 text-sm text-foreground">
              <li>Routage : régime de revenus, secteur et phase fixent les seuils DSCR et le poids des domaines.</li>
              <li>Noyau financier D7 : six indicateurs N1 à N6.</li>
              <li>Grille qualitative : {nbSousCriteres} critères, une situation choisie pour chacun.</li>
              <li>Score sur 100, converti en note de 1 à 10 puis en grade AAA à D.</li>
              <li>Plafonds (note maximale) et verrous (exclusion ou note provisoire).</li>
            </ol>
          </SectionCard>

          <SectionCard titre="Poids des domaines selon la phase" sansPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 text-left font-semibold">Domaine</th>
                    {PHASES.map((ph) => (
                      <th key={ph} className="px-4 py-2 text-right font-semibold">
                        {ph} · {P.phases[ph].libelle}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ORDRE_DOMAINES.map((d) => (
                    <tr key={d} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2 text-foreground">
                        <span className="mr-2 text-muted-foreground">{d}</span>
                        {P.libellesDomaines[d]}
                      </td>
                      {PHASES.map((ph) => (
                        <td key={ph} className="px-4 py-2 text-right tabulaire">
                          {pct(P.poidsDomaines[ph][d])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard titre="Critères de la grille et du noyau" description="Poids de chaque critère dans son domaine.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {DOMAINES_GRILLE.map((d) => (
                <div key={d}>
                  <p className="mb-1 text-[12.5px] font-semibold text-foreground">
                    {d} · {P.libellesDomaines[d]}
                  </p>
                  <ul className="space-y-0.5 text-[12.5px] text-muted-foreground">
                    {P.sousCriteres[d].map((c) => (
                      <li key={c.cle} className="flex justify-between gap-3">
                        <span>
                          {c.cle} · {c.libelle}
                        </span>
                        <span className="tabulaire">{pct(c.poids)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className="mb-1 text-[12.5px] font-semibold text-foreground">D7 · {P.libellesDomaines.D7}</p>
                <ul className="space-y-0.5 text-[12.5px] text-muted-foreground">
                  {NOYAU.map((n, i) => (
                    <li key={n} className="flex justify-between gap-3">
                      <span>{n}</span>
                      <span className="tabulaire">{pct(P.poidsNoyau[i])}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            titre="Plafonds et verrous"
            description="Déclenchés par les données saisies ; le chargé d'affaires ne les choisit pas."
          >
            <ul className="space-y-1.5 text-[12.5px]">
              {ORDRE_PLAFONDS.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="w-10 shrink-0 font-semibold text-foreground">{c}</span>
                  <span className="min-w-0 flex-1 text-muted-foreground">{P.plafonds[c].libelle}</span>
                  {voirScores && P.plafonds[c].niveau > 0 && (
                    <span className="shrink-0 text-foreground tabulaire">note ≤ {P.plafonds[c].niveau}</span>
                  )}
                </li>
              ))}
              {ORDRE_VERROUS.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="w-10 shrink-0 font-semibold text-foreground">{c}</span>
                  <span className="min-w-0 flex-1 text-muted-foreground">{P.verrous[c].libelle}</span>
                  <span className="shrink-0 text-foreground">
                    {c.startsWith("X") ? "aucune note" : `bloque : ${P.verrous[c].stade}`}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard
            titre="Cadre réglementaire et normes"
            description="Registre des textes et de leur traduction dans l'outil — à valider par la Conformité et le Juridique."
          >
            <ul className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              {REGISTRE_TEXTES.map((t) => (
                <li key={t.code}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <strong className="text-foreground">
                      {t.emetteur} — {t.type} {t.intitule}
                    </strong>
                    <span className="text-[12px]">
                      {[t.date ? `du ${t.date.split("-").reverse().join("/")}` : null, t.articles].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <div className="text-[12px]">
                    {statutTexte(t)} · dans l&apos;outil : {t.etatOutil}
                  </div>
                  <div>{t.consequence}</div>
                </li>
              ))}
              <li>
                <strong className="text-foreground">Normes de performance de la SFI (IFC) et BERD</strong> —
                évaluation des risques environnementaux, sociaux et de gouvernance du projet.
              </li>
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard titre="Seuils DSCR par régime" description="Seuil appliqué = base du régime + écart du secteur + majoration de phase.">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="pb-1 text-left font-semibold">Régime</th>
                  <th className="pb-1 text-right font-semibold">Critique</th>
                  <th className="pb-1 text-right font-semibold">Vigilance</th>
                  <th className="pb-1 text-right font-semibold">Favorable</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(P.regimes) as (keyof ParametresModele["regimes"])[]).map((r) => (
                  <tr key={r} title={P.regimes[r].libelle}>
                    <td className="py-0.5 text-foreground">{r}</td>
                    {P.regimes[r].seuils.map((s, i) => (
                      <td key={i} className="py-0.5 text-right tabulaire">
                        {dec(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="mt-3 space-y-0.5 border-t border-border pt-3 text-[12px] text-muted-foreground">
              {(Object.keys(P.regimes) as (keyof ParametresModele["regimes"])[]).map((r) => (
                <li key={r}>
                  {r} · {P.regimes[r].libelle}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard titre="Écart sectoriel">
            <ul className="space-y-0.5 text-[12.5px]">
              {Object.entries(P.secteurs).map(([code, s]) => (
                <li key={code} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{s.libelle}</span>
                  <span className="text-foreground tabulaire">
                    {s.delta > 0 ? "+" : ""}
                    {dec(s.delta)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Majoration en montée en charge : +{dec(P.phases.P2.majoration)}.
            </p>
          </SectionCard>

          {voirScores && P.conversion.length > 0 && (
            <SectionCard titre="Du score à la note et au grade">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="pb-1 text-left font-semibold">Score dès</th>
                    <th className="pb-1 text-left font-semibold">Note</th>
                    <th className="pb-1 text-left font-semibold">Grade</th>
                    <th className="pb-1 text-left font-semibold">Libellé</th>
                  </tr>
                </thead>
                <tbody>
                  {[...P.conversion].reverse().map((c) => (
                    <tr key={c.note} title={c.orientation}>
                      <td className="py-0.5 tabulaire">{c.seuil}</td>
                      <td className="py-0.5 font-semibold text-foreground">{c.note}</td>
                      <td className="py-0.5 text-foreground">{P.correspondanceGrades[String(c.note)] ?? "—"}</td>
                      <td className="py-0.5 text-muted-foreground">{c.libelle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          )}

          <SectionCard titre="Échelle des situations">
            <ul className="space-y-0.5 text-[12.5px]">
              {[
                ["Très favorable", P.ancres.tresFavorable],
                ["Favorable", P.ancres.favorable],
                ["Vigilance", P.ancres.vigilance],
                ["Critique", P.ancres.critique],
                ["Info. insuffisante", P.ancres.infoInsuffisante],
              ].map(([l, v]) => (
                <li key={l as string} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="text-foreground tabulaire">{v} points</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Un dossier soumis garde les paramètres de sa soumission : une modification ultérieure ne change aucune
              note déjà soumise.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Tuile({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{libelle}</p>
      <p className="mt-1 text-[19px] font-semibold text-foreground tabulaire">{valeur}</p>
    </div>
  );
}
