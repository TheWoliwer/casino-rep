import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year');
  let q = supabaseAdmin.from('fee_rows').select('*');
  if (year) q = q.eq('year', year);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { casino_id, year, month, turnover, fee_amount, paid_amount, status, note, debt_items } = body;

  const payload: Record<string, unknown> = {
    casino_id, year, month,
    turnover: turnover || 0,
    fee_amount: fee_amount || 0,
    paid_amount: paid_amount || 0,
    status: status ?? 0,
    note: note || '',
    debt_items: debt_items ?? [],
  };

  // Upsert — debt_items kolonu yoksa onsuz tekrar dene
  let upsertError = null;
  {
    const { error: e1 } = await supabaseAdmin
      .from('fee_rows')
      .upsert(payload, { onConflict: 'casino_id,year,month' });
    if (e1 && e1.message.includes('debt_items')) {
      const { debt_items: _di, ...payloadWithout } = payload;
      const { error: e2 } = await supabaseAdmin
        .from('fee_rows')
        .upsert(payloadWithout, { onConflict: 'casino_id,year,month' });
      upsertError = e2;
    } else {
      upsertError = e1;
    }
  }

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  // Her zaman SELECT ile güncel row'u getir (upsert her zaman data döndürmez)
  const { data, error: fetchError } = await supabaseAdmin
    .from('fee_rows')
    .select('*')
    .eq('casino_id', casino_id)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const { data, error } = await supabaseAdmin
    .from('fee_rows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const { error } = await supabaseAdmin.from('fee_rows').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
