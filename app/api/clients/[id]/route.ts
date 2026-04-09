import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';
import { updateClientSchema } from '@/lib/validation-schemas';
import { ZodError } from 'zod';

/**
 * GET /api/clients/[id] - Get single client
 */
async function handleGET(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: { id: true, nom: true, status: true }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé', errorCode: 'ERR_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    console.error('[CLIENTS] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la récupération du client',
        errorCode: 'ERR_API_001'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id] - Update client
 */
async function handlePATCH(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    console.log('[CLIENTS] PATCH request body:', JSON.stringify(body));

    // Validation avec Zod
    let validated;
    try {
      validated = updateClientSchema.parse(body);
    } catch (validationError) {
      console.error('[CLIENTS] Validation error:', validationError);
      throw validationError;
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    });

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client non trouvé',
          errorCode: 'ERR_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // If email is changing, check for duplicates
    if (validated.email && validated.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: validated.email }
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Un client avec cet email existe déjà',
            errorCode: 'ERR_DUPLICATE',
            errors: [
              {
                field: 'email',
                message: 'Cet email est déjà utilisé'
              }
            ]
          },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        nom: validated.nom ?? existingClient.nom,
        email: validated.email ?? existingClient.email,
        telephone: validated.telephone ?? existingClient.telephone,
        secteur: validated.secteur ?? existingClient.secteur,
        pays: validated.pays ?? existingClient.pays,
        type: validated.type ?? existingClient.type,
        description: validated.description ?? existingClient.description
      }
    });

    console.log('[CLIENTS] PATCH success:', client.id);

    return NextResponse.json(
      { success: true, data: client },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CLIENTS] PATCH error:', error);

    // Gestion des erreurs Zod
    if (error instanceof ZodError) {
      const errors = error.flatten().fieldErrors;
      const formattedErrors = Object.entries(errors).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : messages
      }));

      return NextResponse.json(
        {
          success: false,
          error: 'Validation échouée',
          errorCode: 'ERR_VALID_001',
          errors: formattedErrors
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour du client',
        errorCode: 'ERR_API_001'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id] - Delete client
 */
async function handleDELETE(request: NextRequest, user: any, { params }: { params: { id: string } }) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: { projects: { select: { id: true } } }
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé', errorCode: 'ERR_NOT_FOUND' },
        { status: 404 }
      );
    }

    // If client has projects, prevent deletion
    if (client.projects.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible de supprimer un client avec des projets',
          errorCode: 'ERR_BUSINESS',
          details: `Ce client a ${client.projects.length} projet(s) associé(s)`
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id: params.id }
    });

    console.log('[CLIENTS] DELETE success:', params.id);

    return NextResponse.json(
      { success: true, message: 'Client supprimé avec succès' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[CLIENTS] DELETE error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Client non trouvé',
          errorCode: 'ERR_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur lors de la suppression du client',
        errorCode: 'ERR_API_001'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req, user) => handleGET(req, user, { params }));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req, user) => handlePATCH(req, user, { params }));
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, (req, user) => handleDELETE(req, user, { params }));
}
