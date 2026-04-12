import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  getFieldConfig,
  updateFieldConfig,
  deleteFieldConfig,
  updateFormSection,
  deleteFormSection,
} from '@/lib/services/field-config-service';
import prisma from '@/lib/prisma';

async function handler(
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // GET - Fetch specific field or section
  if (request.method === 'GET') {
    try {
      // Try as field first
      let result: any = await prisma.fieldConfiguration.findUnique({
        where: { id },
      });

      // If not found, try as section
      if (!result) {
        result = await prisma.formSection.findUnique({
          where: { id },
          include: {
            fields: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        });
      }

      if (!result) {
        return NextResponse.json(
          { error: 'Field or section not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[Field Config GET by ID]', error);
      return NextResponse.json(
        { error: 'Failed to fetch field configuration' },
        { status: 500 }
      );
    }
  }

  // PUT - Update field or section
  if (request.method === 'PUT') {
    try {
      const body = await request.json();
      const { type, ...updateData } = body;

      // Determine if it's a field or section
      const field = await prisma.fieldConfiguration.findUnique({
        where: { id },
      });

      const section = !field
        ? await prisma.formSection.findUnique({ where: { id } })
        : null;

      if (!field && !section) {
        return NextResponse.json(
          { error: 'Field or section not found' },
          { status: 404 }
        );
      }

      let result;
      if (field) {
        result = await updateFieldConfig(id, {
          ...updateData,
          updatedBy: user.userId,
        });
      } else if (section) {
        result = await updateFormSection(id, updateData);
      }

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[Field Config PUT]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update field configuration' },
        { status: 500 }
      );
    }
  }

  // DELETE - Delete field or section
  if (request.method === 'DELETE') {
    try {
      // Check if it's a field or section
      const field = await prisma.fieldConfiguration.findUnique({
        where: { id },
      });

      const section = !field
        ? await prisma.formSection.findUnique({ where: { id } })
        : null;

      if (!field && !section) {
        return NextResponse.json(
          { error: 'Field or section not found' },
          { status: 404 }
        );
      }

      if (field) {
        await deleteFieldConfig(id);
      } else if (section) {
        await deleteFormSection(id);
      }

      return NextResponse.json({
        success: true,
        message: 'Field or section deleted successfully',
      });
    } catch (error: any) {
      console.error('[Field Config DELETE]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete field configuration' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAuth(request, (req, user) =>
    handler(req, user, { params: { id } })
  );
}
