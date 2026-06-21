import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('casino_cols')
    .select('*')
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { casino_id, name, amount, currency, monthly } = body;
  if (!casino_id || !name) return NextResponse.json({ error: 'casino_id ve name zorunlu' }, { status: 400 });

  const { data: maxRow } = await supabaseAdmin
    .from('casino_cols')
    .select('sort_order')
    .eq('casino_id', casino_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from('casino_cols')
    .insert({ casino_id, name, amount: amount || 0, currency: currency || 'TRY', monthly: monthly ?? 1, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const { error } = await supabaseAdmin.from('casino_cols').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
