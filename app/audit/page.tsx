"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileClock, Loader2, Search, X } from "lucide-react";
import { apiGet, messageErreurApi } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";

interface LigneAudit {
  id: string;
  action: string;
  details: string | null;
  dateAction: string;
  projectId?: string | null;
  utilisateurId: string;
  user?: { id: string; nom?: string | null; prenom?: string | null; email?: string | null } | null;
  project?: { id: string; nom: string } | null;
}

/**
 * Libellés des actions consignées. Le tableau affichait le code brut
 * (« UPDATE_PROJECT_STATUS »), qu'un `capitalize` laissait intact puisqu'il est
 * déjà en majuscules.
 */
const ACTIONS: Record<string, string> = {
  CREATE: "Création",
  CREATE_PROJECT: "Création d'un projet",
  CREATE_USER: "Création d'un utilisateur",
  UPDATE: "Modification",
  UPDATE_PROJECT: "Modification d'un projet",
  UPDATE_PROJECT_STATUS: "Changement de statut d'un projet",
  UPDATE_USER: "Modification d'un utilisateur",
  DELETE: "Suppression",
  DELETE_PROJECT: "Suppression d'un projet",
  DELETE_USER: "Suppression d'un utilisateur",
  CHANGE_USER_ROLE: "Changement de rôle",
  READ: "Consultation",
  LOGIN: "Connexion",
  CALCULATE: "Calcul de la note",
  SCORING_CALCULATED: "Note calculée",
  SUBMIT: "Soumission à validation",
  EVALUATION_REOPENED: "Remise en saisie d'une évaluation",
  VALIDATE: "Validation",
  REJECT: "Rejet",
  STATUS_CHANGE: "Changement de statut",
  STATUS_TRANSITION: "Transition de statut",
  VERSION_STATUS_TRANSITION: "Changement d'état d'une version du modèle",
  VERSION_PUBLISHED: "Publication d'une version du modèle",
};

const libelleAction = (code: string) =>
  ACTIONS[code] ?? code.toLowerCase().replace(/_/g, " ");

/**
 * Met les détails en phrase. Ils sont consignés en JSON ({"projectName":"…"},
 * {"from":"brouillon","to":"en_revue"}) et s'affichaient tels quels, accolades
 * comprises.
 */
/** Valeurs consignées sous forme de code : elles s'affichaient telles quelles. */
const VALEURS: Record<string, string> = {
  brouillon: "Brouillon",
  en_cours: "En cours",
  en_revue: "En revue",
  approuve: "Approuvé",
  rejete: "Rejeté",
  soumis: "Soumis",
  valide: "Validé",
  system_admin: "Administrateur système",
  scoring_admin: "Administrateur du modèle",
  risk_manager: "Responsable des risques",
  risk_analyst: "Analyste risques",
  read_only: "Lecture seule",
  auditor: "Auditeur",
};

const lisible = (v: unknown) => VALEURS[String(v)] ?? String(v);

function detailsLisibles(details: string | null, avecProjet: boolean): string | null {
  if (!details) return null;
  let objet: unknown;
  try {
    objet = JSON.parse(details);
  } catch {
    return details;
  }
  if (!objet || typeof objet !== "object") return String(objet);
  const o = objet as Record<string, unknown>;
  const morceaux: string[] = [];
  if (o.from || o.to) {
    morceaux.push(
      `de « ${o.from ? lisible(o.from) : "—"} » à « ${o.to ? lisible(o.to) : "—"} »`
    );
  }
  for (const [cle, valeur] of Object.entries(o)) {
    if (cle === "from" || cle === "to") continue;
    if (valeur === null || valeur === undefined || valeur === "") continue;
    if (typeof valeur === "object") continue;
    // Le nom du dossier est déjà affiché en lien : ne pas le répéter.
    if (avecProjet && (cle === "projectName" || cle === "projectId")) continue;
    morceaux.push(`${etiquette(cle)} : ${lisible(valeur)}`);
  }
  return morceaux.join(" · ") || null;
}

const ETIQUETTES: Record<string, string> = {
  projectName: "Projet",
  projectId: "Projet",
  newRole: "Nouveau rôle",
  oldRole: "Ancien rôle",
  userId: "Utilisateur",
  email: "Courriel",
  role: "Rôle",
  score: "Score",
  motif: "Motif",
  evaluationId: "Évaluation",
  rating: "Note",
  status: "Statut",
  version: "Version",
};

const etiquette = (cle: string) => ETIQUETTES[cle] ?? cle;

const nomAuteur = (l: LigneAudit) =>
  l.user
    ? `${l.user.prenom ?? ""} ${l.user.nom ?? ""}`.trim() || l.user.email || l.utilisateurId
    : l.utilisateurId;

/**
 * Journal d'audit.
 *
 * L'écran lisait `log.timestamp`, champ qui n'existe pas — le modèle porte
 * `dateAction` : toutes les dates étaient « Invalid Date ». Une fois la date
 * corrigée, restaient des codes bruts, des identifiants techniques à la place des
 * noms, aucun filtre et une limite de cinquante lignes que rien n'annonçait.
 */
export default function JournalAuditPage() {
  const [lignes, setLignes] = useState<LigneAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [limite, setLimite] = useState(100);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [action, setAction] = useState("");

  const charger = useCallback(async () => {
    try {
      setChargement(true);
      const res = await apiGet(`/api/audit?limit=${limite}`);
      if (!res.ok) throw new Error(await messageErreurApi(res, "Lecture du journal impossible."));
      const corps = await res.json();
      // La route renvoyait un tableau nu ; elle renvoie désormais data + total.
      const data: LigneAudit[] = Array.isArray(corps) ? corps : (corps.data ?? []);
      setLignes(data);
      setTotal(Array.isArray(corps) ? data.length : (corps.total ?? data.length));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Lecture impossible.");
      setLignes([]);
    } finally {
      setChargement(false);
    }
  }, [limite]);

  useEffect(() => {
    charger();
  }, [charger]);

  const actions = useMemo(
    () => [...new Set(lignes.map((l) => l.action))].sort(),
    [lignes]
  );

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return lignes.filter((l) => {
      const texte =
        `${nomAuteur(l)} ${l.project?.nom ?? ""} ${libelleAction(l.action)} ${l.details ?? ""}`.toLowerCase();
      return (!q || texte.includes(q)) && (!action || l.action === action);
    });
  }, [lignes, recherche, action]);

  /** Regroupement par jour : un journal se lit par journée, pas ligne à ligne. */
  const parJour = useMemo(() => {
    const groupes = new Map<string, LigneAudit[]>();
    for (const l of filtrees) {
      const jour = (l.dateAction ?? "").slice(0, 10);
      if (!groupes.has(jour)) groupes.set(jour, []);
      groupes.get(jour)!.push(l);
    }
    return [...groupes.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtrees]);

  if (chargement && lignes.length === 0) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titre="Journal d'audit"
        description={`${total} action${total > 1 ? "s" : ""} consignée${total > 1 ? "s" : ""}`}
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un auteur, un dossier, une action…"
            aria-label="Rechercher dans le journal"
            className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          aria-label="Filtrer par action"
          className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
        >
          <option value="">Toutes les actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {libelleAction(a)}
            </option>
          ))}
        </select>
        {(action || recherche) && (
          <button
            onClick={() => {
              setAction("");
              setRecherche("");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      {parJour.length === 0 ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<FileClock size={28} />}
            titre={lignes.length === 0 ? "Journal vide" : "Aucune action ne correspond"}
            description={
              lignes.length === 0
                ? "Aucune action n'a encore été consignée."
                : "Modifiez la recherche ou le filtre."
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {parJour.map(([jour, actionsDuJour]) => (
            <SectionCard key={jour} titre={formatDate(jour)} sansPadding>
              <ul>
                {actionsDuJour.map((l) => {
                  const details = detailsLisibles(l.details, Boolean(l.project));
                  return (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border px-4 py-2.5 text-sm last:border-b-0"
                    >
                      <span className="tabulaire w-12 shrink-0 text-[12px] text-muted-foreground">
                        {new Date(l.dateAction).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="font-medium text-foreground">{nomAuteur(l)}</span>
                      <span className="text-muted-foreground">
                        — {libelleAction(l.action).toLowerCase()}
                      </span>
                      {l.project && (
                        <Link
                          href={`/projects/${l.project.id}`}
                          className="text-primary hover:underline"
                        >
                          {l.project.nom}
                        </Link>
                      )}
                      {details && (
                        <span className="text-[12.5px] text-muted-foreground">
                          · {details}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          ))}

          {/* La page s'arrêtait silencieusement aux cinquante dernières lignes. */}
          {lignes.length < total && (
            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-[12.5px] text-muted-foreground">
                {lignes.length} action{lignes.length > 1 ? "s" : ""} sur {total}
              </span>
              <button
                onClick={() => setLimite((l) => l + 200)}
                disabled={chargement}
                className="inline-flex h-9 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
              >
                {chargement ? "Chargement…" : "Afficher plus"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
