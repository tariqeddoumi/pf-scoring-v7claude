"use client";

import { useState } from "react";
import { Calculator, Loader2, Plus, Trash2 } from "lucide-react";
import { apiPost, messageErreurApi } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

interface LignePeriode {
  libelle: string;
  cfads: string;
  serviceMad: string;
  serviceDevise: string;
  couvertureDevise: string;
  ballon: string;
}

interface ResultatPeriode {
  libelle: string;
  cfads: number;
  service: number;
  dscr: number | null;
  sousSeuil: boolean;
  deficit: number;
  tirageDsra: number;
  dsraFin: number;
  deficitNonCouvert: number;
}

interface ResultatFlux {
  scenario: string;
  periodes: ResultatPeriode[];
  dscrMin: number | null;
  periodeDscrMin: string | null;
  nbPeriodesSousSeuil: number;
  dsraMinimale: number;
  deficitNonCouvertTotal: number;
}

const ligneVide = (i: number): LignePeriode => ({
  libelle: `S${i + 1}`,
  cfads: "",
  serviceMad: "",
  serviceDevise: "",
  couvertureDevise: "",
  ballon: "",
});

const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));
const fx = (v: number | null, d = 2) =>
  v === null ? "—" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const champ =
  "h-8 w-full rounded-md border border-border bg-card px-2 text-right text-sm tabulaire focus:border-ring focus:outline-none";

/**
 * Simulation des flux d'un financement de projet.
 *
 * Le scoring notait des ratios déclarés ; cet écran recalcule le DSCR période par
 * période, l'utilisation de la DSRA et les scénarios de stress à partir des séries
 * (montants en millions de MAD), pour rapprocher le DSCR saisi dans la grille d'un
 * calcul vérifiable.
 */
export default function SimulationFluxPage() {
  const [lignes, setLignes] = useState<LignePeriode[]>([0, 1, 2, 3].map(ligneVide));
  const [seuil, setSeuil] = useState("1,20");
  const [dsra, setDsra] = useState("0");
  const [chocCfads, setChocCfads] = useState("-15");
  const [chocChange, setChocChange] = useState("15");
  const [resultats, setResultats] = useState<ResultatFlux[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [calcul, setCalcul] = useState(false);

  const maj = (i: number, cle: keyof LignePeriode, v: string) =>
    setLignes((l) => l.map((x, j) => (j === i ? { ...x, [cle]: v } : x)));

  const calculer = async () => {
    setErreur(null);
    const periodes = lignes
      .filter((l) => l.cfads.trim() !== "" || l.serviceMad.trim() !== "")
      .map((l) => ({
        libelle: l.libelle || "—",
        cfads: num(l.cfads) ?? 0,
        serviceMad: num(l.serviceMad) ?? 0,
        serviceDevise: num(l.serviceDevise),
        couvertureDevise: num(l.couvertureDevise) !== undefined ? (num(l.couvertureDevise) as number) / 100 : undefined,
        ballon: num(l.ballon),
      }));
    if (periodes.length === 0) {
      setErreur("Saisissez au moins une période (CFADS et service de la dette).");
      return;
    }
    const scenarios = [
      { nom: `CFADS ${chocCfads} %`, chocCfads: (num(chocCfads) ?? 0) / 100 },
      { nom: `Devise +${chocChange} %`, chocChange: (num(chocChange) ?? 0) / 100 },
      { nom: "Ballon non refinancé", ballonNonRefinance: true },
    ];
    setCalcul(true);
    try {
      const res = await apiPost("/api/finance/flux", {
        seuilDscr: num(seuil) ?? 1.2,
        dsraInitiale: num(dsra) ?? 0,
        periodes,
        scenarios,
      });
      if (!res.ok) throw new Error(await messageErreurApi(res, "Calcul impossible."));
      const { data } = await res.json();
      setResultats([data.base, ...data.scenarios]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Calcul impossible.");
      setResultats(null);
    } finally {
      setCalcul(false);
    }
  };

  return (
    <div>
      <PageHeader
        titre="Simulation des flux"
        description="DSCR par période, réserve DSRA et scénarios de stress, en millions de MAD"
      />

      <SectionCard
        titre="Échéancier"
        description="Le DSCR de chaque période = CFADS ÷ service de la dette de la même période. Le minimum est retenu, jamais une moyenne annuelle."
        actions={
          <button
            onClick={() => setLignes((l) => [...l, ligneVide(l.length)])}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent"
          >
            <Plus size={14} /> Période
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[12px] text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Période</th>
                <th className="px-1 font-medium">CFADS</th>
                <th className="px-1 font-medium">Service en MAD</th>
                <th className="px-1 font-medium">Service en devise</th>
                <th className="px-1 font-medium">Couverture devise (%)</th>
                <th className="px-1 font-medium">Ballon</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2">
                    <input
                      aria-label={`Libellé de la période ${i + 1}`}
                      value={l.libelle}
                      onChange={(e) => maj(i, "libelle", e.target.value)}
                      className={champ.replace("text-right", "text-left")}
                    />
                  </td>
                  {(["cfads", "serviceMad", "serviceDevise", "couvertureDevise", "ballon"] as const).map((c) => (
                    <td key={c} className="px-1 py-1">
                      <input
                        inputMode="decimal"
                        aria-label={`${c} période ${i + 1}`}
                        value={l[c]}
                        onChange={(e) => maj(i, c, e.target.value)}
                        className={champ}
                      />
                    </td>
                  ))}
                  <td className="pl-1">
                    <button
                      aria-label={`Supprimer la période ${i + 1}`}
                      onClick={() => setLignes((x) => x.filter((_, j) => j !== i))}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ["Seuil DSCR (x)", seuil, setSeuil],
            ["DSRA disponible", dsra, setDsra],
            ["Choc CFADS (%)", chocCfads, setChocCfads],
            ["Choc devise (%)", chocChange, setChocChange],
          ].map(([lib, val, set]) => (
            <label key={lib as string} className="text-[12.5px] text-muted-foreground">
              {lib as string}
              <input
                inputMode="decimal"
                value={val as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                className={champ + " mt-1"}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={calculer}
            disabled={calcul}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {calcul ? <Loader2 size={15} className="animate-spin" /> : <Calculator size={15} />}
            Calculer
          </button>
          {erreur && <span className="text-sm text-destructive">{erreur}</span>}
        </div>
      </SectionCard>

      {resultats && (
        <div className="mt-4 space-y-4">
          <SectionCard titre="Synthèse des scénarios" sansPadding>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Scénario</th>
                  <th className="px-4 py-2 text-right font-medium">DSCR minimum</th>
                  <th className="px-4 py-2 font-medium">Période</th>
                  <th className="px-4 py-2 text-right font-medium">Périodes sous seuil</th>
                  <th className="px-4 py-2 text-right font-medium">DSRA minimale</th>
                  <th className="px-4 py-2 text-right font-medium">Déficit non couvert</th>
                </tr>
              </thead>
              <tbody>
                {resultats.map((r) => (
                  <tr key={r.scenario} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-2 font-medium text-foreground">{r.scenario === "base" ? "Base" : r.scenario}</td>
                    <td className={`tabulaire px-4 py-2 text-right ${r.nbPeriodesSousSeuil > 0 ? "text-destructive" : ""}`}>
                      {fx(r.dscrMin, 3)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{r.periodeDscrMin ?? "—"}</td>
                    <td className="tabulaire px-4 py-2 text-right">{r.nbPeriodesSousSeuil}</td>
                    <td className="tabulaire px-4 py-2 text-right">{fx(r.dsraMinimale, 1)}</td>
                    <td className={`tabulaire px-4 py-2 text-right ${r.deficitNonCouvertTotal > 0 ? "text-destructive" : ""}`}>
                      {fx(r.deficitNonCouvertTotal, 1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[12.5px] text-muted-foreground">
              Un tirage sur la DSRA comble un manque de trésorerie mais ne relève pas le DSCR opérationnel. Un
              refinancement espéré n&apos;est pas une ressource engagée.
            </p>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
