import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  return NextResponse.json({ id: `client_${Date.now()}`, ...data }, { status: 201 });
}
