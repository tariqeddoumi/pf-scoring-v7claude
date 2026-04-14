import prisma from "@/lib/prisma-client";
import type { Prisma } from "@prisma/client";

/**
 * Service pour la gestion complète des utilisateurs
 * Inclut: CRUD, authentification, audit, désactivation
 *
 * Fonctionnalités:
 * - Soft delete via isActive flag
 * - Audit trail de chaque action
 * - Gestion des sessions et lastLoginAt
 * - mustChangePassword pour reset forcé
 */
export class UserManagementService {
  /**
   * Récupère un utilisateur par ID (actif uniquement par défaut)
   */
  static async getUserById(
    id: string,
    includeInactive: boolean = false
  ) {
    const where: Prisma.UserWhereInput = { id };
    if (!includeInactive) {
      where.isActive = true;
      where.deletedAt = null;
    }

    return prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Récupère tous les utilisateurs avec options de filtre
   */
  static async listUsers(
    filters: {
      role?: string;
      isActive?: boolean;
      includeDeleted?: boolean;
    } = {}
  ) {
    const where: Prisma.UserWhereInput = {};

    if (filters.role) where.role = filters.role as any;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Enregistre une connexion réussie
   * Met à jour lastLoginAt et réinitialise mustChangePassword si besoin
   */
  static async recordLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        mustChangePassword: false, // Reset à la connexion
      },
    });

    // Audit
    await this.auditAction(userId, userId, "LOGIN", null, null, undefined, ipAddress, userAgent);

    return user;
  }

  /**
   * Désactive un utilisateur (soft delete)
   */
  static async deactivateUser(
    userId: string,
    performedById: string,
    reason?: string
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Audit
    await this.auditAction(
      userId,
      performedById,
      "DEACTIVATE",
      "true",
      "false",
      reason
    );

    return user;
  }

  /**
   * Réactive un utilisateur (annule la désactivation)
   */
  static async reactivateUser(
    userId: string,
    performedById: string,
    reason?: string
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deletedAt: null,
      },
    });

    // Audit
    await this.auditAction(
      userId,
      performedById,
      "REACTIVATE",
      "false",
      "true",
      reason
    );

    return user;
  }

  /**
   * Change le rôle d'un utilisateur avec audit
   */
  static async changeUserRole(
    userId: string,
    newRole: string,
    performedById: string,
    reason?: string
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });

    // Audit
    await this.auditAction(
      userId,
      performedById,
      "ROLE_CHANGE",
      currentUser?.role ?? null,
      newRole,
      reason
    );

    return user;
  }

  /**
   * Force un changement de mot de passe à la prochaine connexion
   */
  static async requirePasswordChange(
    userId: string,
    performedById: string,
    reason?: string
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    // Audit
    await this.auditAction(
      userId,
      performedById,
      "PASSWORD_CHANGE_REQUIRED",
      "false",
      "true",
      reason
    );

    return user;
  }

  /**
   * Enregistre une action utilisateur dans l'audit log
   * @param userId - Utilisateur affecté
   * @param performedById - Utilisateur effectuant l'action (ou l'utilisateur lui-même)
   * @param action - Type d'action
   * @param oldValue - Ancienne valeur (optionnel)
   * @param newValue - Nouvelle valeur (optionnel)
   * @param reason - Raison/commentaire
   * @param ipAddress - Adresse IP
   * @param userAgent - User agent du navigateur
   */
  static async auditAction(
    userId: string,
    performedById: string,
    action: string,
    oldValue: string | null,
    newValue: string | null,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return prisma.userAuditLog.create({
      data: {
        userId,
        performedById,
        action,
        oldValue: oldValue || undefined,
        newValue: newValue || undefined,
        reason: reason || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      },
    });
  }

  /**
   * Récupère l'historique d'audit d'un utilisateur
   */
  static async getUserAuditLog(
    userId: string,
    limit: number = 50
  ) {
    return prisma.userAuditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        oldValue: true,
        newValue: true,
        reason: true,
        performedBy: {
          select: { id: true, email: true, nom: true, prenom: true },
        },
        createdAt: true,
      },
    });
  }

  /**
   * Supprime réellement un utilisateur (danger zone)
   * À utiliser uniquement pour RGPD ou nettoyage complet
   */
  static async permanentlyDeleteUser(userId: string) {
    // D'abord supprimer l'audit log
    await prisma.userAuditLog.deleteMany({
      where: { OR: [{ userId }, { performedById: userId }] },
    });

    // Puis l'utilisateur
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
