import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export const runtime = 'edge';

const COOKIE = 'ct_session';

export async function POST() {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  });
  return res;
}
