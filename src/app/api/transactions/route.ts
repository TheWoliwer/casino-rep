import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

function formatTx(row: any) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    fee_row_id: Number(row.fee_row_id),
    paid_amount: Number(row.paid_amount) || 0,
  };
}

export async function GET(req: NextRequest) {
  try {
    const feeRowId = req.nextUrl.searchParams.get('fee_row_id');
    const casinoId = req.nextUrl.searchParams.get('casino_id');

    if (casinoId) {
      const rows = await query(
        `SELECT t.* 
         FROM transactions t
         INNER JOIN fee_rows f ON t.fee_row_id = f.id
         WHERE f.casino_id = ?
         ORDER BY t.created_at DESC`,
        [casinoId]
      );
      return NextResponse.json(rows.map(formatTx));
    }

    if (!feeRowId) return NextResponse.json([]);

    const rows = await query(
      'SELECT * FROM transactions WHERE fee_row_id = ? ORDER BY created_at DESC',
      [feeRowId]
    );
    return NextResponse.json(rows.map(formatTx));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fee_row_id, paid_amount, note } = body;

    const result = await execute(
      'INSERT INTO transactions (fee_row_id, paid_amount, note) VALUES (?, ?, ?)',
      [fee_row_id, Number(paid_amount) || 0, note || '']
    );

    const inserted = await queryOne('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    return NextResponse.json(formatTx(inserted));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
