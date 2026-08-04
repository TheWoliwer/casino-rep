import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSession, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  // 1. Önce env'den kontrol — anında, sıfır gecikme
  const envPassword = process.env.APP_PASSWORD;
  let ok = envPassword === password;

  // 2. Env eşleşmediyse Supabase'den çek (reset sonrası devreye girer)
  if (!ok) {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('v')
      .eq('k', 'password')
      .single();
    ok = !!data && data.v === password;
  }

  if (!ok) {
    return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 });
  }

  const token = await createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  return res;
}
