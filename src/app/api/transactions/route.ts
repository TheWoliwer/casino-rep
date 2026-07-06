import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const feeRowId = req.nextUrl.searchParams.get('fee_row_id');
  const casinoId = req.nextUrl.searchParams.get('casino_id');

  // Casino bazlı: casinonun tüm fee satırlarına ait işlemler (profil geçmişi)
  if (casinoId) {
    const { data: rows, error: rowsError } = await supabaseAdmin
      .from('fee_rows')
      .select('id')
      .eq('casino_id', casinoId);
    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });

    const ids = (rows ?? []).map(r => r.id);
    if (ids.length === 0) return NextResponse.json([]);

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .in('fee_row_id', ids)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

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
