import prisma from '@/lib/prisma';
import { createProjectSchema, updateProjectSchema } from '@/lib/validation-schemas';
import type { z } from 'zod';

export class ProjectService {
  /**
   * Create new project
   */
  static async createProject(data: z.infer<typeof createProjectSchema>, createdBy: string) {
    const validated = createProjectSchema.parse(data);

    const project = await prisma.project.create({
      data: {
        ...validated,
        creePar: createdBy,
        status: 'brouillon'
      }
    });

    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        utilisateurId: createdBy,
        action: 'CREATE_PROJECT',
        details: JSON.stringify({ projectName: project.nom })
      }
    });

    return project;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string, userId?: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nom: true, prenom: true }
        },
        client: {
          select: { id: true, nom: true, email: true, telephone: true }
        }
      }
    });

    // No need to log reads for performance

    return project;
  }

  /**
   * Get all projects (paginated)
   */
  static async getAllProjects(page: number = 1, limit: number = 50, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.secteur) where.secteur = filters.secteur;
    if (filters?.creePar) where.creePar = filters.creePar;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateCreation: 'desc' },
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
          user: {
            select: { nom: true, prenom: true, email: true }
          },
          client: {
            select: { id: true, nom: true, email: true }
          }
        }
      }),
      prisma.project.count({ where })
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update project
   */
  static async updateProject(id: string, data: z.infer<typeof updateProjectSchema>, updatedBy: string) {
    const validated = updateProjectSchema.parse(data);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...validated,
        dateMiseAJour: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        projectId: id,
        utilisateurId: updatedBy,
        action: 'UPDATE_PROJECT',
        details: JSON.stringify({ projectName: project.nom })
      }
    });

    return project;
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    id: string,
    status: 'brouillon' | 'en_cours' | 'en_revue' | 'approuve' | 'rejete',
    updatedBy: string
  ) {
    const project = await prisma.project.update({
      where: { id },
      data: {
        status,
        dateMiseAJour: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        projectId: id,
        utilisateurId: updatedBy,
        action: 'UPDATE_PROJECT_STATUS',
        details: JSON.stringify({ status })
      }
    });

    return project;
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string, deletedBy: string) {
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.project.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        projectId: id,
        utilisateurId: deletedBy,
        action: 'DELETE_PROJECT',
        details: JSON.stringify({ projectName: project.nom })
      }
    });

    return project;
  }

  /**
   * Get projects by user
   */
  static async getProjectsByUser(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { creePar: userId },
        skip,
        take: limit,
        orderBy: { dateCreation: 'desc' },
        include: {
          client: {
            select: { id: true, nom: true, email: true }
          }
        }
      }),
      prisma.project.count({ where: { creePar: userId } })
    ]);

    return {
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}
