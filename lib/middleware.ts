import { NextRequest, NextResponse } from 'next/server';

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['read', 'create', 'update', 'delete', 'configure'],
  manager: ['read', 'create', 'update', 'validate'],
  analyst: ['read', 'create', 'update'],
  viewer: ['read'],
};

export function withAuth(handler: Function) {
  return async (req: NextRequest, context: any) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Extract Bearer token from Authorization header
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

      // Decode JWT payload (without verification for now - should use Supabase JWT secret)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

      // Extract user role from JWT payload - use 'analyst' as default if not specified
      const userRole = payload.role || payload.user_role || 'analyst';

      return handler(req, context, userRole);
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  };
}

export function checkPermission(userRole: string, requiredAction: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredAction);
}
