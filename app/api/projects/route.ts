import { NextRequest, NextResponse } from 'next/server';
import { withAuth, hasMinimumRole } from '@/lib/auth-middleware';
import { ProjectService } from '@/lib/services/project-service';
import { paginationSchema } from '@/lib/validation-schemas';

/**
 * GET /api/projects - List all projects (paginated)
 */
async function handleGET(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const secteur = searchParams.get('secteur');

    const validated = paginationSchema.parse({ page, limit });

    const filters = {
      ...(status && { status }),
      ...(secteur && { secteur })
    };

    const result = await ProjectService.getAllProjects(validated.page, validated.limit, filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/projects - Create new project (analyst+)
 */
async function handlePOST(request: NextRequest, user: any) {
  try {
    if (!hasMinimumRole(user.role, 'analyst')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const project = await ProjectService.createProject(body, user.sub);

    return NextResponse.json(
      {
        id: project.id,
        nom: project.nom,
        status: project.status,
        createdAt: project.dateCreation
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handleGET(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handlePOST(req, user));
}
