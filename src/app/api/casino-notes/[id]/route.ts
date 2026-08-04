import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface CasinoNote {
  notes?: string;
  updatedAt?: string;
}

// key formatı: note_{casinoId}
function noteKey(id: string) {
  return `note_${id}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('settings')
    .select('v')
    .eq('k', noteKey(id))
    .maybeSingle();

  if (!data?.v) return NextResponse.json({});
  try {
    return NextResponse.json(JSON.parse(data.v));
  } catch {
    return NextResponse.json({ notes: data.v });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: CasinoNote = await req.json();
  const payload: CasinoNote = { ...body, updatedAt: new Date().toISOString() };

  const { error } = await supabaseAdmin
    .from('settings')
    .upsert({ k: noteKey(id), v: JSON.stringify(payload) }, { onConflict: 'k' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(payload);
}
