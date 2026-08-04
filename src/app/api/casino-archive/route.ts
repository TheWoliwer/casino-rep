import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'casino-archive.json');

export interface ArchiveEntry {
  id: number;
  name: string;
  fee_type: string;
  fee_rate: number;
  fee_currency: string;
  archivedAt: string;
}

async function readArchive(): Promise<ArchiveEntry[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeArchive(entries: ArchiveEntry[]) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf-8');
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

  // Zaten arşivdeyse güncelle
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
  const filtered = entries.filter((e) => e.id !== id);
  await writeArchive(filtered);
  return NextResponse.json({ ok: true });
}
