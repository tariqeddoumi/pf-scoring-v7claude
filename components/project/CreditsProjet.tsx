"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { apiCall, apiGet, apiPost, messageErreurApi } from "@/lib/api-client";
import { SectionCard } from "@/components/ui/section-card";
import { NATURES_CREDIT, DEVISES_CREDIT } from "@/lib/modele-pf/codes";

interface Credit {
  id: string;
  numero: string;
  nature: string;
  montant: number | null;
  devise: string;
  dureeAns: number | null;
  role: string | null;
  commentaire: string | null;
  source: string;
}

type Brouillon = { numero: string; nature: string; montant: string; devise: string; dureeAns: string; role: string };
const VIDE: Brouillon = { numero: "", nature: NATURES_CREDIT[0], montant: "", devise: "MAD", dureeAns: "", role: "" };

/** « 1 500,5 » ou « 1500.5 » → 1500.5 ; NaN si illisible (refusé avant l'envoi, sinon il partait en null). */
const nombre = (v: string) => (v.trim() === "" ? null : Number(v.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".")));
const fmt = (v: number | null) => (v === null ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }));

/**
 * Dossiers de crédit de la banque rattachés au projet : saisie manuelle en attendant le
 * rapatriement depuis Evolan. Un numéro de dossier ne se rattache qu'à un seul projet.
 */
export function CreditsProjet({ projetId, modifiable }: { projetId: string; modifiable: boolean }) {
  const [credits, setCredits] = useState<Credit[] | null>(null);
  const [total, setTotal] = useState(0);
  const [ajout, setAjout] = useState<Brouillon | null>(null);
  const [edition, setEdition] = useState<{ id: string; b: Brouillon } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    const r = await apiGet(`/api/projects/${projetId}/credits`);
    if (r.ok) {
      const d = await r.json();
      setCredits(d.credits);
      setTotal(d.total);
    } else setCredits([]);
  }, [projetId]);
  useEffect(() => { charger(); }, [charger]);

  const corps = (b: Brouillon) => ({
    numero: b.numero.trim(), nature: b.nature, montant: nombre(b.montant), devise: b.devise,
    dureeAns: nombre(b.dureeAns), role: b.role.trim() || null,
  });

  async function enregistrer(b: Brouillon, id?: string) {
    const c = corps(b);
    if ((c.montant !== null && !Number.isFinite(c.montant)) || (c.dureeAns !== null && !Number.isFinite(c.dureeAns))) {
      setErreur("Montant ou durée illisible : saisissez un nombre (ex. 1 500,5).");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    const r = id
      ? await apiCall(`/api/projects/${projetId}/credits/${id}`, { method: "PUT", body: JSON.stringify(corps(b)) })
      : await apiPost(`/api/projects/${projetId}/credits`, corps(b));
    setEnvoi(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErreur(d.error ?? "Enregistrement impossible");
      return;
    }
    setAjout(null);
    setEdition(null);
    charger();
  }

  async function retirer(c: Credit) {
    if (!window.confirm(`Détacher le crédit ${c.numero} de ce projet ? (Rien n'est supprimé dans les systèmes de la banque.)`)) return;
    const r = await apiCall(`/api/projects/${projetId}/credits/${c.id}`, { method: "DELETE" });
    if (r.ok) charger();
    else setErreur(await messageErreurApi(r, "Retrait impossible"));
  }

  const ligneSaisie = (b: Brouillon, setB: (b: Brouillon) => void, valider: () => void, annuler: () => void) => (
    <tr className="border-b border-border bg-surface">
      <td className="px-3 py-2"><input aria-label="Numéro du dossier" value={b.numero} onChange={(e) => setB({ ...b, numero: e.target.value })} placeholder="CR-26-0101" className="h-8 w-full rounded border border-border bg-card px-2 text-sm" /></td>
      <td className="px-3 py-2">
        <select aria-label="Nature" value={b.nature} onChange={(e) => setB({ ...b, nature: e.target.value })} className="h-8 w-full rounded border border-border bg-card px-1 text-sm">
          {NATURES_CREDIT.map((n) => <option key={n}>{n}</option>)}
        </select>
      </td>
      <td className="px-3 py-2"><input aria-label="Montant (MMAD)" inputMode="decimal" value={b.montant} onChange={(e) => setB({ ...b, montant: e.target.value })} className="h-8 w-24 rounded border border-border bg-card px-2 text-right text-sm" /></td>
      <td className="px-3 py-2">
        <select aria-label="Devise" value={b.devise} onChange={(e) => setB({ ...b, devise: e.target.value })} className="h-8 rounded border border-border bg-card px-1 text-sm">
          {DEVISES_CREDIT.map((d) => <option key={d}>{d}</option>)}
        </select>
      </td>
      <td className="px-3 py-2"><input aria-label="Durée (ans)" inputMode="decimal" value={b.dureeAns} onChange={(e) => setB({ ...b, dureeAns: e.target.value })} className="h-8 w-16 rounded border border-border bg-card px-2 text-right text-sm" /></td>
      <td className="px-3 py-2"><input aria-label="Rôle dans le montage" value={b.role} onChange={(e) => setB({ ...b, role: e.target.value })} placeholder="Senior, relais TVA…" className="h-8 w-full rounded border border-border bg-card px-2 text-sm" /></td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <button type="button" onClick={valider} disabled={envoi || !b.numero.trim()} className="mr-1 inline-flex h-8 items-center gap-1 rounded bg-primary px-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {envoi ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer
        </button>
        <button type="button" onClick={annuler} aria-label="Annuler" className="inline-flex h-8 items-center rounded border border-border px-2 text-xs"><X size={13} /></button>
      </td>
    </tr>
  );

  return (
    <SectionCard
      titre="Crédits du projet"
      description="Dossiers de crédit de la banque qui financent le projet (saisie manuelle ; rapatriement Evolan à venir)."
      actions={modifiable && !ajout ? (
        <button type="button" onClick={() => { setAjout({ ...VIDE }); setEdition(null); }} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
          <Plus size={14} /> Ajouter
        </button>
      ) : undefined}
      sansPadding
    >
      {erreur && <p role="alert" className="border-b border-border bg-destructive-subtle px-4 py-2 text-[12.5px] text-destructive">{erreur}</p>}
      {credits === null ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground"><Loader2 size={15} className="mr-2 inline animate-spin" />Chargement…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-[12px] text-muted-foreground">
                <th className="px-3 py-2 font-medium">Numéro</th>
                <th className="px-3 py-2 font-medium">Nature</th>
                <th className="px-3 py-2 text-right font-medium">Montant (MMAD)</th>
                <th className="px-3 py-2 font-medium">Devise</th>
                <th className="px-3 py-2 text-right font-medium">Durée (ans)</th>
                <th className="px-3 py-2 font-medium">Rôle</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {credits.map((c) =>
                edition?.id === c.id ? (
                  <Fragment key={c.id}>{ligneSaisie(edition.b, (b) => setEdition({ id: c.id, b }), () => enregistrer(edition.b, c.id), () => setEdition(null))}</Fragment>
                ) : (
                  <tr key={c.id} className="border-b border-border last:border-b-0">
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground">{c.numero}</td>
                    <td className="px-3 py-2">{c.nature}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(c.montant)}</td>
                    <td className="px-3 py-2">{c.devise}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(c.dureeAns)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.role ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {modifiable && (
                        <>
                          <button type="button" onClick={() => { setEdition({ id: c.id, b: { numero: c.numero, nature: c.nature, montant: c.montant === null ? "" : String(c.montant), devise: c.devise, dureeAns: c.dureeAns === null ? "" : String(c.dureeAns), role: c.role ?? "" } }); setAjout(null); }} className="mr-2 text-[12px] font-semibold text-primary hover:underline">Modifier</button>
                          <button type="button" onClick={() => retirer(c)} aria-label={`Détacher le crédit ${c.numero}`} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              )}
              {ajout && ligneSaisie(ajout, setAjout, () => enregistrer(ajout), () => setAjout(null))}
              {credits.length === 0 && !ajout && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun crédit rattaché à ce projet.</td></tr>
              )}
            </tbody>
            {credits.length > 0 && (
              <tfoot>
                <tr className="border-t border-border font-semibold">
                  <td className="px-3 py-2" colSpan={2}>Total (MMAD, contre-valeur)</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(total)}</td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </SectionCard>
  );
}
