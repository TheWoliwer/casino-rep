import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/mysql';

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
  const row = await queryOne<{ v: string }>('SELECT v FROM settings WHERE k = ? LIMIT 1', [ARCHIVE_KEY]);
  if (!row?.v) return [];
  try {
    return JSON.parse(row.v);
  } catch {
    return [];
  }
}

async function writeArchive(entries: ArchiveEntry[]) {
  await execute(
    'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
    [ARCHIVE_KEY, JSON.stringify(entries)]
  );
}

/** Arşivdeki casinoları listele */
export async function GET() {
  try {
    const entries = await readArchive();
    return NextResponse.json(entries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Casino arşivle */
export async function POST(req: NextRequest) {
  try {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Casino arşivden çıkar (geri yükle) */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const entries = await readArchive();
    await writeArchive(entries.filter((e) => e.id !== id));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
