import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma-client';

/**
 * GET /api/admin/configuration/[key]
 * Fetch specific configuration key
 */
async function handleGet(
  key: string
) {
  try {
    const config = await prisma.appConfiguration.findUnique({
      where: { key },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[CONFIG GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/configuration/[key]
 * Update configuration key (admin only)
 */
async function handlePut(
  request: NextRequest,
  key: string,
  user: any
) {
  try {
    const body = await request.json();
    const { value } = body;

    if (!value) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      );
    }

    // Get old value for history
    const oldConfig = await prisma.appConfiguration.findUnique({
      where: { key },
    });

    // Update configuration
    const config = await prisma.appConfiguration.update({
      where: { key },
      data: {
        value,
        updatedAt: new Date(),
        updatedBy: user.userId,
      },
    });

    // Record in history
    await prisma.appConfigHistory.create({
      data: {
        key,
        oldValue: oldConfig?.value,
        newValue: value,
        changedBy: user.userId,
        changedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('[CONFIG PUT]', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Configuration key not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  return handleGet(key);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  return withAdminAuth(request, (req, user) =>
    handlePut(req, key, user)
  );
}
