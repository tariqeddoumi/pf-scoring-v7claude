import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma-client";
import { withAuth, hasMinimumRole, type AuthPayload } from "@/lib/auth-middleware";
import { compteGerable } from "@/lib/entites/utilisateurs";
import { PERIMETRE_VIDE } from "@/lib/entites/perimetre";
import { messagePublic } from "@/lib/erreur-publique";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Fiche d'un utilisateur et modification de son propre profil.
 *
 * La route acceptait le corps tel quel : un analyste pouvait s'attribuer le rôle
 * « system_admin » ou écrire un mot de passe en clair, et un administrateur d'une
 * filiale modifier ou supprimer les comptes d'une autre banque. La gestion des comptes
 * (rôle, entité, activation, suppression) passe désormais uniquement par
 * /api/admin/users/[id], qui contrôle le périmètre.
 */
async function handleGET(_request: NextRequest, user: AuthPayload, params: { id: string }) {
  try {
    const soiMeme = user.userId === params.id;
    if (!soiMeme && !hasMinimumRole(user.role, "risk_manager")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    const cible = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, nom: true, prenom: true, role: true, avatar: true, entiteId: true, createdAt: true },
    });
    if (!cible || (!soiMeme && !compteGerable(user.perimetre ?? PERIMETRE_VIDE, cible.entiteId))) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    const { entiteId: _entite, ...fiche } = cible;
    return NextResponse.json(fiche);
  } catch (error: unknown) {
    return NextResponse.json({ error: messagePublic(error, "Lecture impossible") }, { status: 500 });
  }
}

/** Champs que chacun peut modifier sur son propre profil. */
const profilSchema = z.object({
  nom: z.string().trim().min(1).max(100).optional(),
  prenom: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().url().max(500).nullable().optional(),
}).strict();

async function handlePUT(request: NextRequest, user: AuthPayload, params: { id: string }) {
  try {
    if (user.userId !== params.id) {
      return NextResponse.json(
        { error: "Seul votre propre profil se modifie ici ; la gestion des comptes se fait dans l'administration." },
        { status: 403 }
      );
    }
    const v = profilSchema.safeParse(await request.json().catch(() => null));
    if (!v.success) {
      return NextResponse.json({ error: "Champs non modifiables ou invalides (nom, prénom, avatar seulement)" }, { status: 400 });
    }
    const maj = await prisma.user.update({
      where: { id: params.id },
      data: v.data,
      select: { id: true, email: true, nom: true, prenom: true, role: true, updatedAt: true },
    });
    await prisma.auditLog.create({
      data: { utilisateurId: user.userId, action: "PROFIL_MODIFIE", details: JSON.stringify({ champs: Object.keys(v.data) }) },
    });
    return NextResponse.json(maj);
  } catch (error: unknown) {
    return NextResponse.json({ error: messagePublic(error, "Modification impossible") }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handleGET(req, user, resolvedParams));
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) => handlePUT(req, user, resolvedParams));
}

/** La suppression d'un compte se fait dans l'administration (périmètre contrôlé). */
export async function DELETE() {
  return NextResponse.json(
    { error: "Utilisez l'administration des utilisateurs (/api/admin/users/[id])." },
    { status: 405 }
  );
}
