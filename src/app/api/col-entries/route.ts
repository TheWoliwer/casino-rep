import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year');
  let q = supabaseAdmin.from('col_entries').select('*');
  if (year) q = q.eq('year', year);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { col_id, year, month, amount, status, note } = body;

  const { data, error } = await supabaseAdmin
    .from('col_entries')
    .upsert(
      { col_id, year: year ?? null, month: month ?? null, amount: amount ?? null, status: status ?? 0, note: note || '', updated_at: new Date().toISOString() },
      { onConflict: 'col_id,year,month' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  const { data, error } = await supabaseAdmin
    .from('col_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
