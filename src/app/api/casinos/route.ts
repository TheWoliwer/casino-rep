import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('casinos')
    .select('*')
    .order('sort_order')
    .order('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, fee_type, fee_rate } = body;
  if (!name) return NextResponse.json({ error: 'İsim zorunlu' }, { status: 400 });

  const { data: maxRow } = await supabaseAdmin
    .from('casinos')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from('casinos')
    .insert({ name, fee_type: fee_type || 'percent', fee_rate: fee_rate || 0, sort_order })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
