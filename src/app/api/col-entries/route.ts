import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

function formatEntry(row: any) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    col_id: Number(row.col_id),
    year: row.year !== null ? Number(row.year) : null,
    month: row.month !== null ? Number(row.month) : null,
    amount: row.amount !== null ? Number(row.amount) : null,
    status: Number(row.status) || 0,
  };
}

export async function GET(req: NextRequest) {
  try {
    const year = req.nextUrl.searchParams.get('year');
    let sql = 'SELECT * FROM col_entries WHERE 1=1';
    const params: any[] = [];

    if (year) {
      sql += ' AND year = ?';
      params.push(year);
    }

    const data = await query(sql, params);
    return NextResponse.json(data.map(formatEntry));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { col_id, year, month, amount, status, note } = body;

    const existing = await queryOne(
      'SELECT id FROM col_entries WHERE col_id = ? AND year = ? AND month = ? LIMIT 1',
      [col_id, year ?? null, month ?? null]
    );

    if (existing) {
      await execute(
        'UPDATE col_entries SET amount = ?, status = ?, note = ?, updated_at = NOW() WHERE id = ?',
        [amount !== null && amount !== undefined ? Number(amount) : null, status ?? 0, note || '', existing.id]
      );
      const updated = await queryOne('SELECT * FROM col_entries WHERE id = ?', [existing.id]);
      return NextResponse.json(formatEntry(updated));
    } else {
      const result = await execute(
        'INSERT INTO col_entries (col_id, year, month, amount, status, note, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [col_id, year ?? null, month ?? null, amount !== null && amount !== undefined ? Number(amount) : null, status ?? 0, note || '']
      );
      const inserted = await queryOne('SELECT * FROM col_entries WHERE id = ?', [result.insertId]);
      return NextResponse.json(formatEntry(inserted));
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });

    const allowed = ['amount', 'status', 'note'];
    const updateClauses: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        updateClauses.push(`\`${key}\` = ?`);
        if (key === 'amount') {
          values.push(updates[key] !== null ? Number(updates[key]) : null);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (updateClauses.length > 0) {
      updateClauses.push('updated_at = NOW()');
      values.push(id);
      await execute(`UPDATE col_entries SET ${updateClauses.join(', ')} WHERE id = ?`, values);
    }

    const row = await queryOne('SELECT * FROM col_entries WHERE id = ?', [id]);
    return NextResponse.json(formatEntry(row));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
