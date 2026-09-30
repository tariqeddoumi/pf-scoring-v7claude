import { NextRequest, NextResponse } from "next/server";
import { withAuth, hasMinimumRole, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import { ProjectService } from "@/lib/services/project-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id] - Get project by ID
 */
async function handleGET(request: NextRequest, user: AuthPayload, params: { id: string }) {
  try {
    const project = await ProjectService.getProjectById(params.id, user.userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PUT /api/projects/[id] - Update project (owner or admin)
 */
async function handlePUT(request: NextRequest, user: AuthPayload, params: { id: string }) {
  try {
    const project = await ProjectService.getProjectById(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Seuls le créateur et le super-administrateur pouvaient modifier un dossier :
    // le responsable des risques, qui doit pouvoir le corriger, recevait 403 alors
    // que l'interface lui proposait le bouton — la matrice de permissions lui accorde
    // « project: update ». L'API suit désormais cette matrice : chacun modifie ses
    // dossiers, et à partir du responsable des risques, ceux de tous.
    const peutModifier =
      hasPermission(user.role as UserRole, "project", "update") &&
      (project.creePar === user.userId ||
        hasMinimumRole(user.role as UserRole, "risk_manager"));

    if (!peutModifier) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de modifier ce projet" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updated = await ProjectService.updateProject(
      params.id,
      body,
      user.userId
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/projects/[id] - Delete project (owner or admin)
 */
async function handleDELETE(request: NextRequest, user: AuthPayload, params: { id: string }) {
  try {
    const project = await ProjectService.getProjectById(params.id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // La suppression suit la même règle, avec la permission correspondante : un
    // analyste ne supprime pas, même ses propres dossiers.
    const peutSupprimer =
      hasPermission(user.role as UserRole, "project", "delete") &&
      (project.creePar === user.userId ||
        hasMinimumRole(user.role as UserRole, "risk_manager"));

    if (!peutSupprimer) {
      return NextResponse.json(
        { error: "Vos droits ne permettent pas de supprimer ce projet" },
        { status: 403 }
      );
    }

    await ProjectService.deleteProject(params.id, user.userId);

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return withAuth(request, (req, user) =>
    handleDELETE(req, user, resolvedParams)
  );
}
