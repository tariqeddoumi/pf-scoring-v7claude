import prisma from '@/lib/prisma';
import { createProjectSchema, updateProjectSchema } from '@/lib/validation-schemas';
import { AuditLogger } from '@/lib/audit-logger';
import type { z } from 'zod';

const auditLogger = new AuditLogger();

export class ProjectService {
  /**
   * Create new project
   */
  static async createProject(data: z.infer<typeof createProjectSchema>, createdBy: string) {
    const validated = createProjectSchema.parse(data);

    const project = await prisma.BP_PF_projects.create({
      data: {
        ...validated,
        creePar: createdBy,
        status: 'brouillon'
      }
    });

    await auditLogger.logCreate('BP_PF_projects', project.id, { userId: createdBy }, project);

    return project;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string, userId?: string) {
    const project = await prisma.BP_PF_projects.findUnique({
      where: { id },
      include: {
        creePar_user: {
          select: { id: true, email: true, nom: true, prenom: true }
        }
      }
    });

    if (project && userId) {
      await auditLogger.logRead('BP_PF_projects', id, { userId });
    }

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
      prisma.BP_PF_projects.findMany({
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
          creePar_user: {
            select: { nom: true, prenom: true, email: true }
          }
        }
      }),
      prisma.BP_PF_projects.count({ where })
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

    const oldProject = await prisma.BP_PF_projects.findUnique({ where: { id } });

    const project = await prisma.BP_PF_projects.update({
      where: { id },
      data: {
        ...validated,
        dateMiseAJour: new Date()
      }
    });

    await auditLogger.logUpdate(
      'BP_PF_projects',
      id,
      { userId: updatedBy },
      oldProject || {},
      project
    );

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
    const oldProject = await prisma.BP_PF_projects.findUnique({ where: { id } });

    const project = await prisma.BP_PF_projects.update({
      where: { id },
      data: {
        status,
        dateMiseAJour: new Date()
      }
    });

    await auditLogger.logUpdate(
      'BP_PF_projects',
      id,
      { userId: updatedBy },
      { status: oldProject?.status },
      { status: project.status }
    );

    return project;
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string, deletedBy: string) {
    const project = await prisma.BP_PF_projects.findUnique({ where: { id } });

    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.BP_PF_projects.delete({ where: { id } });

    await auditLogger.logDelete('BP_PF_projects', id, { userId: deletedBy }, project);

    return project;
  }

  /**
   * Get projects by user
   */
  static async getProjectsByUser(userId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.BP_PF_projects.findMany({
        where: { creePar: userId },
        skip,
        take: limit,
        orderBy: { dateCreation: 'desc' }
      }),
      prisma.BP_PF_projects.count({ where: { creePar: userId } })
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
