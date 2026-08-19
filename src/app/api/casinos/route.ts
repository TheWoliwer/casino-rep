import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

export async function GET() {
  try {
    const data = await query('SELECT * FROM casinos ORDER BY sort_order ASC, id ASC');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, fee_type, fee_rate, fee_currency } = body;
    if (!name) return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 });

    const maxRow = await queryOne<{ max_order: number | null }>('SELECT MAX(sort_order) as max_order FROM casinos');
    const sort_order = (maxRow?.max_order ?? 0) + 1;

    const result = await execute(
      'INSERT INTO casinos (name, fee_type, fee_rate, fee_currency, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, fee_type || 'percent', fee_rate || 0, fee_currency || 'TRY', sort_order]
    );

    const insertedId = result.insertId;
    const inserted = await queryOne('SELECT * FROM casinos WHERE id = ?', [insertedId]);

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
