import { NextRequest, NextResponse } from 'next/server';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['read', 'create', 'update', 'delete', 'configure'],
  manager: ['read', 'create', 'update', 'validate'],
  analyst: ['read', 'create', 'update'],
  viewer: ['read'],
};

export function withAuth(handler: Function) {
  return async (req: NextRequest, context: any) => {
    // TODO: Verify JWT from Supabase
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user role from JWT
    const userRole = 'analyst'; // TODO: Decode JWT

    return handler(req, context, userRole);
  };
}

export function checkPermission(userRole: string, requiredAction: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredAction);
}
