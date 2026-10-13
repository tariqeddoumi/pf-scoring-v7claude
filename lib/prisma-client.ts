/**
 * Instance globale du client Prisma (ORM pour PostgreSQL/Supabase).
 *
 * POURQUOI UN SINGLETON ? (pour débutants)
 * -------------------------------------------
 * Next.js recompile les modules à chaque modification en développement.
 * Sans cette précaution, chaque rechargement créerait une NOUVELLE connexion
 * à la base de données, ce qui finirait par épuiser le pool de connexions Supabase.
 *
 * La solution : stocker l'instance dans `globalThis` (variable globale de Node.js)
 * pour la réutiliser entre les recompilations.
 *
 * En PRODUCTION, ce problème n'existe pas (le serveur ne se rechargee pas),
 * donc on crée simplement une instance standard.
 *
 * UTILISATION :
 *   import prisma from "@/lib/prisma-client";
 *   const user = await prisma.user.findUnique({ where: { id } });
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { perimetreCourant } from "@/lib/entites/contexte";
import { peutEcrire, peutLire, type Perimetre } from "@/lib/entites/perimetre";
import {
  argumentsFiltres,
  CREATIONS,
  FILTRES,
  HorsPerimetreError,
  reference,
} from "@/lib/entites/filtre-prisma";

// Déclaration pour TypeScript : on ajoute "prisma" à l'espace global de Node.js
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaConfig: Prisma.PrismaClientOptions = {
  // En développement : afficher toutes les requêtes SQL dans la console (utile pour déboguer)
  // En production : n'afficher que les erreurs (moins de bruit dans les logs)
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
  // Format lisible pour les messages d'erreur Prisma
  errorFormat: "pretty",
};

// Réutiliser l'instance existante en développement, sinon en créer une nouvelle
const base = global.prisma ?? new PrismaClient(prismaConfig);

// Sauvegarder dans global uniquement en développement (voir explication ci-dessus)
if (process.env.NODE_ENV !== "production") {
  global.prisma = base;
}

/**
 * Client SANS cloisonnement : réservé aux vérifications internes (arbre des entités,
 * état des comptes, contrôles de création ci-dessous). Une route ne doit pas
 * l'utiliser pour lire des dossiers.
 */
export const prismaSysteme = base;

/** Entité par défaut d'une création sans entité : la racine, si elle est unique. */
async function racineUnique(): Promise<string | null> {
  const racines = await base.entite.findMany({ where: { parentId: null }, select: { id: true }, take: 2 });
  return racines.length === 1 ? racines[0].id : null;
}

async function entiteDuProjet(projectId: string | null): Promise<string | null> {
  if (!projectId) return null;
  const p = await base.project.findUnique({ where: { id: projectId }, select: { entiteId: true } });
  return p?.entiteId ?? null;
}

async function entiteDeLEvaluation(evaluationId: string | null): Promise<string | null> {
  if (!evaluationId) return null;
  const e = await base.scoringEvaluation.findUnique({
    where: { id: evaluationId },
    select: { project: { select: { entiteId: true } } },
  });
  return e?.project?.entiteId ?? null;
}

const ENFANTS_D_EVALUATION = new Set([
  "ScoringEvaluationAnswer", "ScoringDocument", "ScoringWorkflow", "ScoringOverride", "ScoringEvaluationNodeResult",
]);
const ENFANTS_DE_WORKFLOW = new Set(["ScoringWorkflowStep", "ScoringDecision", "ScoringComment", "ScoringApproval"]);

async function entiteDuWorkflow(workflowId: string | null): Promise<string | null> {
  if (!workflowId) return null;
  const w = await base.scoringWorkflow.findUnique({
    where: { id: workflowId },
    select: { evaluation: { select: { project: { select: { entiteId: true } } } } },
  });
  return w?.evaluation?.project?.entiteId ?? null;
}

/**
 * Prépare une donnée de création : entité par défaut des clients et projets, et
 * contrôle que le dossier parent est dans le périmètre d'écriture.
 */
async function preparerCreation(modele: string, data: Record<string, unknown>, p: Perimetre) {
  const verifier = (entiteId: string | null) => {
    if (!p.tout && !peutEcrire(p, entiteId)) throw new HorsPerimetreError();
  };
  if (modele === "Client" || modele === "GroupeAffaires") {
    if (!data.entiteId) data.entiteId = p.entiteId ?? (await racineUnique());
    verifier(data.entiteId as string | null);
  } else if (modele === "Project") {
    // Un projet est porté par la banque de son client.
    const clientId = reference(data, "clientId", "client");
    if (clientId) {
      const c = await base.client.findUnique({ where: { id: clientId }, select: { entiteId: true } });
      if (c?.entiteId) data.entiteId = c.entiteId;
    }
    if (!data.entiteId) data.entiteId = p.entiteId ?? (await racineUnique());
    verifier(data.entiteId as string | null);
  } else if (modele === "ScoringEvaluation" || modele === "Evaluation") {
    if (!p.tout) verifier(await entiteDuProjet(reference(data, "projectId", "project")));
  } else if (ENFANTS_D_EVALUATION.has(modele)) {
    if (!p.tout) verifier(await entiteDeLEvaluation(reference(data, "evaluationId", "evaluation")));
  } else if (ENFANTS_DE_WORKFLOW.has(modele)) {
    if (!p.tout) verifier(await entiteDuWorkflow(reference(data, "workflowId", "workflow")));
  } else if (modele === "AuditLog") {
    // Une entrée de journal rattachée à un dossier ne s'écrit que sur un dossier visible :
    // sinon un utilisateur pourrait inscrire une action dans le journal d'une autre banque.
    const projectId = reference(data, "projectId", "project");
    if (projectId && !p.tout && !peutLire(p, await entiteDuProjet(projectId))) throw new HorsPerimetreError();
  }
}

/**
 * Client cloisonné par entité (voir lib/entites/filtre-prisma.ts) : c'est celui
 * qu'utilisent les routes. Le filtrage ne s'applique que pendant une requête
 * authentifiée (périmètre posé par withAuth).
 */
const prisma = base.$extends({
  name: "cloisonnement-entites",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const p = perimetreCourant();
        if (!p || !model || !(model in FILTRES)) return query(args);
        const a = (argumentsFiltres(model, operation, args as Record<string, unknown>, p) ?? {}) as Record<string, unknown>;
        if (CREATIONS.has(operation)) {
          const donnees = Array.isArray(a.data) ? a.data : [a.data];
          for (const d of donnees) if (d) await preparerCreation(model, d as Record<string, unknown>, p);
        } else if (operation === "upsert" && a.create) {
          await preparerCreation(model, a.create as Record<string, unknown>, p);
        }
        if (operation === "update" || operation === "updateMany" || operation === "upsert") {
          const donnees = (operation === "upsert" ? a.update : a.data) as Record<string, unknown> | undefined;
          // Un projet rattaché à un autre client passe dans la banque de ce client.
          const clientId = model === "Project" && donnees ? reference(donnees, "clientId", "client") : null;
          if (clientId && donnees) {
            const c = await base.client.findUnique({ where: { id: clientId }, select: { entiteId: true } });
            if (c?.entiteId) donnees.entiteId = c.entiteId;
          }
          // Transfert d'un client ou d'un projet : l'entité d'arrivée doit aussi être
          // dans le périmètre d'écriture.
          const cible = donnees?.entiteId;
          if (!p.tout && typeof cible === "string" && !peutEcrire(p, cible)) throw new HorsPerimetreError();
        }
        return query(a as typeof args);
      },
    },
  },
}) as unknown as PrismaClient;

export default prisma;
