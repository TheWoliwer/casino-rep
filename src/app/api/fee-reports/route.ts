import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const { data, error } = await supabaseAdmin.from('fee_reports').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const { data, error } = await supabaseAdmin
    .from('fee_reports')
    .select('id, casino_id, year, month, created_at, data')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { casino_id, year, month, data } = body;
  const { data: result, error } = await supabaseAdmin
    .from('fee_reports')
    .insert({ casino_id, year, month, data })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: result.id });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, casino_id, year, month, data } = body;
  if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  const { data: result, error } = await supabaseAdmin
    .from('fee_reports')
    .update({ casino_id, year, month, data })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: result.id });
}
