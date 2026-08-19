import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

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
    return NextResponse.json(data);
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
        [amount ?? null, status ?? 0, note || '', existing.id]
      );
      const updated = await queryOne('SELECT * FROM col_entries WHERE id = ?', [existing.id]);
      return NextResponse.json(updated);
    } else {
      const result = await execute(
        'INSERT INTO col_entries (col_id, year, month, amount, status, note, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [col_id, year ?? null, month ?? null, amount ?? null, status ?? 0, note || '']
      );
      const inserted = await queryOne('SELECT * FROM col_entries WHERE id = ?', [result.insertId]);
      return NextResponse.json(inserted);
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
        values.push(updates[key]);
      }
    }

    if (updateClauses.length > 0) {
      updateClauses.push('updated_at = NOW()');
      values.push(id);
      await execute(`UPDATE col_entries SET ${updateClauses.join(', ')} WHERE id = ?`, values);
    }

    const row = await queryOne('SELECT * FROM col_entries WHERE id = ?', [id]);
    return NextResponse.json(row);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
