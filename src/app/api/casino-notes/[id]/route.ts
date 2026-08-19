import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/mysql';

export interface CasinoNote {
  notes?: string;
  updatedAt?: string;
}

function noteKey(id: string) {
  return `note_${id}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await queryOne<{ v: string }>('SELECT v FROM settings WHERE k = ? LIMIT 1', [noteKey(id)]);

    if (!row?.v) return NextResponse.json({});
    try {
      return NextResponse.json(JSON.parse(row.v));
    } catch {
      return NextResponse.json({ notes: row.v });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CasinoNote = await req.json();
    const payload: CasinoNote = { ...body, updatedAt: new Date().toISOString() };

    await execute(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      [noteKey(id), JSON.stringify(payload)]
    );

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
