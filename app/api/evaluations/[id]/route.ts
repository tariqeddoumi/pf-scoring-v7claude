import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Fetch from Supabase using prisma
    return NextResponse.json({ id: params.id, status: 'soumis' });
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    // TODO: Update in Supabase
    return NextResponse.json({ id: params.id, ...data, updatedAt: new Date() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Delete from Supabase
    return NextResponse.json({ success: true, deletedId: params.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 400 });
  }
}
