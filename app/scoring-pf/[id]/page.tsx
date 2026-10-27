"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Check, CheckCircle2, CloudOff, Loader2, RotateCcw, Send, Trash2, XCircle } from "lucide-react";
import { apiCall, apiGet, apiPost } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { calculer, type Controle, type SaisiePF } from "@/lib/modele-pf/saisie";
import { gradeDeLaNote, type ParametresModele } from "@/lib/modele-pf/parametres";
import type { ResultatPF } from "@/lib/modele-pf/moteur";
import type { AnalysePF } from "@/lib/modele-pf/ia";
import { fmtPct } from "@/components/scoring-pf/champs";
import { BlocIdentification, type ProjetPF } from "@/components/scoring-pf/BlocIdentification";
import { BlocFinancement, type CreditPF } from "@/components/scoring-pf/BlocFinancement";
import { BlocSecteur } from "@/components/scoring-pf/BlocSecteur";
import { BlocEcheancier } from "@/components/scoring-pf/BlocEcheancier";
import { BlocNoyau } from "@/components/scoring-pf/BlocNoyau";
import { BlocClimat } from "@/components/scoring-pf/BlocClimat";
import { SaisieContexte } from "@/components/scoring-pf/origine";
import { BlocGrille } from "@/components/scoring-pf/BlocGrille";
import { BlocResultat } from "@/components/scoring-pf/BlocResultat";
import { PiecesIA } from "@/components/scoring-pf/PiecesIA";

interface Donnees {
  id: string; titre: string | null; statut: "brouillon" | "soumis" | "valide" | "rejete";
  updatedAt: string; soumisLe: string | null; valideLe: string | null;
  projet: ProjetPF; credits: CreditPF[];
  saisie: SaisiePF; resultat: Partial<ResultatPF> | null; controles: Controle[];
  voirScores: boolean; parametres: ParametresModele;
  droits: { saisir: boolean; decider: boolean; rouvrir: boolean };
  analyseIa: AnalysePF | null; pieces: unknown[];
  dernierRejet: { motif: string | null; le: string } | null;
}

const ONGLETS = [
  { id: "identification", libelle: "Identification", blocs: [1, 2] },
  { id: "financement", libelle: "Financement", blocs: [3] },
  { id: "secteur", libelle: "Secteur et hypothèses", blocs: [4, 5] },
  { id: "echeancier", libelle: "Échéancier", blocs: [6] },
  { id: "noyau", libelle: "Noyau financier", blocs: [7] },
  { id: "grille", libelle: "Grille", blocs: [8] },
  { id: "climat", libelle: "Climat", blocs: [14] },
  { id: "resultat", libelle: "Résultat et décision", blocs: [9, 10, 11, 12, 13] },
  { id: "ia", libelle: "Pièces et IA", blocs: [] },
] as const;
type Onglet = (typeof ONGLETS)[number]["id"];

const STATUTS: Record<string, { libelle: string; cls: string }> = {
  brouillon: { libelle: "Brouillon", cls: "bg-surface text-foreground" },
  soumis: { libelle: "Soumis au comité", cls: "bg-warning/15 text-warning" },
  valide: { libelle: "Validé", cls: "bg-success/15 text-success" },
  rejete: { libelle: "Rejeté", cls: "bg-destructive/15 text-destructive" },
};

type Enregistrement = "a-jour" | "modifie" | "en-cours" | "erreur";

/**
 * Scoring Project Finance : les treize blocs de l'outil Excel, regroupés en onglets.
 * La saisie s'enregistre d'elle-même ; le calcul se refait en direct dans le navigateur
 * et le serveur le refait à chaque enregistrement (c'est son résultat qui fait foi).
 */
export default function ScoringPFPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [d, setD] = useState<Donnees | null>(null);
  const [saisie, setSaisie] = useState<SaisiePF | null>(null);
  const [titre, setTitre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("identification");
  const [etat, setEtat] = useState<Enregistrement>("a-jour");
  const [message, setMessage] = useState<{ ton: "ok" | "erreur"; texte: string } | null>(null);
  const [cible, setCible] = useState<string | null>(null);
  const [voirControles, setVoirControles] = useState(false);
  const [rejet, setRejet] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const version = useRef(0);
  const enregistree = useRef(0);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const charger = useCallback(async () => {
    const r = await apiGet(`/api/evaluations-pf/${id}`);
    const corps = await r.json().catch(() => ({}));
    if (!r.ok) { setErreur(corps.error ?? "Scoring introuvable"); return; }
    setD(corps);
    setSaisie(corps.saisie);
    setTitre(corps.titre ?? "");
    version.current = 0;
    enregistree.current = 0;
    setEtat("a-jour");
  }, [id]);
  useEffect(() => { if (id) charger(); }, [id, charger]);

  const lecture = !d?.droits.saisir;

  const enregistrer = useCallback(async (): Promise<boolean> => {
    if (!saisie || lecture) return true;
    if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null; }
    const v = version.current;
    if (v === enregistree.current) return true;
    setEtat("en-cours");
    const r = await apiCall(`/api/evaluations-pf/${id}`, { method: "PUT", body: JSON.stringify({ saisie, titre }) });
    const corps = await r.json().catch(() => ({}));
    if (!r.ok) {
      setEtat("erreur");
      setMessage({ ton: "erreur", texte: corps.erreurs?.[0] ? `${corps.error} : ${corps.erreurs[0].chemin} — ${corps.erreurs[0].message}` : corps.error ?? "Enregistrement impossible" });
      return false;
    }
    enregistree.current = v;
    // La saisie n'est pas remplacée : l'analyste a pu continuer à taper pendant l'envoi.
    setD((prec) => (prec ? { ...prec, ...corps, saisie: prec.saisie } : corps));
    setEtat(version.current === v ? "a-jour" : "modifie");
    return true;
  }, [id, saisie, titre, lecture]);

  // Enregistrement automatique, une seconde et demie après la dernière frappe.
  useEffect(() => {
    if (etat !== "modifie") return;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => { enregistrer(); }, 1500);
    return () => { if (minuteur.current) clearTimeout(minuteur.current); };
  }, [etat, saisie, titre, enregistrer]);

  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => { if (version.current !== enregistree.current) e.preventDefault(); };
    window.addEventListener("beforeunload", avant);
    return () => window.removeEventListener("beforeunload", avant);
  }, []);

  const modifier = useCallback((f: (s: SaisiePF) => void) => {
    setSaisie((prec) => {
      if (!prec) return prec;
      const copie = structuredClone(prec);
      f(copie);
      return copie;
    });
    version.current += 1;
    setEtat("modifie");
  }, []);

  const codes = useMemo(() => d ? { codeClientT24: d.projet.client?.codeClientT24, radical: d.projet.client?.radical, codeProjet: d.projet.codeProjet } : undefined, [d]);
  // Calcul en direct pour les rôles qui voient les notes ; pour les autres, le résultat
  // (masqué) du serveur, rafraîchi à chaque enregistrement : la note n'est jamais
  // calculée dans leur navigateur.
  const calcul = useMemo(() => {
    if (!saisie || !d) return null;
    if (d.voirScores) return calculer(saisie, d.parametres, codes);
    return d.resultat ? { resultat: d.resultat as ResultatPF, controles: d.controles } : null;
  }, [saisie, d, codes]);
  const manquants = useMemo(() => new Set((calcul?.controles ?? []).map((c) => c.cible ?? "")), [calcul]);

  function allerA(c: Controle) {
    const o = ONGLETS.find((x) => (x.blocs as readonly number[]).includes(c.bloc));
    if (o) setOnglet(o.id);
    setCible(c.cible ?? null);
    setVoirControles(false);
    setTimeout(() => document.getElementById(`pf-${c.cible}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function changerStatut(act: "soumettre" | "valider" | "rejeter" | "rouvrir", motif?: string) {
    setAction(act);
    setMessage(null);
    if (act === "soumettre" && !(await enregistrer())) { setAction(null); return; }
    const r = await apiPost(`/api/evaluations-pf/${id}/statut`, { action: act, motif });
    const corps = await r.json().catch(() => ({}));
    setAction(null);
    if (!r.ok) {
      setMessage({ ton: "erreur", texte: corps.error ?? "Action impossible" });
      if (corps.controles) setVoirControles(true);
      return;
    }
    setRejet(null);
    const textes = { soumettre: "Scoring soumis au comité.", valider: "Scoring validé : la note est reportée sur le projet.", rejeter: "Scoring rejeté.", rouvrir: "Scoring rouvert en brouillon." };
    setMessage({ ton: "ok", texte: textes[act] });
    await charger();
  }

  async function supprimer() {
    if (!window.confirm("Supprimer définitivement ce brouillon de scoring ?")) return;
    const r = await apiCall(`/api/evaluations-pf/${id}`, { method: "DELETE" });
    if (r.ok) router.push(`/projects/${d?.projet.id}`);
    else setMessage({ ton: "erreur", texte: (await r.json().catch(() => ({}))).error ?? "Suppression impossible" });
  }

  if (erreur) {
    return (
      <div className="mx-auto mt-16 max-w-lg">
        <SectionCard>
          <p className="font-medium text-foreground">Scoring introuvable</p>
          <p className="mt-1 text-sm text-muted-foreground">{erreur}</p>
          <Link href="/projects" className="mt-4 inline-block text-sm text-primary hover:underline">← Retour aux projets</Link>
        </SectionCard>
      </div>
    );
  }
  if (!d || !saisie || !calcul) {
    return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={30} /></div>;
  }

  const r = calcul.resultat;
  const controles = calcul.controles;
  const voir = d.voirScores;
  const statut = STATUTS[d.statut] ?? STATUTS.brouillon;
  const props = { s: saisie, modifier, r, P: d.parametres, lecture, voirScores: voir, manquants };
  const nbParOnglet = (o: (typeof ONGLETS)[number]) => controles.filter((c) => (o.blocs as readonly number[]).includes(c.bloc)).length;

  return (
    <div>
      <PageHeader
        retour={{ href: `/projects/${d.projet.id}`, libelle: d.projet.nom }}
        titre={titre.trim() || "Scoring Project Finance"}
        description={`Modèle Project Finance · ${d.projet.client?.nom ?? "client non rattaché"}`}
        meta={
          <>
            <span className={cn("rounded px-2 py-0.5 text-[12px] font-semibold", statut.cls)}>{statut.libelle}</span>
            <span className="text-[12.5px] text-muted-foreground">Modifié le {formatDateTime(d.updatedAt)}</span>
          </>
        }
        actions={
          <>
            {d.droits.saisir && (
              <>
                <button type="button" onClick={() => changerStatut("soumettre")} disabled={!!action || controles.length > 0}
                  title={controles.length ? "Complétez d'abord les saisies exigées" : undefined}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
                  {action === "soumettre" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Soumettre au comité
                </button>
                <button type="button" onClick={supprimer} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} /> Supprimer
                </button>
              </>
            )}
            {d.droits.decider && (
              <>
                <button type="button" onClick={() => changerStatut("valider")} disabled={!!action || !r.statut.startsWith("Note validable")}
                  title={!r.statut.startsWith("Note validable") ? r.statut : undefined}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-success px-3 text-[13px] font-semibold text-success-foreground disabled:opacity-50">
                  <CheckCircle2 size={14} /> Valider
                </button>
                <button type="button" onClick={() => setRejet(rejet === null ? "" : null)} disabled={!!action}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-destructive/50 px-3 text-[13px] font-semibold text-destructive">
                  <XCircle size={14} /> Rejeter
                </button>
              </>
            )}
            {d.droits.rouvrir && (
              <button type="button" onClick={() => changerStatut("rouvrir")} disabled={!!action}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-[13px] font-semibold">
                <RotateCcw size={14} /> Rouvrir
              </button>
            )}
          </>
        }
      />

      {rejet !== null && (
        <SectionCard className="mb-4" titre="Motif du rejet">
          <textarea aria-label="Motif du rejet" rows={3} value={rejet} onChange={(e) => setRejet(e.target.value)} maxLength={2000}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-[13px]" />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => changerStatut("rejeter", rejet.trim())} disabled={!rejet.trim() || !!action}
              className="h-8 rounded bg-destructive px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-50">Confirmer le rejet</button>
            <button type="button" onClick={() => setRejet(null)} className="h-8 rounded border border-border px-3 text-xs">Annuler</button>
          </div>
        </SectionCard>
      )}

      {/* Le motif du rejet n'était consigné qu'au journal d'audit : l'analyste qui rouvrait le
          dossier ne savait pas ce que le comité demandait de corriger. */}
      {d.dernierRejet && (d.statut === "rejete" || d.statut === "brouillon") && (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
          <strong>Rejeté par le comité le {new Date(d.dernierRejet.le).toLocaleDateString("fr-FR")}</strong>
          {d.dernierRejet.motif ? ` — motif : ${d.dernierRejet.motif}` : ""}
        </p>
      )}

      {message && (
        <p role={message.ton === "erreur" ? "alert" : "status"}
          className={cn("mb-3 rounded-md border px-3 py-2 text-[13px]", message.ton === "erreur" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-success/40 bg-success/10 text-success")}>
          {message.texte}
        </p>
      )}

      {/* Bandeau : ce que l'analyste doit voir en permanence pendant la saisie. */}
      <div className="sticky top-0 z-20 -mx-1 mb-4 rounded-lg border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]">
          <span className="font-mono text-muted-foreground">
            Code T24 {d.projet.client?.codeClientT24 ?? "?"} · Radical {d.projet.client?.radical ?? "?"} · Projet {d.projet.codeProjet ?? "?"}
          </span>
          {voir && (
            <>
              {/* « Approuvée » au sens du modèle (après plafonds) : tant que le comité n'a pas
                  validé, c'est une proposition. */}
              <Indic libelle={d.statut === "valide" ? "Note validée" : "Note proposée"} valeur={r.noteApprouvee === null ? "—" : `${r.noteApprouvee}${typeof r.noteApprouvee === "number" ? ` · ${gradeDeLaNote(r.noteApprouvee, d.parametres) ?? ""}` : ""}`} fort />
              <Indic libelle="Score" valeur={r.score === null ? "—" : r.score.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} />
              <Indic libelle="Note calculée" valeur={r.noteCalculee === null ? "—" : String(r.noteCalculee)} />
              <Indic libelle="Plafond" valeur={r.plafondsActifs.length ? `${r.plafond} (${r.plafondsActifs.join(", ")})` : "—"} />
            </>
          )}
          <Indic libelle="Régime d'analyse" valeur={r.regimeRetenu ? `${r.regimeRetenu} (${{ S: "simplifié", M: "standard", L: "approfondi" }[r.regimeRetenu] ?? ""})` : "—"} />
          <Indic libelle="Complétude" valeur={fmtPct(r.completude, 0)} />
          {r.verrousActifs.length > 0 && <Indic libelle="Verrous" valeur={r.verrousActifs.join(", ")} alerte />}
          <button type="button" onClick={() => setVoirControles(!voirControles)} aria-expanded={voirControles}
            className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold", controles.length ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
            {controles.length ? <><AlertTriangle size={13} /> {controles.length} saisie(s) à compléter</> : <><Check size={13} /> Saisie complète</>}
          </button>
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            {lecture ? "Lecture seule"
              : etat === "en-cours" ? <><Loader2 size={13} className="animate-spin" /> Enregistrement…</>
              : etat === "modifie" ? "Modifications en attente"
              : etat === "erreur" ? <><CloudOff size={13} className="text-destructive" /> <button type="button" className="text-destructive underline" onClick={() => enregistrer()}>Réessayer</button></>
              : <><Check size={13} className="text-success" /> Enregistré</>}
          </span>
        </div>
        <p className="mt-1 truncate text-[12px] text-muted-foreground" title={r.statut}>{r.statut}</p>
        {voirControles && controles.length > 0 && (
          <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto border-t border-border pt-2 text-[12.5px]">
            {controles.map((c, i) => (
              <li key={i}>
                <button type="button" onClick={() => allerA(c)} className="text-left hover:text-primary hover:underline">
                  <span className="mr-1.5 rounded bg-surface px-1 font-mono text-[11px] text-muted-foreground">Bloc {c.bloc}</span>{c.libelle}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!lecture && (
        <div className="mb-4 max-w-md">
          <label htmlFor="pf-titre" className="mb-1 block text-[12px] font-medium text-foreground">Intitulé du scoring</label>
          <input id="pf-titre" value={titre} maxLength={200} placeholder="Ex. Octroi initial, revue annuelle 2027…"
            onChange={(e) => { setTitre(e.target.value); version.current += 1; setEtat("modifie"); }}
            className="h-8 w-full rounded border border-border bg-background px-2 text-[13px]" />
        </div>
      )}

      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {ONGLETS.map((o) => {
          const n = nbParOnglet(o);
          return (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} onClick={() => setOnglet(o.id)}
              className={cn("flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
                onglet === o.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {o.libelle}
              {n > 0 && <span className="rounded-full bg-warning/15 px-1.5 text-[10.5px] font-semibold text-warning">{n}</span>}
            </button>
          );
        })}
      </div>

      <SaisieContexte.Provider value={saisie}>
      <div role="tabpanel">
        {onglet === "identification" && <BlocIdentification {...props} projet={d.projet} />}
        {onglet === "financement" && <BlocFinancement {...props} credits={d.credits} projetId={d.projet.id} />}
        {onglet === "secteur" && <BlocSecteur {...props} />}
        {onglet === "echeancier" && <BlocEcheancier {...props} />}
        {onglet === "noyau" && <BlocNoyau {...props} />}
        {onglet === "grille" && <BlocGrille {...props} cible={cible} />}
        {onglet === "climat" && <BlocClimat {...props} projet={d.projet} />}
        {onglet === "resultat" && <BlocResultat {...props} />}
        {onglet === "ia" && (
          <PiecesIA evaluationId={id} lecture={lecture} analyse={d.analyseIa}
            enregistrer={enregistrer} onRecharger={charger} />
        )}
      </div>
      </SaisieContexte.Provider>
    </div>
  );
}

function Indic({ libelle, valeur, fort, alerte }: { libelle: string; valeur: string; fort?: boolean; alerte?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-muted-foreground">{libelle}</span>
      <span className={cn("tabulaire font-semibold", fort && "text-[15px]", alerte ? "text-destructive" : "text-foreground")}>{valeur}</span>
    </span>
  );
}
