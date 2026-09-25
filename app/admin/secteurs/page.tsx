"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FACTEUR_MAX, FACTEUR_MIN, facteurValide } from "@/lib/sector-calibration";


interface PoidsDomaine {
  domainCode: string;
  weightAdjusted: number;
}

interface PointAlerte {
  id: string;
  code: string;
  description: string;
  isNoGo: boolean;
  penalty: number | null;
}

interface TestResistance {
  id: string;
  code: string;
  description: string;
  variable: string | null;
  shockPct: number | null;
  passDscrMin: number | null;
}

interface Secteur {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  domainWeights: PoidsDomaine[];
  redFlags: PointAlerte[];
  stressTests: TestResistance[];
}

/**
 * Calibrage sectoriel.
 *
 * Les douze secteurs, leurs facteurs de pondération, leurs points d'alerte et leurs
 * tests de résistance existaient en base sans qu'aucun écran ne les montre : le
 * calibrage était figé au contenu du script d'initialisation. Cet écran l'ouvre, et
 * dit pour chaque élément ce que le moteur en fait réellement.
 */
export default function SecteursPage() {
  const router = useRouter();
  const [secteurs, setSecteurs] = useState<Secteur[]>([]);
  const [initial, setInitial] = useState<Secteur[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/admin/scoring/sectors");
      if (res.status === 401) return router.push("/login");
      if (res.status === 403) return router.push("/");
      const data: Secteur[] = (await res.json()).data ?? [];
      setSecteurs(data);
      setInitial(JSON.parse(JSON.stringify(data)));
      setSelection((prec) => prec ?? data[0]?.id ?? null);
    } catch {
      setErreurs(["Impossible de charger le calibrage sectoriel."]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  const secteur = useMemo(
    () => secteurs.find((s) => s.id === selection) ?? null,
    [secteurs, selection]
  );
  const secteurInitial = useMemo(
    () => initial.find((s) => s.id === selection) ?? null,
    [initial, selection]
  );

  const modifie = useMemo(
    () =>
      JSON.stringify(secteur?.domainWeights) !==
      JSON.stringify(secteurInitial?.domainWeights),
    [secteur, secteurInitial]
  );

  const horsBornes = useMemo(
    () =>
      (secteur?.domainWeights ?? []).filter((p) => !facteurValide(p.weightAdjusted)),
    [secteur]
  );

  const majFacteur = (domainCode: string, valeur: string) => {
    setSaved(false);
    setErreurs([]);
    setSecteurs((prec) =>
      prec.map((s) =>
        s.id === selection
          ? {
              ...s,
              domainWeights: s.domainWeights.map((p) =>
                p.domainCode === domainCode
                  ? { ...p, weightAdjusted: Number(valeur) }
                  : p
              ),
            }
          : s
      )
    );
  };

  const enregistrer = async () => {
    if (!secteur || horsBornes.length > 0) return;
    setSaving(true);
    setErreurs([]);
    try {
      const res = await apiPut(`/api/admin/scoring/sectors?id=${secteur.id}`, {
        domainWeights: secteur.domainWeights,
      });
      const json = await res.json();
      if (!res.ok) {
        const messages: string[] = (json.errors ?? []).map(
          (e: { message: string }) => e.message
        );
        setErreurs(messages.length > 0 ? messages : [json.error ?? "Refusé."]);
        return;
      }
      await charger();
      setSaved(true);
    } catch {
      setErreurs(["Erreur réseau lors de l'enregistrement."]);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Paramétrage
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Calibrage sectoriel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque secteur ajuste le poids des domaines par un facteur multiplicateur.
          Un facteur de 1 laisse le domaine à son poids du modèle ; 1,2 l&apos;augmente
          de 20 %.
        </p>
      </div>

      {erreurs.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/10 p-4">
          <ul className="text-sm text-destructive space-y-1 list-disc pl-5">
            {erreurs.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      {secteurs.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Aucun secteur n&apos;est configuré.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
          <Card className="p-2 h-fit">
            {secteurs.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelection(s.id);
                  setSaved(false);
                  setErreurs([]);
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  s.id === selection
                    ? "bg-muted text-foreground"
                    : "text-secondary-foreground hover:bg-accent"
                }`}
              >
                <span className="block font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {s.code}
                  {!s.isActive && " · inactif"}
                </span>
              </button>
            ))}
          </Card>

          {secteur && (
            <div className="space-y-4">
              <Card className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  Facteurs de pondération des domaines
                </h2>
                {secteur.domainWeights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ce secteur n&apos;ajuste aucun domaine : le modèle s&apos;applique
                    tel quel.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {secteur.domainWeights.map((p) => {
                      const hors = !facteurValide(p.weightAdjusted);
                      return (
                        <div key={p.domainCode}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {p.domainCode}
                          </label>
                          <Input
                            type="number"
                            step="0.05"
                            min={FACTEUR_MIN}
                            max={FACTEUR_MAX}
                            value={p.weightAdjusted}
                            onChange={(e) =>
                              majFacteur(p.domainCode, e.target.value)
                            }
                            className={`h-9 ${hors ? "border-destructive" : ""}`}
                            aria-label={`Facteur du domaine ${p.domainCode}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {horsBornes.length > 0 && (
                  <p className="text-xs text-destructive mt-3 inline-flex items-start gap-1">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    Les facteurs doivent rester entre {FACTEUR_MIN} et {FACTEUR_MAX} :
                    au-delà, le calibrage ne corrige plus le modèle, il le remplace.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Button
                    onClick={enregistrer}
                    disabled={saving || !modifie || horsBornes.length > 0}
                  >
                    {saving ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : saved ? (
                      <Check size={16} className="mr-2" />
                    ) : null}
                    {saved && !modifie ? "Calibrage enregistré" : "Enregistrer"}
                  </Button>
                  {modifie && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSecteurs(JSON.parse(JSON.stringify(initial)));
                        setErreurs([]);
                      }}
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Annuler
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-1">
                  Points d&apos;alerte ({secteur.redFlags.length})
                </h2>
                <p className="text-xs text-muted-foreground mb-3 inline-flex items-start gap-1">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  Ces points sont reportés dans la trace de calcul à titre indicatif. Le
                  moteur ne les évalue pas : ils n&apos;ont ni condition de déclenchement
                  ni rattachement à un critère. Un point marqué rédhibitoire ne bloque
                  donc pas le dossier de lui-même — pour cela, créer une règle dans{" "}
                  <Link
                    href="/admin/regles"
                    className="text-primary hover:underline"
                  >
                    Règles et seuils
                  </Link>
                  .
                </p>
                <ul className="space-y-2">
                  {secteur.redFlags.map((f) => (
                    <li key={f.id} className="text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <code className="text-xs text-muted-foreground">{f.code}</code>
                        {f.isNoGo && (
                          <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded">
                            Rédhibitoire (non appliqué)
                          </span>
                        )}
                        {f.penalty != null && f.penalty > 0 && (
                          <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded">
                            −{f.penalty} pts (non appliqué)
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {f.description}
                      </p>
                    </li>
                  ))}
                  {secteur.redFlags.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun.</li>
                  )}
                </ul>
              </Card>

              <Card className="p-4">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  Tests de résistance ({secteur.stressTests.length})
                </h2>
                <ul className="space-y-2">
                  {secteur.stressTests.map((t) => (
                    <li key={t.id} className="text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <code className="text-xs text-muted-foreground">{t.code}</code>
                        {t.variable && (
                          <span className="text-xs text-muted-foreground">
                            {t.variable}
                            {t.shockPct != null && ` ${t.shockPct > 0 ? "+" : ""}${t.shockPct} %`}
                          </span>
                        )}
                        {t.passDscrMin != null && (
                          <span className="text-xs text-muted-foreground">
                            seuil de réussite DSCR ≥ {t.passDscrMin}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t.description}
                      </p>
                    </li>
                  ))}
                  {secteur.stressTests.length === 0 && (
                    <li className="text-sm text-muted-foreground">Aucun.</li>
                  )}
                </ul>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
