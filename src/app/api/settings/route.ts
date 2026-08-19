import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/mysql';

export async function GET() {
  try {
    const data = await query('SELECT * FROM settings');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    await execute(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      [key, value]
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
