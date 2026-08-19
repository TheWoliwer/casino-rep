import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

function formatCol(row: any) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    casino_id: Number(row.casino_id),
    amount: Number(row.amount) || 0,
    monthly: Number(row.monthly) ?? 1,
    sort_order: Number(row.sort_order) || 0,
  };
}

export async function GET() {
  try {
    const data = await query('SELECT * FROM casino_cols ORDER BY sort_order ASC');
    return NextResponse.json(data.map(formatCol));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { casino_id, name, amount, currency, monthly } = body;
    if (!casino_id || !name) return NextResponse.json({ error: 'casino_id ve name zorunlu' }, { status: 400 });

    const maxRow = await queryOne<{ max_order: number | null }>(
      'SELECT MAX(sort_order) as max_order FROM casino_cols WHERE casino_id = ?',
      [casino_id]
    );
    const sort_order = (maxRow?.max_order ?? 0) + 1;

    const result = await execute(
      'INSERT INTO casino_cols (casino_id, name, amount, currency, monthly, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [casino_id, name, Number(amount) || 0, currency || 'TRY', Number(monthly) ?? 1, sort_order]
    );

    const inserted = await queryOne('SELECT * FROM casino_cols WHERE id = ?', [result.insertId]);
    return NextResponse.json(formatCol(inserted));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

    await execute('DELETE FROM casino_cols WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
