"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileText, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { apiDelete, apiGet, apiPost, messageErreurApi } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";
import { SectionCard } from "@/components/ui/section-card";
import type { AnalysePF, PropositionPF } from "@/lib/modele-pf/ia";

interface Piece { id: string; nom: string; taille: number; type: string; deposeLe: string }
interface Configuration { stockage: boolean; ia: boolean; iaManque: string | null; extensions: string[]; tailleMax: number }

const CONFIANCE: Record<string, { libelle: string; cls: string }> = {
  elevee: { libelle: "Élevée", cls: "text-success" },
  moyenne: { libelle: "Moyenne", cls: "text-warning" },
  faible: { libelle: "Faible", cls: "text-destructive" },
};
const BLOCS: Record<number, string> = {
  1: "Identification et routage", 2: "Proportionnalité", 3: "Sources et emplois", 4: "Données sectorielles", 5: "Hypothèses",
  6: "Échéancier et stress", 7: "Noyau financier et plafonds", 8: "Grille", 10: "Verrous", 13: "Commentaires",
};
const taille = (o: number) => (o > 1024 * 1024 ? `${(o / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(o / 1024))} Ko`);

/**
 * Pièces du dossier et lecture par l'IA : contrôle des pièces, propositions de saisie
 * pour les treize blocs avec leur source, à accepter ou rejeter une à une ; export du
 * fichier de propositions pour l'outil Excel.
 */
export function PiecesIA({ evaluationId, lecture, analyse, enregistrer, onRecharger }: {
  evaluationId: string; lecture: boolean; analyse: AnalysePF | null;
  enregistrer: () => Promise<boolean>; onRecharger: () => Promise<void>;
}) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [depot, setDepot] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<"analyse" | "decision" | "export" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const [filtre, setFiltre] = useState<"en_attente" | "toutes">("en_attente");
  const champ = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const r = await apiGet(`/api/evaluations-pf/${evaluationId}/pieces`);
    if (!r.ok) { setErreur(await messageErreurApi(r, "Pièces indisponibles.")); setPieces([]); return; }
    const d = await r.json();
    setPieces(d.pieces);
    setConfig(d.configuration);
  }, [evaluationId]);
  useEffect(() => { charger(); }, [charger]);

  // Présélection : propositions en attente, de confiance élevée ou moyenne, sur un champ vide.
  useEffect(() => {
    setChoisies(new Set((analyse?.propositions ?? []).filter((p) => p.decision === "en_attente" && p.confiance !== "faible" && p.actuelle === null).map((p) => p.cle)));
  }, [analyse]);

  const enAttente = useMemo(() => (analyse?.propositions ?? []).filter((p) => p.decision === "en_attente"), [analyse]);
  const parBloc = useMemo(() => {
    const m = new Map<number, PropositionPF[]>();
    for (const p of filtre === "toutes" ? analyse?.propositions ?? [] : enAttente) m.set(p.bloc, [...(m.get(p.bloc) ?? []), p]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [analyse, enAttente, filtre]);

  async function deposer(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    setErreur(null);
    for (const f of Array.from(fichiers)) {
      setDepot(`Envoi de « ${f.name} »…`);
      try {
        const r = await apiPost(`/api/evaluations-pf/${evaluationId}/pieces`, { fileName: f.name, fileSize: f.size, fileType: f.type });
        if (!r.ok) throw new Error(await messageErreurApi(r, "Dépôt refusé."));
        const d = await r.json();
        // Dépôt direct dans le stockage privé par le lien signé du serveur.
        const envoi = await fetch(d.url, { method: d.methode, headers: d.entetes, body: f }).catch(() => null);
        if (!envoi?.ok) {
          await apiDelete(`/api/evaluations-pf/${evaluationId}/pieces/${d.pieceId}`);
          throw new Error(`Envoi de « ${f.name} » impossible${envoi ? ` (${envoi.status})` : ""}.`);
        }
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Dépôt impossible.");
      }
    }
    setDepot(null);
    if (champ.current) champ.current.value = "";
    await charger();
  }

  async function retirer(p: Piece) {
    if (!window.confirm(`Retirer la pièce « ${p.nom} » ?`)) return;
    const r = await apiDelete(`/api/evaluations-pf/${evaluationId}/pieces/${p.id}`);
    if (!r.ok) setErreur(await messageErreurApi(r, "Retrait impossible."));
    await charger();
  }

  async function analyser() {
    setErreur(null);
    if (!(await enregistrer())) return;
    setEnCours("analyse");
    try {
      const r = await apiPost(`/api/evaluations-pf/${evaluationId}/analyse`, {});
      if (r.status === 504) throw new Error("L'analyse a dépassé la durée maximale du serveur. Relancez-la, ou retirez les pièces les plus volumineuses.");
      if (!r.ok) throw new Error(await messageErreurApi(r, "Analyse impossible."));
      await onRecharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setEnCours(null);
    }
  }

  async function decider(cles: string[], decision: "acceptee" | "rejetee") {
    if (!cles.length) return;
    const remplacees = decision === "acceptee" ? enAttente.filter((p) => cles.includes(p.cle) && p.actuelle !== null).length : 0;
    if (remplacees && !window.confirm(`${remplacees} proposition(s) remplacent une valeur déjà saisie. Continuer ?`)) return;
    setErreur(null);
    if (!(await enregistrer())) return;
    setEnCours("decision");
    const r = await apiPost(`/api/evaluations-pf/${evaluationId}/propositions`, { decisions: cles.map((cle) => ({ cle, decision })) });
    setEnCours(null);
    if (!r.ok) { setErreur(await messageErreurApi(r, "Décisions non enregistrées.")); return; }
    await onRecharger();
  }

  async function exporter(contenu: "propositions" | "saisie") {
    setErreur(null);
    if (!(await enregistrer())) return;
    setEnCours("export");
    const r = await apiGet(`/api/evaluations-pf/${evaluationId}/propositions/export?contenu=${contenu}`);
    setEnCours(null);
    if (!r.ok) { setErreur(await messageErreurApi(r, "Export impossible.")); return; }
    const nom = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") ?? "")?.[1] ?? "Propositions.xlsx";
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = nom;
    a.click();
    URL.revokeObjectURL(url);
  }

  const basculer = (cle: string) => setChoisies((s) => { const n = new Set(s); if (n.has(cle)) n.delete(cle); else n.add(cle); return n; });

  return (
    <div className="space-y-4">
      {erreur && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{erreur}</p>}

      <SectionCard
        titre="Pièces du dossier"
        description="Modèle financier, contrats, études, états financiers… L'IA les lit pour proposer la saisie ; rien n'est écrit sans votre validation."
        actions={!lecture && config?.stockage && (
          <label className="inline-flex cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
            <Upload size={14} /> Ajouter des pièces
            <input ref={champ} type="file" multiple className="sr-only" accept={config.extensions.map((e) => `.${e}`).join(",")} onChange={(e) => deposer(e.target.files)} />
          </label>
        )}
        sansPadding
      >
        {config && !config.stockage && <p className="border-b border-border px-4 py-2 text-[12.5px] text-warning">Stockage des pièces non configuré sur le serveur : le dépôt est indisponible.</p>}
        {depot && <p role="status" className="border-b border-border px-4 py-2 text-[12.5px] text-muted-foreground"><Loader2 size={13} className="mr-1.5 inline animate-spin" />{depot}</p>}
        {pieces === null ? (
          <p className="px-4 py-5 text-center text-sm text-muted-foreground"><Loader2 size={15} className="mr-2 inline animate-spin" />Chargement…</p>
        ) : pieces.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-muted-foreground">Aucune pièce.</p>
        ) : (
          <ul>
            {pieces.map((p) => {
              const ctrl = analyse?.documents.find((d) => d.nom === p.nom);
              return (
                <li key={p.id} className="flex items-start gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                  <FileText size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="truncate font-medium text-foreground">{p.nom}</p>
                    <p className="text-[12px] text-muted-foreground">{taille(p.taille)} · déposée le {formatDateTime(p.deposeLe)}{ctrl ? ` · ${ctrl.typeIdentifie}` : ""}</p>
                    {ctrl && (
                      <p className={cn("text-[12px]", ctrl.complet ? "text-success" : "text-warning")}>
                        {ctrl.complet ? "Complète pour son rôle" : `Incomplète : ${ctrl.elementsManquants.map((m) => m.element).join(" ; ")}`}
                      </p>
                    )}
                  </div>
                  {!lecture && (
                    <button type="button" aria-label={`Retirer ${p.nom}`} onClick={() => retirer(p)} className="rounded p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive"><Trash2 size={14} /></button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          {!lecture && (
            <button type="button" onClick={analyser} disabled={!!enCours || !pieces?.length || !config?.ia}
              title={config && !config.ia ? config.iaManque ?? undefined : undefined}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
              {enCours === "analyse" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {enCours === "analyse" ? "Analyse en cours (quelques minutes)…" : analyse ? "Relancer l'analyse" : "Analyser les pièces"}
            </button>
          )}
          <button type="button" onClick={() => exporter("propositions")} disabled={!!enCours || !analyse}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border px-3 text-xs font-semibold disabled:opacity-50">
            <Download size={13} /> Propositions pour l&apos;outil Excel
          </button>
          <button type="button" onClick={() => exporter("saisie")} disabled={!!enCours}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border px-3 text-xs font-semibold disabled:opacity-50">
            <Download size={13} /> Saisie web pour l&apos;outil Excel
          </button>
          {config && !config.ia && <span className="text-[12px] text-muted-foreground">{config.iaManque}</span>}
        </div>
      </SectionCard>

      {analyse && (
        <>
          <SectionCard titre="Contrôle des pièces" description={`Analyse du ${formatDateTime(analyse.date)} · ${analyse.pieces.length} pièce(s)`}>
            <p className="whitespace-pre-line text-[13px] text-foreground">{analyse.synthese}</p>
            {analyse.avertissements.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12px] text-warning">{analyse.avertissements.map((a, i) => <li key={i}>{a}</li>)}</ul>
            )}
            {analyse.questions.length > 0 && (
              <div className="mt-3">
                <h3 className="mb-1 text-[13px] font-semibold text-foreground">À demander</h3>
                <ul className="space-y-1 text-[12.5px]">
                  {analyse.questions.map((q, i) => (
                    <li key={i}>
                      <span className="mr-1.5 rounded bg-surface px-1 text-[11px] text-muted-foreground">{q.destinataire === "client" ? "Client" : "Chargé d'études"}</span>
                      {q.question}{q.documentAttendu ? <span className="text-muted-foreground"> — {q.documentAttendu}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          <SectionCard
            titre={`Propositions de saisie (${enAttente.length} en attente)`}
            description="Chaque proposition cite sa source. Acceptée, elle est écrite dans la saisie et tracée au journal d'audit."
            actions={
              <select aria-label="Propositions affichées" value={filtre} onChange={(e) => setFiltre(e.target.value as typeof filtre)} className="h-8 rounded border border-border bg-card px-2 text-[12.5px]">
                <option value="en_attente">En attente</option>
                <option value="toutes">Toutes</option>
              </select>
            }
            sansPadding
          >
            {!lecture && enAttente.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-[12.5px]">
                <span className="text-muted-foreground">{choisies.size} sélectionnée(s)</span>
                <button type="button" onClick={() => setChoisies(new Set(enAttente.map((p) => p.cle)))} className="font-semibold text-primary hover:underline">Tout sélectionner</button>
                <button type="button" onClick={() => setChoisies(new Set())} className="font-semibold text-primary hover:underline">Aucune</button>
                <span className="flex-1" />
                <button type="button" disabled={!choisies.size || !!enCours} onClick={() => decider([...choisies], "acceptee")}
                  className="inline-flex h-8 items-center gap-1 rounded bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {enCours === "decision" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accepter la sélection
                </button>
                <button type="button" disabled={!choisies.size || !!enCours} onClick={() => decider([...choisies], "rejetee")}
                  className="inline-flex h-8 items-center gap-1 rounded border border-border px-3 text-xs font-semibold disabled:opacity-50">
                  <X size={13} /> Rejeter la sélection
                </button>
              </div>
            )}
            {parBloc.length === 0 ? (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">Aucune proposition {filtre === "en_attente" ? "en attente" : ""}.</p>
            ) : (
              parBloc.map(([bloc, props]) => (
                <div key={bloc}>
                  <h3 className="border-b border-border bg-surface/60 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Bloc {bloc} · {BLOCS[bloc] ?? ""}</h3>
                  <table className="w-full min-w-[720px] text-[12.5px]">
                    <tbody>
                      {props.map((p) => (
                        <tr key={p.cle} className="border-b border-border align-top">
                          <td className="w-8 px-3 py-2">
                            {p.decision === "en_attente" && !lecture ? (
                              <input type="checkbox" aria-label={`Sélectionner ${p.libelle}`} checked={choisies.has(p.cle)} onChange={() => basculer(p.cle)} />
                            ) : p.decision === "acceptee" ? <Check size={14} className="text-success" /> : p.decision === "rejetee" ? <X size={14} className="text-muted-foreground" /> : null}
                          </td>
                          <td className="w-[30%] px-2 py-2">
                            <p className="font-medium text-foreground">{p.libelle}</p>
                            <p className="font-mono text-[11px] text-muted-foreground">{p.cle}</p>
                          </td>
                          <td className="px-2 py-2">
                            <p className="whitespace-pre-line text-foreground">{p.affichage.length > 400 ? `${p.affichage.slice(0, 400)}…` : p.affichage}</p>
                            {p.actuelle !== null && <p className="text-[11.5px] text-muted-foreground">Actuellement : {p.actuelle.length > 120 ? `${p.actuelle.slice(0, 120)}…` : p.actuelle}</p>}
                            {p.justification && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{p.justification.length > 300 ? `${p.justification.slice(0, 300)}…` : p.justification}</p>}
                          </td>
                          <td className="w-[22%] px-2 py-2 text-[11.5px] text-muted-foreground">{p.source || "Source non précisée"}</td>
                          <td className={cn("w-20 px-2 py-2 text-[11.5px] font-semibold", CONFIANCE[p.confiance]?.cls)}>
                            {CONFIANCE[p.confiance]?.libelle}{p.statut === "partiel" ? <span className="block font-normal text-muted-foreground">partiel</span> : null}
                          </td>
                          <td className="w-20 px-2 py-2 text-right">
                            {p.decision === "en_attente" && !lecture && (
                              <span className="inline-flex gap-1">
                                <button type="button" aria-label="Accepter" disabled={!!enCours} onClick={() => decider([p.cle], "acceptee")} className="rounded p-1 text-success hover:bg-surface"><Check size={14} /></button>
                                <button type="button" aria-label="Rejeter" disabled={!!enCours} onClick={() => decider([p.cle], "rejetee")} className="rounded p-1 text-muted-foreground hover:bg-surface"><X size={14} /></button>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </SectionCard>

          {analyse.manquants.length > 0 && (
            <SectionCard titre={`Informations non trouvées (${analyse.manquants.length})`} description="À compléter par l'analyste ou à demander au client." sansPadding>
              <ul className="max-h-96 overflow-y-auto text-[12.5px]">
                {analyse.manquants.map((m) => (
                  <li key={m.cle} className="border-b border-border px-4 py-2 last:border-b-0">
                    <span className="mr-1.5 rounded bg-surface px-1 font-mono text-[11px] text-muted-foreground">Bloc {m.bloc}</span>
                    <span className="font-medium text-foreground">{m.libelle}</span>
                    {m.documentAttendu && <span className="text-muted-foreground"> — pièce attendue : {m.documentAttendu}</span>}
                    <p className="text-[11.5px] text-muted-foreground">{m.motif}</p>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
