"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { ratingBadgeClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { DeleteConfirmation } from "@/components/modals/DeleteConfirmation";

/**
 * Écart conventionnel entre deux paliers adjacents : la borne haute d'un palier est
 * le seuil du palier au-dessus moins un centième.
 */
const PAS = 0.01;

interface Palier {
  id: string;
  label: string;
  description?: string | null;
  minScore: number;
  maxScore: number;
  color?: string | null;
  displayOrder: number;
}

type PalierBrut = Omit<Palier, "minScore" | "maxScore"> & {
  minScore: number | string;
  maxScore: number | string;
};

const nombre = (v: number) => String(Math.round(v * 100) / 100).replace(".", ",");

function normaliser(bruts: PalierBrut[]): Palier[] {
  return bruts
    .map((p) => ({ ...p, minScore: Number(p.minScore), maxScore: Number(p.maxScore) }))
    .sort((a, b) => b.minScore - a.minScore);
}

/**
 * Recalcule les bornes hautes à partir des seuils : la borne haute d'un palier est
 * le seuil du palier au-dessus moins un centième, et le palier le plus haut monte
 * à 100. Recouvrements et trous deviennent impossibles par construction.
 */
function recomposer(paliers: Palier[]): Palier[] {
  const tries = [...paliers].sort((a, b) => b.minScore - a.minScore);
  return tries.map((p, i) => ({
    ...p,
    maxScore: i === 0 ? 100 : Math.round((tries[i - 1].minScore - PAS) * 100) / 100,
    displayOrder: i + 1,
  }));
}

/**
 * Édition du barème score → note.
 *
 * Le barème s'éditait comme un mur de quarante champs — libellé, borne basse, borne
 * haute et description pour chacun des dix paliers — alors qu'un barème contigu ne se
 * règle qu'avec neuf seuils : chaque borne haute se déduit du seuil au-dessus.
 * Déplacer BBB obligeait à modifier aussi la borne haute de BB, faute de quoi l'écran
 * affichait « se recouvrent ». Une corbeille par ligne supprimait sans confirmation,
 * et vider le barème faisait retomber le moteur, sans le dire, sur son barème de repli.
 */
export default function BaremePage() {
  const router = useRouter();
  const [paliers, setPaliers] = useState<Palier[]>([]);
  const [initial, setInitial] = useState<Palier[]>([]);
  const [dossiers, setDossiers] = useState<{ nom: string; score: number }[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [avertissements, setAvertissements] = useState<string[]>([]);
  const [aSupprimer, setASupprimer] = useState<number | null>(null);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet("/api/admin/scoring/configuration?type=ratingScales");
      if (res.status === 401) return router.push("/login");
      if (res.status === 403) return router.push("/");
      const json = await res.json();
      const data = recomposer(normaliser(json.data ?? []));
      setPaliers(data);
      setInitial(data);

      // Les dossiers notés se placent sur l'échelle : on voit ce qu'un déplacement
      // de seuil ferait, au lieu de le deviner.
      const resEvals = await apiGet("/api/evaluations?limit=200");
      if (resEvals.ok) {
        const liste = (await resEvals.json()).data ?? [];
        setDossiers(
          liste
            .filter((e: { finalScore: number | null }) => e.finalScore != null)
            .map((e: { finalScore: number; project?: { nom?: string } }) => ({
              nom: e.project?.nom ?? "Dossier",
              score: e.finalScore,
            }))
        );
      }
    } catch {
      setErreurs(["Impossible de charger le barème."]);
    } finally {
      setChargement(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  const modifies = useMemo(() => {
    let n = 0;
    for (const p of paliers) {
      const avant = initial.find((x) => x.id === p.id);
      if (!avant || avant.minScore !== p.minScore || avant.label !== p.label) n += 1;
    }
    return n + Math.max(0, initial.length - paliers.length);
  }, [paliers, initial]);

  const controles = useMemo(() => {
    const err: string[] = [];
    const avert: string[] = [];
    for (const p of paliers) {
      if (!p.label.trim()) err.push("Un palier n'a pas de libellé.");
      if (p.minScore < 0 || p.minScore > 100) {
        err.push(`« ${p.label || "sans libellé"} » : seuil hors de l'échelle 0–100.`);
      }
    }
    const seuils = paliers.map((p) => p.minScore);
    if (new Set(seuils).size !== seuils.length) {
      err.push("Deux paliers partagent le même seuil.");
    }
    const bas = paliers[paliers.length - 1];
    if (bas && bas.minScore > 0) {
      avert.push(`Les scores sous ${nombre(bas.minScore)} ne sont couverts par aucun palier.`);
    }
    if (paliers.length === 0) {
      avert.push(
        "Barème vide : le moteur retomberait sur son barème de repli (AAA ≥ 90, A ≥ 70…), " +
          "sans rapport avec celui de la banque."
      );
    }
    return { err, avert };
  }, [paliers]);

  const majSeuil = (id: string, valeur: string) => {
    setEnregistre(false);
    setPaliers((prec) =>
      recomposer(
        prec.map((p) =>
          p.id === id
            ? { ...p, minScore: valeur.trim() === "" ? 0 : Number(valeur.replace(",", ".")) }
            : p
        )
      )
    );
  };

  const majChamp = (id: string, champ: "label" | "description", valeur: string) => {
    setEnregistre(false);
    setPaliers((prec) => prec.map((p) => (p.id === id ? { ...p, [champ]: valeur } : p)));
  };

  const ajouter = () => {
    setEnregistre(false);
    setPaliers((prec) => {
      // Le nouveau palier se glisse sous le plus bas, à mi-chemin de zéro : il ne
      // recouvre rien et n'affiche donc aucune erreur avant la saisie du libellé.
      const plusBas = prec[prec.length - 1];
      const seuil = plusBas ? Math.max(0, Math.round((plusBas.minScore / 2) * 100) / 100) : 0;
      return recomposer([
        ...prec,
        {
          id: `PALIER_${Date.now()}`,
          label: "",
          minScore: seuil,
          maxScore: 0,
          color: null,
          displayOrder: prec.length + 1,
        },
      ]);
    });
  };

  const supprimer = (index: number) => {
    setEnregistre(false);
    setPaliers((prec) => recomposer(prec.filter((_, i) => i !== index)));
    setASupprimer(null);
  };

  const enregistrer = async () => {
    setEnregistrement(true);
    setErreurs([]);
    setAvertissements([]);
    try {
      const res = await apiPut("/api/admin/scoring/configuration?type=ratingScales", {
        scales: recomposer(paliers).map((p, i) => ({ ...p, displayOrder: i + 1 })),
      });
      const json = await res.json();
      if (!res.ok) {
        const messages: string[] = (json.errors ?? []).map(
          (e: { message: string }) => e.message
        );
        setErreurs(messages.length > 0 ? messages : [json.error ?? "Enregistrement refusé."]);
        return;
      }
      const data = recomposer(normaliser(json.data?.scales ?? []));
      setPaliers(data);
      setInitial(data);
      setAvertissements(json.data?.warnings ?? []);
      setEnregistre(true);
    } catch {
      setErreurs(["Erreur réseau lors de l'enregistrement."]);
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  /** Dossiers qui changeraient de note si le barème était enregistré tel quel. */
  const noteDe = (score: number, liste: Palier[]) =>
    liste.find((p) => score >= p.minScore && score <= p.maxScore)?.label ?? "—";
  const bascules = dossiers
    .map((d) => ({
      ...d,
      avant: noteDe(d.score, initial),
      apres: noteDe(d.score, paliers),
    }))
    .filter((d) => d.avant !== d.apres);

  return (
    <div className="pb-20">
      <PageHeader
        titre="Barème de notation"
        description="Correspondance entre le score final (0–100) et la note. Le moteur lit ce barème à chaque calcul : une modification vaut pour les évaluations calculées ensuite, sans toucher aux notes déjà enregistrées."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
      />

      {erreurs.length > 0 && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          <p className="mb-1 inline-flex items-center gap-2 font-semibold">
            <AlertTriangle size={15} />
            Barème refusé
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {erreurs.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {enregistre && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success-subtle px-4 py-2 text-sm text-success">
          <Check size={15} />
          Barème enregistré.
        </div>
      )}

      {avertissements.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <ul className="list-disc space-y-0.5 pl-5">
            {avertissements.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* L'échelle en clair : l'aperçu arrivait sous les boutons, en pastilles qui
          passaient à la ligne, et ne montrait pas l'échelle se déformer. */}
      <SectionCard titre="Échelle" description="0 à 100, telle que le moteur la lira." className="mb-4">
        <div className="relative h-9 w-full overflow-hidden rounded-md border border-border">
          {[...paliers].map((p) => {
            const largeur = Math.max(0, p.maxScore - p.minScore + PAS);
            return (
              <span
                key={p.id}
                title={`${p.label} : ${nombre(p.minScore)} à ${nombre(p.maxScore)}`}
                className={`absolute top-0 flex h-full items-center justify-center border-r border-border text-[11px] font-bold ${ratingBadgeClass(p.label)}`}
                style={{ left: `${p.minScore}%`, width: `${largeur}%` }}
              >
                {largeur > 4 ? p.label : ""}
              </span>
            );
          })}
        </div>
        <div className="relative mt-1 h-10">
          {dossiers.map((d, i) => (
            <span
              key={`${d.nom}-${i}`}
              title={`${d.nom} — ${nombre(d.score)}/100`}
              className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground"
              style={{ left: `${Math.min(100, Math.max(0, d.score))}%` }}
            >
              <span className="block text-center text-foreground">▲</span>
              <span className="block whitespace-nowrap">{nombre(d.score)}</span>
            </span>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabulaire">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </SectionCard>

      {bascules.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <p className="mb-1 font-semibold">
            Avec ce barème, {bascules.length} dossier{bascules.length > 1 ? "s" : ""} changerait
            {bascules.length > 1 ? "aient" : ""} de note au prochain calcul :
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {bascules.map((d, i) => (
              <li key={i}>
                {d.nom} ({nombre(d.score)}) : {d.avant} → {d.apres}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[12px]">
            Les notes déjà enregistrées ne sont pas modifiées.
          </p>
        </div>
      )}

      <SectionCard
        titre="Paliers"
        description="Seul le seuil bas se saisit : la borne haute est celle du palier au-dessus, moins un centième."
        sansPadding
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Note", "Seuil bas", "Couvre", "Description", ""].map((t, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paliers.map((p, index) => (
              <tr key={p.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2">
                  <input
                    value={p.label}
                    onChange={(e) => majChamp(p.id, "label", e.target.value)}
                    aria-label={`Note du palier ${index + 1}`}
                    className={`w-20 rounded-md border px-2 py-1.5 text-center text-sm font-bold ${ratingBadgeClass(p.label)} ${
                      p.label.trim() ? "border-border" : "border-destructive"
                    }`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={100}
                    value={p.minScore}
                    onChange={(e) => majSeuil(p.id, e.target.value)}
                    aria-label={`Seuil bas de ${p.label || `palier ${index + 1}`}`}
                    className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground tabulaire focus:border-ring focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-[12.5px] text-muted-foreground tabulaire">
                  {nombre(p.minScore)} à {nombre(p.maxScore)}
                </td>
                <td className="px-4 py-2">
                  <input
                    value={p.description ?? ""}
                    onChange={(e) => majChamp(p.id, "description", e.target.value)}
                    placeholder="Équivalence, catégorie de risque…"
                    aria-label={`Description de ${p.label || `palier ${index + 1}`}`}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => setASupprimer(index)}
                    aria-label={`Supprimer le palier ${p.label || index + 1}`}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive-subtle hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-border px-4 py-3">
          <button
            onClick={ajouter}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Plus size={15} />
            Ajouter un palier
          </button>
        </div>
      </SectionCard>

      {controles.err.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[12.5px] text-destructive">
          {controles.err.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {controles.avert.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-[12.5px] text-warning">
          {controles.avert.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <span className="mr-auto text-[12.5px] text-muted-foreground">
          {modifies > 0
            ? `${modifies} palier${modifies > 1 ? "s" : ""} modifié${modifies > 1 ? "s" : ""}`
            : "Aucune modification"}
        </span>
        <button
          onClick={() => {
            setPaliers(initial);
            setEnregistre(false);
          }}
          disabled={modifies === 0}
          className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          Annuler
        </button>
        <button
          onClick={enregistrer}
          disabled={enregistrement || modifies === 0 || controles.err.length > 0}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enregistrement && <Loader2 size={15} className="animate-spin" />}
          Enregistrer le barème
        </button>
      </div>

      {aSupprimer !== null && (
        <DeleteConfirmation
          isOpen
          onCancel={() => setASupprimer(null)}
          onConfirm={() => supprimer(aSupprimer)}
          title="Supprimer ce palier ?"
          message={`Le palier « ${paliers[aSupprimer]?.label || "sans libellé"} » sera retiré du barème. Les scores qu'il couvrait seront rattachés au palier inférieur. Les notes déjà enregistrées ne changent pas.`}
        />
      )}
    </div>
  );
}
