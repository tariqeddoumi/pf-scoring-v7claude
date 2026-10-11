"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Database, Loader2, XCircle } from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

interface EtatBase {
  moteur: string;
  hote: string;
  base: string;
  latenceMs: number;
  schema: { attendues: number; manquantes: string[] };
  volumes: { entites: number; utilisateurs: number; clients: number; projets: number };
  stockagePieces: string;
}

const COMMANDES = `# 1. À blanc : vérifie la connexion et affiche le plan, n'écrit rien
npm run db:basculer -- --cible "postgresql://utilisateur:motdepasse@hote:5432/pfscoring"

# 2. Bascule avec reprise de toutes les données de la base actuelle
npm run db:basculer -- --cible "postgresql://…nouvelle base…" --source "$DATABASE_URL" --appliquer

# 3. Remplacer DATABASE_URL par la nouvelle adresse (Vercel › Settings ›
#    Environment Variables), puis redéployer.`;

export default function BasePage() {
  const [etat, setEtat] = useState<EtatBase | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiGet("/api/admin/base")
      .then(async (r) => {
        if (!r.ok) throw new Error(await messageErreurApi(r, "État indisponible."));
        setEtat((await r.json()).data);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : "État indisponible."));
  }, []);

  const ligne = (libelle: string, valeur: React.ReactNode) => (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{libelle}</span>
      <span className="break-all text-right font-medium text-foreground">{valeur}</span>
    </div>
  );

  return (
    <div>
      <PageHeader
        titre="Base de données"
        description="Toute base PostgreSQL 14 ou plus récente convient : Supabase, PostgreSQL de la banque, Azure, AWS, Google Cloud. Le changement se fait par une commande et une variable d'environnement, jamais depuis cet écran."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
      />
      {erreur && <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{erreur}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard titre="Base en service">
          {!etat && !erreur ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Lecture…</div>
          ) : etat ? (
            <div>
              {ligne("Moteur", <span className="inline-flex items-center gap-1.5"><Database size={14} />{etat.moteur}</span>)}
              {ligne("Serveur", etat.hote)}
              {ligne("Base", etat.base || "—")}
              {ligne("Temps de réponse", `${etat.latenceMs} ms`)}
              {ligne(
                "Schéma",
                etat.schema.manquantes.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 size={14} /> conforme ({etat.schema.attendues} tables)</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-destructive"><XCircle size={14} /> {etat.schema.manquantes.length} table(s) manquante(s)</span>
                )
              )}
              {ligne("Contenu", `${etat.volumes.entites} entité(s) · ${etat.volumes.utilisateurs} utilisateur(s) · ${etat.volumes.clients} client(s) · ${etat.volumes.projets} projet(s)`)}
              {ligne("Stockage des pièces", etat.stockagePieces)}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard titre="Changer de base" description="Kit de bascule : connexion, schéma, reprise des données et contrôle, en une commande (guide détaillé : docs/changer-de-base.md).">
          <pre className="overflow-x-auto whitespace-pre rounded-md bg-muted p-3 text-[12px] leading-relaxed text-foreground">{COMMANDES}</pre>
        </SectionCard>
      </div>
    </div>
  );
}
