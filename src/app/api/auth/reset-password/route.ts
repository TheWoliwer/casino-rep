import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { resetCode, newPassword } = await req.json();

  if (!resetCode || !newPassword) {
    return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 });
  }

  if (newPassword.length < 4) {
    return NextResponse.json({ error: 'Şifre en az 4 karakter olmalı' }, { status: 400 });
  }

  const expectedCode = process.env.RESET_CODE;
  if (!expectedCode || resetCode !== expectedCode) {
    return NextResponse.json({ error: 'Reset kodu hatalı' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ k: 'password', v: newPassword }, { onConflict: 'k' });

  if (error) {
    return NextResponse.json({ error: 'Şifre güncellenemedi: ' + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
