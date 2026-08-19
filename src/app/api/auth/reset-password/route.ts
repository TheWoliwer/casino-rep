import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/mysql';

export async function POST(req: NextRequest) {
  try {
    const { resetCode, newPassword } = await req.json();

    if (!resetCode || !newPassword) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Şifre en az 4 karakter olmalı' }, { status: 400 });
    }

    const expectedCode = process.env.RESET_CODE || '3636';
    if (resetCode !== expectedCode) {
      return NextResponse.json({ error: 'Reset kodu hatalı' }, { status: 401 });
    }

    await execute(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      ['password', newPassword]
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Şifre güncellenemedi: ' + error.message }, { status: 500 });
  }
}
