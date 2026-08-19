import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

function formatFeeReport(row: any) {
  if (!row) return null;
  if (typeof row.data === 'string') {
    try {
      row.data = JSON.parse(row.data);
    } catch {
      // keep as string
    }
  }
  return row;
}

export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (id) {
      const row = await queryOne('SELECT * FROM fee_reports WHERE id = ? LIMIT 1', [id]);
      if (!row) return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 });
      return NextResponse.json(formatFeeReport(row));
    }
    const rows = await query('SELECT id, casino_id, year, month, created_at, data FROM fee_reports ORDER BY created_at DESC');
    return NextResponse.json(rows.map(formatFeeReport));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { casino_id, year, month, data } = body;

    const dataJson = typeof data === 'object' ? JSON.stringify(data) : data;

    const result = await execute(
      'INSERT INTO fee_reports (casino_id, year, month, data) VALUES (?, ?, ?, ?)',
      [casino_id, year, month, dataJson]
    );

    return NextResponse.json({ id: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, casino_id, year, month, data } = body;
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    const dataJson = typeof data === 'object' ? JSON.stringify(data) : data;

    await execute(
      'UPDATE fee_reports SET casino_id = ?, year = ?, month = ?, data = ? WHERE id = ?',
      [casino_id, year, month, dataJson, id]
    );

    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
