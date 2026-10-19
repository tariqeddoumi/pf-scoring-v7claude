import prisma from "@/lib/prisma-client";
import { completerNotesProjets } from "@/lib/modele-pf/note-projet";
import {
  createProjectSchema,
  updateProjectSchema,
  seulementFournis,
} from "@/lib/validation-schemas";
import type { z } from "zod";
import { Prisma } from "@prisma/client";
import { proposerCodeProjet } from "@/lib/modele-pf/codes";

/** Message d'un conflit d'unicité sur un projet (code projet déjà attribué), sinon null. */
export function messageConflitProjet(e: unknown): string | null {
  if (
    !(e instanceof Prisma.PrismaClientKnownRequestError) ||
    e.code !== "P2002"
  )
    return null;
  const cible = JSON.stringify(e.meta?.target ?? "");
  if (cible.includes("codeProjet"))
    return "Ce code projet est déjà attribué à un autre projet de la banque.";
  return "Un projet portant ces identifiants existe déjà.";
}

export class ProjectService {
  /**
   * Create new project
   */
  static async createProject(
    data: z.infer<typeof createProjectSchema>,
    createdBy: string
  ) {
    const validated = createProjectSchema.parse(data);

    const { debutConstruction, finConstruction, clientId, ...rest } = validated;
    const createData: Record<string, unknown> = {
      ...rest,
      creePar: createdBy,
      status: validated.status || "brouillon",
    };
    if (debutConstruction)
      createData.debutConstruction = new Date(debutConstruction);
    if (finConstruction) createData.finConstruction = new Date(finConstruction);
    if (clientId) createData.clientId = clientId;

    let project = await prisma.project.create({
      data: createData as Prisma.ProjectUncheckedCreateInput,
    });

    // Code projet proposé automatiquement (PF-AAAA-NNNN) quand il n'a pas été saisi :
    // numéro suivant de l'année dans la banque du projet ; nouvel essai si un autre
    // projet a pris le même numéro au même moment.
    if (!project.codeProjet) {
      for (let essai = 0; essai < 3; essai++) {
        const existants = await prisma.project.findMany({
          where: {
            entiteId: project.entiteId,
            codeProjet: { startsWith: `PF-${new Date().getFullYear()}-` },
          },
          select: { codeProjet: true },
        });
        try {
          project = await prisma.project.update({
            where: { id: project.id },
            data: {
              codeProjet: proposerCodeProjet(
                existants.map((p) => p.codeProjet)
              ),
            },
          });
          break;
        } catch (e) {
          if (!messageConflitProjet(e)) throw e;
        }
      }
    }

    // Only log audit if createdBy is valid
    if (createdBy && createdBy.trim()) {
      try {
        await prisma.auditLog.create({
          data: {
            projectId: project.id,
            utilisateurId: createdBy,
            action: "CREATE_PROJECT",
            details: JSON.stringify({ projectName: project.nom }),
          },
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
      }
    }

    return project;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
        client: {
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            codeClientT24: true,
            radical: true,
          },
        },
      },
    });

    // No need to log reads for performance

    return project ? (await completerNotesProjets([project]))[0] : project;
  }

  /**
   * Get all projects (paginated)
   */
  static async getAllProjects(
    page: number = 1,
    limit: number = 50,
    filters?: { status?: string; secteur?: string; creePar?: string }
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};
    if (filters?.status)
      where.status = filters.status as Prisma.ProjectWhereInput["status"];
    if (filters?.secteur) where.secteur = filters.secteur;
    if (filters?.creePar) where.creePar = filters.creePar;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateCreation: "desc" },
        select: {
          id: true,
          nom: true,
          description: true,
          secteur: true,
          montant: true,
          devise: true,
          status: true,
          scoreGlobal: true,
          grade: true,
          dateCreation: true,
          // La liste affichait une colonne « Pays » toujours vide : le champ n'était
          // pas sélectionné. dateMiseAJour sert à trier par activité récente.
          pays: true,
          countryCode: true,
          dateMiseAJour: true,
          // La recherche transversale porte sur le sponsor : sans ce champ, taper le
          // nom d'un sponsor ne remontait aucun de ses projets.
          sponsorPrincipal: true,
          codeProjet: true,
          user: {
            select: { nom: true, prenom: true, email: true },
          },
          client: {
            select: { id: true, nom: true, email: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: await completerNotesProjets(projects),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    data: z.infer<typeof updateProjectSchema>,
    updatedBy: string
  ) {
    const validated = seulementFournis(updateProjectSchema.parse(data), data);

    // Extract date strings and convert to Date objects; remove undefined fields
    const { debutConstruction, finConstruction, clientId, ...rest } = validated;
    const updateData: Record<string, unknown> = {
      ...rest,
      dateMiseAJour: new Date(),
    };
    // Le code projet se modifie mais ne s'efface pas : un champ vidé le conserve.
    if (updateData.codeProjet === null) delete updateData.codeProjet;
    if (debutConstruction !== undefined)
      updateData.debutConstruction = debutConstruction
        ? new Date(debutConstruction)
        : null;
    if (finConstruction !== undefined)
      updateData.finConstruction = finConstruction
        ? new Date(finConstruction)
        : null;
    if (clientId !== undefined) updateData.clientId = clientId || null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Only log audit if updatedBy is valid
    if (updatedBy && updatedBy.trim()) {
      try {
        await prisma.auditLog.create({
          data: {
            projectId: id,
            utilisateurId: updatedBy,
            action: "UPDATE_PROJECT",
            details: JSON.stringify({ projectName: project.nom }),
          },
        });
      } catch (auditError) {
        // Log error but don't fail the update
        console.error("Failed to create audit log:", auditError);
      }
    }

    return project;
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    id: string,
    status: "brouillon" | "en_cours" | "en_revue",
    updatedBy: string
  ) {
    const project = await prisma.project.update({
      where: { id },
      data: {
        status,
        dateMiseAJour: new Date(),
      },
    });

    // Only log audit if updatedBy is valid
    if (updatedBy && updatedBy.trim()) {
      try {
        await prisma.auditLog.create({
          data: {
            projectId: id,
            utilisateurId: updatedBy,
            action: "UPDATE_PROJECT_STATUS",
            details: JSON.stringify({ status }),
          },
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
      }
    }

    return project;
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string, deletedBy: string) {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new Error("Project not found");
    }

    // La suppression d'un projet efface ses évaluations en cascade : elle est refusée
    // dès qu'une évaluation a quitté le brouillon (pièce du dossier de crédit).
    const [anciennes, scoringsPF] = await Promise.all([
      prisma.scoringEvaluation.count({ where: { projectId: id, status: { not: "brouillon" } } }),
      prisma.evaluationPF.count({ where: { projectId: id, statut: { not: "brouillon" } } }),
    ]);
    const evaluationsEngagees = anciennes + scoringsPF;
    if (evaluationsEngagees > 0) {
      throw new Error(
        `Suppression refusée : ${evaluationsEngagees} évaluation(s) soumise(s), validée(s) ou rejetée(s) sont rattachées au projet. Archivez-le plutôt.`
      );
    }

    await prisma.project.delete({ where: { id } });

    // Only log audit if deletedBy is valid
    if (deletedBy && deletedBy.trim()) {
      try {
        await prisma.auditLog.create({
          data: {
            projectId: id,
            utilisateurId: deletedBy,
            action: "DELETE_PROJECT",
            details: JSON.stringify({ projectName: project.nom }),
          },
        });
      } catch (auditError) {
        console.error("Failed to create audit log:", auditError);
      }
    }

    return project;
  }

  /**
   * Get projects by user
   */
  static async getProjectsByUser(
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { creePar: userId },
        skip,
        take: limit,
        orderBy: { dateCreation: "desc" },
        include: {
          client: {
            select: { id: true, nom: true, email: true },
          },
        },
      }),
      prisma.project.count({ where: { creePar: userId } }),
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
