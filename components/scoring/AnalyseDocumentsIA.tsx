"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  FileSearch,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { apiGet, apiPost, apiDelete, messageErreurApi } from "@/lib/api-client";
import type { AnswerValue } from "./LiveScorePanel";
import type { Manquant, Proposition, ResultatAnalyse } from "@/lib/services/ia-documents/resultat";

interface Piece {
  id: string;
  fileName: string;
  fileSize: number;
  documentType: string;
  description: string | null;
  notes: string | null;
  uploadedAt: string;
}

interface Analyse {
  date: string;
  modele: string;
  pieces: Array<{ id: string; nom: string }>;
  avertissements: string[];
  resultat: ResultatAnalyse;
  propositions: Proposition[];
  manquants: Manquant[];
}

interface Configuration {
  stockage: boolean;
  ia: boolean;
  extensions: string[];
  tailleMax: number;
}

type Onglet = "propositions" | "manquants" | "demandes" | "controle";

const confianceClasse = {
  elevee: "bg-success/10 text-success",
  moyenne: "bg-warning/10 text-warning",
  faible: "bg-destructive/10 text-destructive",
} as const;

const confianceLibelle = { elevee: "élevée", moyenne: "moyenne", faible: "faible" } as const;

function valeurActuelle(a: AnswerValue | undefined): string | null {
  if (!a) return null;
  if (a.valueString) return a.valueString;
  if (a.valueNumber !== undefined && a.valueNumber !== null) return String(a.valueNumber);
  if (a.valueBoolean !== undefined && a.valueBoolean !== null) return a.valueBoolean ? "Oui" : "Non";
  return null;
}

/**
 * Pièces du dossier et analyse par IA.
 *
 * Le chargé d'études dépose les pièces (PDF, Word, Excel, images) ; l'IA les contrôle
 * (complétude, incohérences, éléments à demander au client) et propose les réponses
 * de la grille, chacune avec sa source. Rien n'est enregistré sans validation : les
 * propositions cochées passent par la saisie normale (mêmes contrôles qu'une saisie
 * manuelle) avec un commentaire qui en garde la source.
 */
export function AnalyseDocumentsIA({
  evaluationId,
  answers,
  onFermer,
  onAppliquer,
}: {
  evaluationId: string;
  answers: Record<string, AnswerValue>;
  onFermer: () => void;
  onAppliquer: (propositions: Proposition[]) => Promise<void>;
}) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [chargement, setChargement] = useState(true);
  const [depot, setDepot] = useState<string | null>(null);
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [application, setApplication] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("propositions");
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const champFichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    try {
      const res = await apiGet(`/api/scoring/evaluations/${evaluationId}/pieces`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Lecture des pièces impossible."));
      const { data } = await res.json();
      setPieces(data.pieces ?? []);
      setConfig(data.configuration ?? null);
      setAnalyse(data.analyse ?? null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Lecture impossible.");
    } finally {
      setChargement(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Présélection : propositions sur des critères encore vides, confiance non faible.
  useEffect(() => {
    if (!analyse) return;
    setChoisies(
      new Set(
        analyse.propositions
          .filter((p) => p.confiance !== "faible" && valeurActuelle(answers[p.nodeId]) === null)
          .map((p) => p.nodeId)
      )
    );
    // answers volontairement exclu : la présélection se fait à l'arrivée d'une analyse
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyse]);

  const deposer = async (fichiers: FileList | null) => {
    if (!fichiers || fichiers.length === 0) return;
    setErreur(null);
    for (const f of Array.from(fichiers)) {
      setDepot(`Envoi de « ${f.name} »…`);
      try {
        const res = await apiPost(`/api/scoring/evaluations/${evaluationId}/pieces`, {
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
        });
        if (!res.ok) throw new Error(await messageErreurApi(res, "Dépôt refusé."));
        const { data } = await res.json();
        // Dépôt direct dans le stockage (Supabase ou S3) par le lien signé du serveur.
        const envoi = await fetch(data.url, { method: data.methode, headers: data.entetes, body: f }).catch(() => null);
        if (!envoi || !envoi.ok) {
          await apiDelete(`/api/scoring/evaluations/${evaluationId}/pieces/${data.pieceId}`);
          throw new Error(`Envoi de « ${f.name} » impossible${envoi ? ` (${envoi.status})` : ""}.`);
        }
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Dépôt impossible.");
      }
    }
    setDepot(null);
    if (champFichier.current) champFichier.current.value = "";
    await charger();
  };

  const retirer = async (p: Piece) => {
    if (!confirm(`Retirer la pièce « ${p.fileName} » ?`)) return;
    const res = await apiDelete(`/api/scoring/evaluations/${evaluationId}/pieces/${p.id}`);
    if (!res.ok) setErreur(await messageErreurApi(res, "Retrait impossible."));
    await charger();
  };

  const analyser = async () => {
    setErreur(null);
    setMessage(null);
    setAnalyseEnCours(true);
    try {
      const res = await apiPost(`/api/scoring/evaluations/${evaluationId}/pieces/analyse`, {});
      if (!res.ok) throw new Error(await messageErreurApi(res, "Analyse impossible."));
      const { data } = await res.json();
      setAnalyse(data);
      setOnglet("propositions");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Analyse impossible.");
    } finally {
      setAnalyseEnCours(false);
    }
  };

  const appliquer = async () => {
    if (!analyse) return;
    const retenues = analyse.propositions.filter((p) => choisies.has(p.nodeId));
    if (retenues.length === 0) return;
    const remplacements = retenues.filter((p) => valeurActuelle(answers[p.nodeId]) !== null).length;
    if (
      remplacements > 0 &&
      !confirm(`${remplacements} réponse(s) déjà saisie(s) seront remplacées par la proposition de l'IA. Continuer ?`)
    ) {
      return;
    }
    setApplication(true);
    setErreur(null);
    try {
      await onAppliquer(retenues);
      setMessage(`${retenues.length} réponse(s) reprise(s) et enregistrée(s). Relancez le calcul pour mettre la note à jour.`);
      setChoisies(new Set());
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setApplication(false);
    }
  };

  const demandesClient = useMemo(() => {
    if (!analyse) return [] as string[];
    const lignes = new Set<string>();
    for (const d of analyse.resultat.documents) {
      for (const m of d.elementsManquants) lignes.add(`[${m.importance}] ${m.demandeClient} (${d.nom})`);
    }
    for (const q of analyse.resultat.questions.filter((q) => q.destinataire === "client")) {
      lignes.add(`${q.question}${q.documentAttendu ? ` — pièce attendue : ${q.documentAttendu}` : ""}`);
    }
    return Array.from(lignes);
  }, [analyse]);

  const copierDemandes = async () => {
    const texte = `Informations et pièces complémentaires demandées :\n\n${demandesClient.map((l, i) => `${i + 1}. ${l}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(texte);
      setMessage("Liste des demandes copiée : vous pouvez la coller dans votre courrier au client.");
    } catch {
      setErreur("Copie impossible : sélectionnez le texte à la main.");
    }
  };

  const controle = (p: Piece) => {
    try {
      return p.notes ? (JSON.parse(p.notes) as { complet: boolean | null; elementsManquants: unknown[] }) : null;
    } catch {
      return null;
    }
  };

  const onglets: Array<[Onglet, string, number]> = analyse
    ? [
        ["propositions", "Propositions", analyse.propositions.length],
        ["manquants", "Informations manquantes", analyse.manquants.length],
        ["demandes", "À demander", demandesClient.length + analyse.resultat.questions.filter((q) => q.destinataire === "charge_etudes").length],
        ["controle", "Contrôle des pièces", analyse.resultat.documents.length],
      ]
    : [];

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[720px] flex-col border-l border-border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <FileSearch size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Pièces du dossier et analyse par IA</h2>
        </div>
        <button onClick={onFermer} aria-label="Fermer" className="rounded p-1 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Déposez les pièces transmises par le client. L&apos;IA contrôle leur complétude, relève les incohérences, liste ce
          qu&apos;il faut demander au client et propose les réponses de la grille avec leur source. Vous validez chaque
          proposition : rien n&apos;est enregistré sans votre accord. Les pièces sont envoyées au service d&apos;IA
          d&apos;Anthropic pour l&apos;analyse.
        </p>

        {config && (!config.stockage || !config.ia) && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-foreground">
            {!config.stockage && <p>Stockage des pièces non configuré (SUPABASE_SERVICE_ROLE_KEY).</p>}
            {!config.ia && <p>Analyse par IA non configurée (ANTHROPIC_API_KEY).</p>}
          </div>
        )}
        {erreur && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{erreur}</div>
        )}
        {message && (
          <div className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-foreground">{message}</div>
        )}

        {/* Pièces */}
        <section className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-semibold text-foreground">Pièces ({pieces.length})</span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent">
              <Upload size={14} />
              Ajouter
              <input
                ref={champFichier}
                type="file"
                multiple
                className="hidden"
                accept={(config?.extensions ?? []).map((e) => "." + e).join(",")}
                onChange={(e) => void deposer(e.target.files)}
                disabled={Boolean(depot)}
              />
            </label>
          </div>
          {depot && (
            <p className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-primary">
              <Loader2 size={13} className="animate-spin" /> {depot}
            </p>
          )}
          {chargement ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Chargement…</p>
          ) : pieces.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] text-muted-foreground">
              Aucune pièce. Formats acceptés : {(config?.extensions ?? []).join(", ")} — 50 Mo par fichier.
            </p>
          ) : (
            <ul>
              {pieces.map((p) => {
                const c = controle(p);
                return (
                  <li key={p.id} className="flex items-start gap-2 border-b border-border px-3 py-2 last:border-b-0">
                    <FileText size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{p.fileName}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {(p.fileSize / 1024 / 1024).toFixed(1)} Mo
                        {p.documentType !== "A_ANALYSER" && ` · ${p.documentType}`}
                        {c?.complet === true && <span className="ml-1 text-success">· complète</span>}
                        {c?.complet === false && (
                          <span className="ml-1 text-warning">· incomplète ({c.elementsManquants.length} élément(s))</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => void retirer(p)}
                      aria-label={`Retirer ${p.fileName}`}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <button
          onClick={() => void analyser()}
          disabled={analyseEnCours || pieces.length === 0 || !config?.ia}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {analyseEnCours ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {analyseEnCours ? "Analyse en cours — jusqu'à quelques minutes…" : analyse ? "Relancer l'analyse" : "Analyser les pièces"}
        </button>

        {analyse && (
          <section className="space-y-3">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="text-[12px] text-muted-foreground">
                Analyse du {new Date(analyse.date).toLocaleString("fr-FR")} · {analyse.pieces.length} pièce(s)
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{analyse.resultat.synthese}</p>
              {analyse.avertissements.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[12px] text-warning">
                  {analyse.avertissements.map((a) => (
                    <li key={a} className="flex gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-1 border-b border-border">
              {onglets.map(([cle, lib, n]) => (
                <button
                  key={cle}
                  onClick={() => setOnglet(cle)}
                  className={`-mb-px border-b-2 px-3 py-1.5 text-[13px] ${
                    onglet === cle ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground"
                  }`}
                >
                  {lib} ({n})
                </button>
              ))}
            </div>

            {onglet === "propositions" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-3 text-[12.5px]">
                    <button
                      className="text-primary hover:underline"
                      onClick={() => setChoisies(new Set(analyse.propositions.map((p) => p.nodeId)))}
                    >
                      Tout cocher
                    </button>
                    <button className="text-muted-foreground hover:underline" onClick={() => setChoisies(new Set())}>
                      Tout décocher
                    </button>
                  </div>
                  <button
                    onClick={() => void appliquer()}
                    disabled={application || choisies.size === 0}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {application ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Reprendre {choisies.size} réponse(s)
                  </button>
                </div>
                {analyse.propositions.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune réponse n&apos;a pu être établie à partir des pièces.</p>
                )}
                {analyse.propositions.map((p) => {
                  const actuelle = valeurActuelle(answers[p.nodeId]);
                  return (
                    <label
                      key={p.nodeId}
                      className="flex cursor-pointer gap-2.5 rounded-lg border border-border p-2.5 hover:bg-surface"
                    >
                      <input
                        type="checkbox"
                        checked={choisies.has(p.nodeId)}
                        onChange={(e) =>
                          setChoisies((s) => {
                            const n = new Set(s);
                            if (e.target.checked) n.add(p.nodeId);
                            else n.delete(p.nodeId);
                            return n;
                          })
                        }
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1 text-[12.5px]">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            <span className="font-mono text-primary">{p.code}</span> {p.label}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] ${confianceClasse[p.confiance]}`}>
                            confiance {confianceLibelle[p.confiance]}
                            {p.statut === "partiel" ? " · partiel" : ""}
                          </span>
                        </span>
                        <span className="mt-1 block text-foreground">
                          Proposé : <strong>{p.affichage}</strong>
                          {actuelle !== null && <span className="text-muted-foreground"> · saisi : {actuelle}</span>}
                        </span>
                        <span className="mt-0.5 block text-muted-foreground">{p.justification}</span>
                        {p.sources.slice(0, 2).map((s, i) => (
                          <span key={i} className="mt-0.5 block text-[11.5px] text-muted-foreground">
                            Source : {s.document}
                            {s.localisation ? ` — ${s.localisation}` : ""}
                            {s.extrait ? ` — « ${s.extrait.slice(0, 160)} »` : ""}
                          </span>
                        ))}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {onglet === "manquants" && (
              <ul className="space-y-1.5">
                {analyse.manquants.map((m) => (
                  <li key={m.nodeId} className="rounded-lg border border-border p-2.5 text-[12.5px]">
                    <p className="font-semibold text-foreground">
                      <span className="font-mono text-primary">{m.code}</span> {m.label}
                      {m.obligatoire && <span className="ml-1.5 text-destructive">· obligatoire</span>}
                    </p>
                    <p className="text-muted-foreground">{m.motif}</p>
                    {m.documentAttendu && <p className="text-muted-foreground">Pièce attendue : {m.documentAttendu}</p>}
                  </li>
                ))}
              </ul>
            )}

            {onglet === "demandes" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">À demander au client ({demandesClient.length})</h3>
                  <button
                    onClick={() => void copierDemandes()}
                    disabled={demandesClient.length === 0}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                  >
                    <ClipboardCopy size={14} /> Copier la liste
                  </button>
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-[12.5px] text-foreground">
                  {demandesClient.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ol>
                <h3 className="pt-2 text-sm font-semibold text-foreground">Pour le chargé d&apos;études</h3>
                <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-foreground">
                  {analyse.resultat.questions
                    .filter((q) => q.destinataire === "charge_etudes")
                    .map((q) => (
                      <li key={q.question}>
                        {q.question}
                        {q.criteres.length > 0 && <span className="text-muted-foreground"> ({q.criteres.join(", ")})</span>}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {onglet === "controle" && (
              <div className="space-y-2">
                {analyse.resultat.documents.map((d) => (
                  <div key={d.nom} className="rounded-lg border border-border p-2.5 text-[12.5px]">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-foreground">{d.nom}</span>
                      <span className={d.complet ? "text-success" : "text-warning"}>
                        {d.complet ? "complète" : "incomplète"}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {d.typeIdentifie} — {d.role}
                    </p>
                    {d.elementsManquants.length > 0 && (
                      <ul className="mt-1 list-disc pl-5">
                        {d.elementsManquants.map((m) => (
                          <li key={m.element}>
                            <span className={m.importance === "bloquant" ? "font-semibold text-destructive" : ""}>
                              [{m.importance}]
                            </span>{" "}
                            {m.element}
                          </li>
                        ))}
                      </ul>
                    )}
                    {d.incoherences.length > 0 && (
                      <ul className="mt-1 list-disc pl-5 text-warning">
                        {d.incoherences.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
