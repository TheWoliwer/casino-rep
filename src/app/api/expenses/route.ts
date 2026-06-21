import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year  = searchParams.get('year');
  const month = searchParams.get('month');

  let query = supabaseAdmin.from('expenses').select('*, casinos(name)').order('created_at', { ascending: true });
  if (year)  query = query.eq('year', parseInt(year));
  if (month) query = query.eq('month', parseInt(month));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, amount, currency, year, month, note, casino_id } = body;

  if (!name || !amount || !year || !month) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({ name, amount, currency: currency || 'TRY', year, month, note: note || '', casino_id: casino_id || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const { error } = await supabaseAdmin.from('expenses').delete().eq('id', parseInt(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
