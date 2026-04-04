import { NextRequest, NextResponse } from 'next/server';

// Mock de Supabase pour démo
const evaluations: any[] = [];

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(evaluations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newEval = { id: `eval_${Date.now()}`, ...data, createdAt: new Date() };
    evaluations.push(newEval);
    return NextResponse.json(newEval, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 400 });
  }
}
