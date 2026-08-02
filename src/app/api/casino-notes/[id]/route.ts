import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'casino-notes.json');

async function readAll(): Promise<Record<string, CasinoNote>> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, CasinoNote>) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export interface CasinoNote {
  website?: string;
  phone?: string;
  contactName?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  updatedAt?: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const all = await readAll();
  return NextResponse.json(all[id] ?? {});
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body: CasinoNote = await req.json();
  const all = await readAll();
  all[id] = { ...body, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return NextResponse.json(all[id]);
}
