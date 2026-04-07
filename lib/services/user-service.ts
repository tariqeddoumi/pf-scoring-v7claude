import prisma from '@/lib/prisma';
import { createUserSchema, updateUserSchema, changeUserRoleSchema } from '@/lib/validation-schemas';
import type { z } from 'zod';

export class UserService {
  /**
   * Create new user
   */
  static async createUser(data: z.infer<typeof createUserSchema>, createdBy: string) {
    const validated = createUserSchema.parse(data);

    const user = await prisma.user.create({
      data: {
        ...validated,
        role: validated.role || 'analyst'
      }
    });

    // Log in BP_PF_audit_logs
    await prisma.auditLog.create({
      data: {
        utilisateurId: createdBy,
        action: 'CREATE_USER',
        details: JSON.stringify({ userId: user.id, email: user.email })
      }
    });

    return user;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Get all users (paginated)
   */
  static async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count()
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

    const user = await prisma.user.update({
      where: { id },
      data: validated
    });

    await prisma.auditLog.create({
      data: {
        utilisateurId: updatedBy,
        action: 'UPDATE_USER',
        details: JSON.stringify({ userId: id })
      }
    });

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

    const user = await prisma.user.update({
      where: { id },
      data: { role: validated.role }
    });

    await prisma.auditLog.create({
      data: {
        utilisateurId: changedBy,
        action: 'CHANGE_USER_ROLE',
        details: JSON.stringify({ userId: id, newRole: validated.role })
      }
    });

    return user;
  }

  /**
   * Delete user
   */
  static async deleteUser(id: string, deletedBy: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        utilisateurId: deletedBy,
        action: 'DELETE_USER',
        details: JSON.stringify({ userId: id, email: user.email })
      }
    });

    return user;
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string) {
    return prisma.user.findMany({
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
