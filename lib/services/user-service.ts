import prisma from '@/lib/prisma';
import { createUserSchema, updateUserSchema, changeUserRoleSchema } from '@/lib/validation-schemas';
import { AuditLogger } from '@/lib/audit-logger';
import type { z } from 'zod';

const auditLogger = new AuditLogger();

export class UserService {
  /**
   * Create new user
   */
  static async createUser(data: z.infer<typeof createUserSchema>, createdBy: string) {
    const validated = createUserSchema.parse(data);

    const user = await prisma.BP_PF_users.create({
      data: {
        ...validated,
        role: validated.role || 'analyst'
      }
    });

    await auditLogger.logCreate('BP_PF_users', user.id, { userId: createdBy }, user);

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    const user = await prisma.BP_PF_users.findUnique({
      where: { id }
    });

    if (user) {
      await auditLogger.logRead('BP_PF_users', id, { userId: id });
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    return prisma.BP_PF_users.findUnique({
      where: { email }
    });
  }

  /**
   * Get all users (paginated)
   */
  static async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.BP_PF_users.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatar: true,
          createdAt: true
        }
      }),
      prisma.BP_PF_users.count()
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user
   */
  static async updateUser(id: string, data: z.infer<typeof updateUserSchema>, updatedBy: string) {
    const validated = updateUserSchema.parse(data);

    const oldUser = await prisma.BP_PF_users.findUnique({ where: { id } });

    const user = await prisma.BP_PF_users.update({
      where: { id },
      data: validated
    });

    await auditLogger.logUpdate(
      'BP_PF_users',
      id,
      { userId: updatedBy },
      oldUser || {},
      user
    );

    return user;
  }

  /**
   * Change user role
   */
  static async changeUserRole(
    id: string,
    data: z.infer<typeof changeUserRoleSchema>,
    changedBy: string
  ) {
    const validated = changeUserRoleSchema.parse(data);

    const oldUser = await prisma.BP_PF_users.findUnique({ where: { id } });

    const user = await prisma.BP_PF_users.update({
      where: { id },
      data: { role: validated.role }
    });

    await auditLogger.logUpdate(
      'BP_PF_users',
      id,
      { userId: changedBy },
      { role: oldUser?.role },
      { role: user.role }
    );

    return user;
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string, deletedBy: string) {
    const user = await prisma.BP_PF_users.findUnique({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.BP_PF_users.delete({ where: { id } });

    await auditLogger.logDelete('BP_PF_users', id, { userId: deletedBy }, user);

    return user;
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string) {
    return prisma.BP_PF_users.findMany({
      where: { role: role as any },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true
      }
    });
  }
}
