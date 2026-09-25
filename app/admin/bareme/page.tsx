"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ratingBadgeClass } from "@/lib/score-colors";

/**
 * Écart entre deux paliers adjacents dans la convention d'écriture du barème,
 * majoré d'une tolérance flottante (25 − 24,99 ne vaut pas exactement 0,01).
 * Doit rester aligné sur la constante homonyme du service de configuration.
 */
const PAS_BAREME = 0.01 + 1e-9;

interface Palier {
  id: string;
  label: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  color?: string | null;
  displayOrder: number;
}

/** Les bornes arrivent en JSON sous forme de nombres ou de chaînes selon le pilote SQL. */
type PalierBrut = Omit<Palier, "minScore" | "maxScore"> & {
  minScore: number | string;
  maxScore: number | string;
};

function normaliser(bruts: PalierBrut[]): Palier[] {
  return bruts.map((p) => ({
    ...p,
    minScore: Number(p.minScore),
    maxScore: Number(p.maxScore),
  }));
}

/**
 * Édition du barème score → note.
 *
 * Le barème décidait de la note depuis le code, en trois exemplaires divergents.
 * Il vit désormais dans BP_PF_v7pp_rating_scales, que le moteur lit à chaque calcul :
 * cet écran est le seul endroit où on le change, sans redéploiement.
 */
export default function BaremePage() {
  const router = useRouter();
  const [paliers, setPaliers] = useState<Palier[]>([]);
  const [initial, setInitial] = useState<Palier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/admin/scoring/configuration?type=ratingScales");
      if (res.status === 401) return router.push("/login");
      if (res.status === 403) return router.push("/");
      const json = await res.json();
      const data = normaliser(json.data ?? []);
      setPaliers(data);
      setInitial(data);
    } catch {
      setErrors(["Impossible de charger le barème."]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  const modifie = useMemo(
    () => JSON.stringify(paliers) !== JSON.stringify(initial),
    [paliers, initial]
  );

  /**
   * Contrôles locaux, identiques à ceux du serveur : l'administrateur voit un
   * recouvrement avant d'enregistrer, mais c'est le serveur qui refuse réellement.
   */
  const controles = useMemo(() => {
    const err: string[] = [];
    const avert: string[] = [];
    const tries = [...paliers].sort((a, b) => a.minScore - b.minScore);

    for (const p of paliers) {
      if (!p.label.trim()) err.push(`Un palier n'a pas de libellé.`);
      if (p.minScore > p.maxScore) {
        err.push(`« ${p.label || p.id} » : borne basse supérieure à la borne haute.`);
      }
    }
    for (let i = 1; i < tries.length; i++) {
      const a = tries[i - 1];
      const b = tries[i];
      if (b.minScore <= a.maxScore) {
        err.push(
          `« ${a.label} » et « ${b.label} » se recouvrent entre ${b.minScore} et ${a.maxScore}.`
        );
      } else if (b.minScore - a.maxScore > PAS_BAREME) {
        // Même tolérance que le serveur : l'interstice d'un centième entre deux
        // paliers adjacents est la convention d'écriture du barème, pas un défaut.
        avert.push(
          `Aucun palier entre ${a.maxScore} et ${b.minScore} (« ${a.label} » → « ${b.label} »).`
        );
      }
    }
    if (tries.length > 0) {
      if (tries[0].minScore > 0) {
        avert.push(`Scores sous ${tries[0].minScore} non couverts.`);
      }
      const haut = tries[tries.length - 1].maxScore;
      if (haut < 100) avert.push(`Scores au-dessus de ${haut} non couverts.`);
    }
    return { err, avert };
  }, [paliers]);

  const majPalier = (index: number, champ: keyof Palier, valeur: string) => {
    setSaved(false);
    setPaliers((prec) =>
      prec.map((p, i) =>
        i === index
          ? {
              ...p,
              [champ]:
                champ === "minScore" || champ === "maxScore"
                  ? Number(valeur)
                  : valeur,
            }
          : p
      )
    );
  };

  const ajouter = () => {
    setSaved(false);
    setPaliers((prec) => [
      ...prec,
      {
        id: `PALIER_${Date.now()}`,
        label: "",
        minScore: 0,
        maxScore: 0,
        color: null,
        displayOrder: prec.length + 1,
      },
    ]);
  };

  const supprimer = (index: number) => {
    setSaved(false);
    setPaliers((prec) => prec.filter((_, i) => i !== index));
  };

  const enregistrer = async () => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    try {
      const res = await apiPut("/api/admin/scoring/configuration?type=ratingScales", {
        scales: paliers.map((p, i) => ({ ...p, displayOrder: i + 1 })),
      });
      const json = await res.json();
      if (!res.ok) {
        const messages: string[] = (json.errors ?? []).map(
          (e: { message: string }) => e.message
        );
        setErrors(
          messages.length > 0 ? messages : [json.error ?? "Enregistrement refusé."]
        );
        return;
      }
      const data = normaliser(json.data?.scales ?? []);
      setPaliers(data);
      setInitial(data);
      setWarnings(json.data?.warnings ?? []);
      setSaved(true);
    } catch {
      setErrors(["Erreur réseau lors de l'enregistrement."]);
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

  const tries = [...paliers].sort((a, b) => b.minScore - a.minScore);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Paramétrage
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Barème de notation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Correspondance entre le score final (0–100) et la note attribuée. Le moteur lit
          ce barème à chaque calcul : une modification s&apos;applique aux évaluations
          calculées ensuite, sans toucher aux notes déjà enregistrées.
        </p>
      </div>

      {errors.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive font-medium mb-2">
            <AlertTriangle size={16} />
            Barème refusé
          </div>
          <ul className="text-sm text-destructive/90 space-y-1 list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      {controles.err.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive font-medium mb-2">
            <AlertTriangle size={16} />
            À corriger avant d&apos;enregistrer
          </div>
          <ul className="text-sm text-destructive/90 space-y-1 list-disc pl-5">
            {Array.from(new Set(controles.err)).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      {(controles.avert.length > 0 || warnings.length > 0) && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-warning font-medium mb-2">
            <AlertTriangle size={16} />
            Points de vigilance
          </div>
          <ul className="text-sm text-warning/90 space-y-1 list-disc pl-5">
            {Array.from(new Set([...controles.avert, ...warnings])).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Un score tombant dans un intervalle non couvert reçoit malgré tout la note du
            palier immédiatement inférieur, avec une alerte dans la trace de calcul.
          </p>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Note</th>
              <th className="text-left font-medium px-4 py-3 w-28">Score min.</th>
              <th className="text-left font-medium px-4 py-3 w-28">Score max.</th>
              <th className="text-left font-medium px-4 py-3">Description</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {paliers.map((p, i) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <Input
                    value={p.label}
                    onChange={(e) => majPalier(i, "label", e.target.value)}
                    className="h-9"
                    aria-label={`Libellé du palier ${i + 1}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={p.minScore}
                    onChange={(e) => majPalier(i, "minScore", e.target.value)}
                    className="h-9"
                    aria-label={`Score minimum du palier ${p.label || i + 1}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={p.maxScore}
                    onChange={(e) => majPalier(i, "maxScore", e.target.value)}
                    className="h-9"
                    aria-label={`Score maximum du palier ${p.label || i + 1}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={p.description ?? ""}
                    onChange={(e) => majPalier(i, "description", e.target.value)}
                    className="h-9"
                    placeholder="Facultatif"
                    aria-label={`Description du palier ${p.label || i + 1}`}
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => supprimer(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Supprimer le palier ${p.label || i + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={ajouter}>
          <Plus size={16} className="mr-2" />
          Ajouter un palier
        </Button>
        <Button
          onClick={enregistrer}
          disabled={saving || !modifie || controles.err.length > 0}
        >
          {saving ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : saved ? (
            <Check size={16} className="mr-2" />
          ) : null}
          {saved && !modifie ? "Barème enregistré" : "Enregistrer le barème"}
        </Button>
        {modifie && (
          <Button
            variant="ghost"
            onClick={() => {
              setPaliers(initial);
              setErrors([]);
              setWarnings([]);
            }}
          >
            <RotateCcw size={16} className="mr-2" />
            Annuler les modifications
          </Button>
        )}
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-medium text-foreground mb-3">
          Aperçu de l&apos;échelle
        </h2>
        <div className="flex flex-wrap gap-2">
          {tries.map((p) => (
            <span
              key={p.id}
              className={`px-2.5 py-1 rounded text-xs font-medium border ${ratingBadgeClass(p.label)}`}
            >
              {p.label || "—"} · {p.minScore}–{p.maxScore}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
