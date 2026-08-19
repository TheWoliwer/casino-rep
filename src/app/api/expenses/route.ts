import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/mysql';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const casinoId = searchParams.get('casino_id');

    let sql = `
      SELECT e.*, c.name as casino_name
      FROM expenses e
      LEFT JOIN casinos c ON e.casino_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (year) {
      sql += ' AND e.year = ?';
      params.push(parseInt(year));
    }
    if (month) {
      sql += ' AND e.month = ?';
      params.push(parseInt(month));
    }
    if (casinoId) {
      sql += ' AND e.casino_id = ?';
      params.push(parseInt(casinoId));
    }

    sql += ' ORDER BY e.created_at ASC';

    const rows = await query(sql, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount, currency, year, month, note, casino_id } = body;

    if (!name || !amount || !year || !month) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
    }

    const result = await execute(
      'INSERT INTO expenses (name, amount, currency, year, month, note, casino_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, amount, currency || 'TRY', year, month, note || '', casino_id || null]
    );

    const inserted = await queryOne('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

    await execute('DELETE FROM expenses WHERE id = ?', [parseInt(id)]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
