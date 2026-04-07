import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export interface AuthPayload {
  sub: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

export async function authenticateRequest(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}

export async function withAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: AuthPayload
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return handler(request, user);
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (
    request: NextRequest,
    user: AuthPayload
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (req, user) => {
    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, user);
  });
}

export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1
};

export function hasMinimumRole(userRole: string, minimumRole: string): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}
