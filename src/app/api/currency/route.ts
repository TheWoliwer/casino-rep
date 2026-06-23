import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // EUR baz alınır (Frankfurt API'nin native base'i) → daha güvenilir
    const res = await fetch('https://api.frankfurter.app/latest?base=EUR&symbols=TRY,USD', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    const tryPerEur = data.rates.TRY as number;  // 1 EUR = X TRY
    const usdPerEur = data.rates.USD as number;  // 1 EUR = X USD
    const tryPerUsd = tryPerEur / usdPerEur;      // 1 USD = X TRY (çapraz kur)

    return NextResponse.json({
      usd: tryPerUsd.toFixed(2),   // TRY per 1 USD
      eur: tryPerEur.toFixed(2),   // TRY per 1 EUR
    });
  } catch {
    return NextResponse.json({ usd: null, eur: null });
  }
}
