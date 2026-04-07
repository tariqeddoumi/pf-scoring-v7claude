import { NextRequest, NextResponse } from 'next/server';
import { withAuth, hasMinimumRole } from '@/lib/auth-middleware';
import { UserService } from '@/lib/services/user-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id] - Get user by ID
 */
async function handleGET(request: NextRequest, user: any, params: any) {
  try {
    if (!hasMinimumRole(user.role, 'manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetUser = await UserService.getUserById(params.id);

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: targetUser.id,
        email: targetUser.email,
        nom: targetUser.nom,
        prenom: targetUser.prenom,
        role: targetUser.role,
        avatar: targetUser.avatar,
        createdAt: targetUser.createdAt
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * PUT /api/users/[id] - Update user
 */
async function handlePUT(request: NextRequest, user: any, params: any) {
  try {
    // Can update own profile or be admin
    if (user.sub !== params.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedUser = await UserService.updateUser(params.id, body, user.sub);

    return NextResponse.json(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * DELETE /api/users/[id] - Delete user (admin only)
 */
async function handleDELETE(request: NextRequest, user: any, params: any) {
  try {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cannot delete self
    if (user.sub === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await UserService.deleteUser(params.id, user.sub);

    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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
  return withAuth(request, (req, user) => handleDELETE(req, user, resolvedParams));
}
