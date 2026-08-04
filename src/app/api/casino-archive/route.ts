import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export interface ArchiveEntry {
  id: number;
  name: string;
  fee_type: string;
  fee_rate: number;
  fee_currency: string;
  archivedAt: string;
}

const ARCHIVE_KEY = 'casino_archive';

async function readArchive(): Promise<ArchiveEntry[]> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('v')
    .eq('k', ARCHIVE_KEY)
    .maybeSingle();
  if (!data?.v) return [];
  try { return JSON.parse(data.v); } catch { return []; }
}

async function writeArchive(entries: ArchiveEntry[]) {
  await supabaseAdmin
    .from('settings')
    .upsert({ k: ARCHIVE_KEY, v: JSON.stringify(entries) }, { onConflict: 'k' });
}

/** Arşivdeki casinoları listele */
export async function GET() {
  const entries = await readArchive();
  return NextResponse.json(entries);
}

/** Casino arşivle */
export async function POST(req: NextRequest) {
  const casino = await req.json();
  const entries = await readArchive();

  const existing = entries.findIndex((e) => e.id === casino.id);
  const entry: ArchiveEntry = {
    id: casino.id,
    name: casino.name,
    fee_type: casino.fee_type,
    fee_rate: casino.fee_rate,
    fee_currency: casino.fee_currency,
    archivedAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }

  await writeArchive(entries);
  return NextResponse.json({ ok: true });
}

/** Casino arşivden çıkar (geri yükle) */
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const entries = await readArchive();
  await writeArchive(entries.filter((e) => e.id !== id));
  return NextResponse.json({ ok: true });
}
