"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost, messageErreurApi } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

interface Entite {
  id: string;
  code: string;
  nom: string;
  type: string;
  parentId: string | null;
  niveau: number;
  pays: string | null;
  isActive: boolean;
  nomOutil: string | null;
  logoUrl: string | null;
  couleurPrimaire: string | null;
  effectifs: { utilisateurs: number; clients: number; projets: number };
}

const TYPES: Record<string, string> = {
  GROUPE: "Groupe",
  BANQUE: "Banque",
  BANQUE_REGIONALE: "Banque régionale",
  FILIALE: "Filiale",
};

type Saisie = {
  code: string;
  nom: string;
  type: string;
  parentId: string | null;
  pays: string;
  isActive: boolean;
  nomOutil: string;
  logoUrl: string;
  couleurPrimaire: string;
};

const VIDE: Saisie = {
  code: "", nom: "", type: "BANQUE", parentId: null, pays: "", isActive: true, nomOutil: "", logoUrl: "", couleurPrimaire: "",
};

const champ =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none";

/** Arbre affiché dans l'ordre : chaque entité suivie de sa descendance. */
function ordonner(entites: Entite[]): Entite[] {
  const enfants = new Map<string | null, Entite[]>();
  for (const e of entites) {
    const cle = entites.some((p) => p.id === e.parentId) ? e.parentId : null;
    enfants.set(cle, [...(enfants.get(cle) ?? []), e]);
  }
  const sortie: Entite[] = [];
  const parcourir = (parent: string | null) => {
    for (const e of (enfants.get(parent) ?? []).sort((a, b) => a.nom.localeCompare(b.nom))) {
      sortie.push(e);
      parcourir(e.id);
    }
  };
  parcourir(null);
  return sortie;
}

export default function EntitesPage() {
  const [entites, setEntites] = useState<Entite[]>([]);
  const [tout, setTout] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [edition, setEdition] = useState<{ id: string | null; saisie: Saisie } | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await apiGet("/api/admin/entites");
      if (!res.ok) throw new Error(await messageErreurApi(res, "Chargement impossible."));
      const corps = await res.json();
      setEntites(corps.data ?? []);
      setTout(Boolean(corps.perimetre?.tout));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const ordre = useMemo(() => ordonner(entites), [entites]);
  const minNiveau = Math.min(...entites.map((e) => e.niveau), 0);

  const ouvrir = (e?: Entite, parentId?: string) =>
    setEdition(
      e
        ? {
            id: e.id,
            saisie: {
              code: e.code, nom: e.nom, type: e.type, parentId: e.parentId, pays: e.pays ?? "", isActive: e.isActive,
              nomOutil: e.nomOutil ?? "", logoUrl: e.logoUrl ?? "", couleurPrimaire: e.couleurPrimaire ?? "",
            },
          }
        : { id: null, saisie: { ...VIDE, parentId: parentId ?? null, type: parentId ? "FILIALE" : "GROUPE" } }
    );

  const enregistrer = async () => {
    if (!edition) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const corps = { ...edition.saisie };
      const res = edition.id
        ? await apiPatch(`/api/admin/entites/${edition.id}`, corps)
        : await apiPost("/api/admin/entites", corps);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Enregistrement impossible."));
      setEdition(null);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (e: Entite) => {
    if (!window.confirm(`Supprimer l'entité « ${e.nom} » ?`)) return;
    const res = await apiDelete(`/api/admin/entites/${e.id}`);
    if (!res.ok) setErreur(await messageErreurApi(res, "Suppression impossible."));
    else await charger();
  };

  const maj = (champs: Partial<Saisie>) => setEdition((ed) => (ed ? { ...ed, saisie: { ...ed.saisie, ...champs } } : ed));

  return (
    <div>
      <PageHeader
        titre="Banques et filiales"
        description="Chaque utilisateur voit les dossiers de sa banque et de ses filiales, jamais ceux de sa maison mère ni des banques sœurs. Le nom et le logo de l'outil se règlent par entité ; une filiale sans réglage reprend ceux de sa maison mère."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
        actions={
          tout && (
            <button
              onClick={() => ouvrir()}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              <Plus size={15} /> Nouvelle entité racine
            </button>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{erreur}</div>
      )}

      <SectionCard titre="Organisation" sansPadding>
        {chargement ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" /> Chargement…
          </div>
        ) : ordre.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune entité.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ordre.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
                style={{ paddingLeft: `${16 + Math.min(e.niveau - minNiveau, 6) * 20}px` }}
              >
                {e.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.logoUrl} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />
                ) : (
                  <Building2 size={20} className="shrink-0 text-muted-foreground" style={e.couleurPrimaire ? { color: e.couleurPrimaire } : undefined} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{e.nom}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{e.code}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{TYPES[e.type] ?? e.type}</span>
                    {!e.isActive && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">Désactivée</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {e.effectifs.utilisateurs} utilisateur(s) · {e.effectifs.clients} client(s) · {e.effectifs.projets} projet(s)
                    {e.nomOutil ? ` · outil « ${e.nomOutil} »` : ""}
                    {e.pays ? ` · ${e.pays}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => ouvrir(undefined, e.id)} title="Ajouter une filiale" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary">
                    <Plus size={15} />
                  </button>
                  <button onClick={() => ouvrir(e)} title="Modifier" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-primary">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => supprimer(e)} title="Supprimer" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {edition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">{edition.id ? "Modifier l'entité" : "Nouvelle entité"}</h2>
              <button onClick={() => setEdition(null)} className="rounded-md p-1 text-muted-foreground hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[13px] text-foreground">Nom
                <input className={`${champ} mt-1`} value={edition.saisie.nom} onChange={(ev) => maj({ nom: ev.target.value })} />
              </label>
              <label className="text-[13px] text-foreground">Code
                <input className={`${champ} mt-1 font-mono`} value={edition.saisie.code} onChange={(ev) => maj({ code: ev.target.value.toUpperCase() })} placeholder="BP-CASA" />
              </label>
              <label className="text-[13px] text-foreground">Type
                <select className={`${champ} mt-1`} value={edition.saisie.type} onChange={(ev) => maj({ type: ev.target.value })}>
                  {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="text-[13px] text-foreground">Rattachée à
                <select
                  className={`${champ} mt-1`}
                  value={edition.saisie.parentId ?? ""}
                  onChange={(ev) => maj({ parentId: ev.target.value || null })}
                >
                  {tout && <option value="">— Aucune (entité racine) —</option>}
                  {ordre.filter((p) => p.id !== edition.id).map((p) => (
                    <option key={p.id} value={p.id}>{"  ".repeat(Math.max(0, p.niveau - minNiveau))}{p.nom}</option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] text-foreground">Pays
                <input className={`${champ} mt-1`} value={edition.saisie.pays} onChange={(ev) => maj({ pays: ev.target.value })} placeholder="Maroc" />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-[13px] text-foreground">
                <input type="checkbox" checked={edition.saisie.isActive} onChange={(ev) => maj({ isActive: ev.target.checked })} />
                Entité active
              </label>
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Habillage de l&apos;outil (vide = celui de la maison mère)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[13px] text-foreground sm:col-span-2">Nom de l&apos;outil
                <input className={`${champ} mt-1`} value={edition.saisie.nomOutil} onChange={(ev) => maj({ nomOutil: ev.target.value })} placeholder="Scoring PF" />
              </label>
              <label className="text-[13px] text-foreground sm:col-span-2">Adresse du logo (https://… ou /…)
                <input className={`${champ} mt-1`} value={edition.saisie.logoUrl} onChange={(ev) => maj({ logoUrl: ev.target.value })} placeholder="https://www.mabanque.ma/logo.png" />
              </label>
              <label className="text-[13px] text-foreground">Couleur principale
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={edition.saisie.couleurPrimaire || "#2563eb"} onChange={(ev) => maj({ couleurPrimaire: ev.target.value })} className="h-9 w-12 rounded border border-border bg-background" />
                  <input className={champ} value={edition.saisie.couleurPrimaire} onChange={(ev) => maj({ couleurPrimaire: ev.target.value })} placeholder="#RRGGBB" />
                </div>
              </label>
              {edition.saisie.logoUrl && (
                <div className="flex items-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={edition.saisie.logoUrl} alt="Aperçu du logo" className="h-10 max-w-full object-contain" />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEdition(null)} className="h-9 rounded-md border border-border px-4 text-sm text-foreground hover:bg-accent">Annuler</button>
              <button
                onClick={enregistrer}
                disabled={envoi || !edition.saisie.nom || !edition.saisie.code}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {envoi && <Loader2 size={14} className="animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
