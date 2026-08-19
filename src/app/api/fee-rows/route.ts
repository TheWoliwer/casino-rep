import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

function formatFeeRow(row: any) {
  if (!row) return null;
  if (typeof row.debt_items === 'string') {
    try {
      row.debt_items = JSON.parse(row.debt_items);
    } catch {
      row.debt_items = [];
    }
  } else if (!row.debt_items) {
    row.debt_items = [];
  }
  return row;
}

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get('year');
    const casinoId = req.nextUrl.searchParams.get('casino_id');

    let sql = 'SELECT * FROM fee_rows WHERE 1=1';
    const params: any[] = [];

    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }
    if (casinoId) {
      sql += ' AND casino_id = ?';
      params.push(casinoId);
    }

    sql += ' ORDER BY id ASC';

    const rows = await query(sql, params);
    return NextResponse.json(rows.map(formatFeeRow));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { casino_id, year, month, turnover, fee_amount, paid_amount, status, note, debt_items } = body;

    const debtJson = JSON.stringify(debt_items ?? []);

    await execute(
      `INSERT INTO fee_rows (casino_id, year, month, turnover, fee_amount, paid_amount, status, note, debt_items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         turnover = VALUES(turnover),
         fee_amount = VALUES(fee_amount),
         paid_amount = VALUES(paid_amount),
         status = VALUES(status),
         note = VALUES(note),
         debt_items = VALUES(debt_items)`,
      [
        casino_id,
        year,
        month,
        turnover || 0,
        fee_amount || 0,
        paid_amount || 0,
        status ?? 0,
        note || '',
        debtJson,
      ]
    );

    const updated = await queryOne(
      'SELECT * FROM fee_rows WHERE casino_id = ? AND year = ? AND month = ? LIMIT 1',
      [casino_id, year, month]
    );

    return NextResponse.json(formatFeeRow(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

    const allowed = ['turnover', 'fee_amount', 'paid_amount', 'status', 'note', 'debt_items'];
    const updateClauses: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        updateClauses.push(`\`${key}\` = ?`);
        if (key === 'debt_items' && typeof updates[key] === 'object') {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (updateClauses.length > 0) {
      values.push(id);
      await execute(`UPDATE fee_rows SET ${updateClauses.join(', ')} WHERE id = ?`, values);
    }

    const row = await queryOne('SELECT * FROM fee_rows WHERE id = ?', [id]);
    return NextResponse.json(formatFeeRow(row));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

    await execute('DELETE FROM fee_rows WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
