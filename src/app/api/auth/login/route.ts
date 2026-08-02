import { NextRequest, NextResponse } from 'next/server';
import { getCachedPassword } from '@/lib/password-cache';
import { createSession, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  // Cache'ten oku — ilk çağrıda Supabase'den çekip saklıyor,
  // sonraki isteklerde anında dönüyor (0 ms gecikme).
  const stored = await getCachedPassword();

  if (!stored || stored !== password) {
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
