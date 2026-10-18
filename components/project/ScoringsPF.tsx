"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import { useVoirScores } from "@/components/providers/visibilite-scores";

interface Ligne {
  id: string;
  titre: string | null;
  statut: string;
  noteApprouvee?: string | null;
  statutNote: string | null;
  regimeRetenu: string | null;
  updatedAt: string;
}

const STATUTS: Record<string, string> = { brouillon: "Brouillon", soumis: "Soumis", valide: "Validé", rejete: "Rejeté" };

/** Scorings du projet selon le modèle Project Finance (parcours en 13 blocs). */
export function ScoringsPF({ projetId, peutCreer }: { projetId: string; peutCreer: boolean }) {
  const router = useRouter();
  const voirScores = useVoirScores();
  const [liste, setListe] = useState<Ligne[] | null>(null);
  const [creation, setCreation] = useState(false);
  const [mode, setMode] = useState<"vide" | "copie" | "cas">("vide");
  const [source, setSource] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cas, setCas] = useState<{ onglet: string; titre: string }[]>([]);

  const charger = useCallback(async () => {
    const r = await apiGet(`/api/projects/${projetId}/evaluations-pf`);
    setListe(r.ok ? (await r.json()).evaluations : []);
  }, [projetId]);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    if (mode !== "cas" || cas.length) return;
    apiGet("/api/modele-pf/cas-etude").then(async (r) => { if (r.ok) setCas((await r.json()).cas); });
  }, [mode, cas.length]);

  async function creer() {
    setEnvoi(true);
    setErreur(null);
    const corps = mode === "copie" ? { dupliquerDe: source } : mode === "cas" ? { casEtude: source } : {};
    const r = await apiPost(`/api/projects/${projetId}/evaluations-pf`, corps);
    setEnvoi(false);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setErreur(d.error ?? "Création impossible"); return; }
    router.push(`/scoring-pf/${d.id}`);
  }

  return (
    <SectionCard
      titre="Scoring Project Finance"
      description="Parcours en 13 blocs : routage, noyau financier, grille à situations, plafonds et verrous, commentaires."
      actions={peutCreer && !creation ? (
        <button type="button" onClick={() => setCreation(true)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          <Plus size={14} /> Nouveau
        </button>
      ) : undefined}
      sansPadding
    >
      {creation && (
        <div className="space-y-2 border-b border-border bg-surface px-4 py-3 text-[13px]">
          <div className="flex flex-wrap gap-3">
            {([["vide", "Dossier vide"], ["copie", "Copie d’un scoring"], ["cas", "Cas d’étude"]] as const).map(([m, l]) => (
              <label key={m} className="inline-flex items-center gap-1.5">
                <input type="radio" name="mode-scoring" checked={mode === m} onChange={() => { setMode(m); setSource(""); }} disabled={m === "copie" && !liste?.length} /> {l}
              </label>
            ))}
          </div>
          {mode === "copie" && (
            <select aria-label="Scoring à copier" value={source} onChange={(e) => setSource(e.target.value)} className="h-8 w-full rounded border border-border bg-card px-2">
              <option value="">Choisissez le scoring à copier…</option>
              {liste?.map((e) => <option key={e.id} value={e.id}>{e.titre || "Sans titre"} — {STATUTS[e.statut] ?? e.statut} — {formatDate(e.updatedAt)}</option>)}
            </select>
          )}
          {mode === "cas" && (
            <select aria-label="Cas d'étude" value={source} onChange={(e) => setSource(e.target.value)} className="h-8 w-full rounded border border-border bg-card px-2">
              <option value="">Choisissez un des 18 cas d’étude (fictifs)…</option>
              {cas.map((c) => <option key={c.onglet} value={c.onglet}>{c.onglet} — {c.titre}</option>)}
            </select>
          )}
          {erreur && <p role="alert" className="text-destructive">{erreur}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={creer} disabled={envoi || (mode !== "vide" && !source)} className="inline-flex h-8 items-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {envoi && <Loader2 size={13} className="animate-spin" />} Créer et ouvrir
            </button>
            <button type="button" onClick={() => setCreation(false)} className="h-8 rounded border border-border px-3 text-xs">Annuler</button>
          </div>
        </div>
      )}
      {liste === null ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground"><Loader2 size={15} className="mr-2 inline animate-spin" />Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun scoring Project Finance pour ce projet.</p>
      ) : (
        liste.map((e) => (
          <Link key={e.id} href={`/scoring-pf/${e.id}`} className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface">
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium text-foreground">{e.titre || "Scoring Project Finance"} · {STATUTS[e.statut] ?? e.statut}</span>
              {e.statutNote && <span className="block truncate text-[12px] text-muted-foreground">{e.statutNote}{e.regimeRetenu ? ` · régime ${e.regimeRetenu}` : ""}</span>}
              <span className="block text-[11.5px] text-muted-foreground">{formatDate(e.updatedAt)}</span>
            </span>
            {voirScores && e.noteApprouvee && (
              <span className="rounded-md bg-surface px-2 py-1 text-[15px] font-semibold tabular-nums text-foreground" title="Note approuvée">{e.noteApprouvee}</span>
            )}
            <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
          </Link>
        ))
      )}
    </SectionCard>
  );
}
