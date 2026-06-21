import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?base=TRY&symbols=USD,EUR', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return NextResponse.json({
      usd: (1 / data.rates.USD).toFixed(2),
      eur: (1 / data.rates.EUR).toFixed(2),
    });
  } catch {
    return NextResponse.json({ usd: null, eur: null });
  }
}
