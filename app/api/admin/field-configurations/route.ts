import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  getEntityFields,
  getFormSections,
  createFieldConfig,
  createFormSection,
} from '@/lib/services/field-config-service';

async function handler(request: NextRequest, user: any) {
  // GET - List field configurations for an entity
  if (request.method === 'GET') {
    try {
      const { searchParams } = new URL(request.url);
      const entity = searchParams.get('entity');
      const type = searchParams.get('type'); // 'sections' or 'fields'

      if (!entity) {
        return NextResponse.json(
          { error: 'Entity parameter required' },
          { status: 400 }
        );
      }

      let data;
      if (type === 'sections') {
        data = await getFormSections(entity);
      } else {
        data = await getEntityFields(entity);
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error('[Field Config GET]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch field configurations' },
        { status: 500 }
      );
    }
  }

  // POST - Create new field or section
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { type, ...data } = body;

      if (!type) {
        return NextResponse.json(
          { error: 'Type (section or field) required' },
          { status: 400 }
        );
      }

      if (!data.entity) {
        return NextResponse.json(
          { error: 'Entity required' },
          { status: 400 }
        );
      }

      let result;
      if (type === 'section') {
        // Create form section
        result = await createFormSection({
          ...data,
          createdBy: user.userId,
        });
      } else if (type === 'field') {
        // Create field
        result = await createFieldConfig({
          ...data,
          createdBy: user.userId,
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid type. Must be "section" or "field"' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: result,
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('[Field Config POST]', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create field configuration' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handler(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handler(req, user));
}
