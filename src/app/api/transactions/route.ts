import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const feeRowId = req.nextUrl.searchParams.get('fee_row_id');
  if (!feeRowId) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('fee_row_id', feeRowId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fee_row_id, paid_amount, note } = body;

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({ fee_row_id, paid_amount, note: note || '' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
