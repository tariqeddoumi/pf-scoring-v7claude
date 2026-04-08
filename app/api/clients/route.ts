import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';

async function handleGET(request: NextRequest, user: any) {
  try {
    const clients = await prisma.client.findMany({
      include: {
        projects: {
          select: { id: true, nom: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error: any) {
    console.error('[CLIENTS] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { nom, email, telephone, secteur, pays, type, description } = body;

    if (!nom) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        nom,
        email: email || null,
        telephone: telephone || null,
        secteur: secteur || null,
        pays: pays || null,
        type: type || 'Entreprise',
        description: description || null
      }
    });

    return NextResponse.json(
      { success: true, data: client },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[CLIENTS] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
