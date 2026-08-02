'use client';
import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Casino, FeeRow, Transaction, CasinoCol, ColEntry, Expense } from '@/lib/supabase';
import FeeModal from '@/components/FeeModal';

interface Props {
  casino: Casino;
  onClose: () => void;
  onSaved?: () => void; // profil içinden düzenleme yapılırsa dashboard'ı tazelemek için
}

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(d: string) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Tab = 'table' | 'timeline' | 'monthly' | 'stats' | 'cols' | 'expenses' | 'bilgiler' | 'notlar';

type HistoryEvent = {
  key: string;
  kind: 'entry' | 'payment';
  date: string | null;
  amount: number; // TRY
  note: string;
  month: number;
  year: number;
  rowId: number | null; // ilgili fee satırı
  txId: number | null;  // ödeme işlemi
};

export default function CasinoProfileModal({ casino, onClose, onSaved }: Props) {
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cols, setCols] = useState<CasinoCol[]>([]);
  const [colEntries, setColEntries] = useState<ColEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null);

  const [tab, setTab] = useState<Tab>('table');
  const [editMonth, setEditMonth] = useState<number | null>(null);

  // Hareketler filtreleri
  const [typeFilter, setTypeFilter] = useState<'all' | 'payment' | 'entry'>('all');
  const [yearFilter, setYearFilter] = useState(0); // 0 = tümü
  const [searchQ, setSearchQ] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // AÜlık detay
  const [detailYear, setDetailYear] = useState(new Date().getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  // ── Casino Bilgileri düzenle ──
  const [editName, setEditName]           = useState(casino.name);
  const [editFeeType, setEditFeeType]     = useState<'percent' | 'fixed' | 'none'>(casino.fee_type);
  const [editFeeRate, setEditFeeRate]     = useState(String(casino.fee_rate ?? ''));
  const [editFeeCur, setEditFeeCur]       = useState(casino.fee_currency || 'TRY');
  const [editSaving, setEditSaving]       = useState(false);
  const [editSaved, setEditSaved]         = useState(false);
  const [editError, setEditError]         = useState('');

  // ── Notlar (JSON dosyasına kaydedilir) ──
  const [notes, setNotes]                 = useState('');
  const [notesLoading, setNotesLoading]   = useState(false);
  const [notesSaving, setNotesSaving]     = useState(false);
  const [notesSaved, setNotesSaved]       = useState(false);
  const [notesError, setNotesError]       = useState('');
  const [notesDraft, setNotesDraft]       = useState(''); // edit draft
  const [notesEditing, setNotesEditing]   = useState(false);
  const [lastUpdated, setLastUpdated]     = useState<string | null>(null);

  const fetchAll = useCallback(async (silent: boolean) => {
    if (!silent) { setLoading(true); setError(''); }
    try {
      const [f, t, cc, ce, ex] = await Promise.all([
        fetch(`/api/fee-rows?casino_id=${casino.id}`).then(r => r.json()),
        fetch(`/api/transactions?casino_id=${casino.id}`).then(r => r.json()),
        fetch('/api/casino-cols').then(r => r.json()),
        fetch('/api/col-entries').then(r => r.json()),
        fetch(`/api/expenses?casino_id=${casino.id}`).then(r => r.json()),
      ]);
      setFeeRows(Array.isArray(f) ? f : []);
      setTransactions(Array.isArray(t) ? t : []);
      const myCols = (Array.isArray(cc) ? cc : []).filter((c: CasinoCol) => c.casino_id === casino.id);
      setCols(myCols);
      const colIds = new Set(myCols.map((c: CasinoCol) => c.id));
      setColEntries((Array.isArray(ce) ? ce : []).filter((e: ColEntry) => colIds.has(e.col_id)));
      setExpenses(Array.isArray(ex) ? ex : []);
    } catch {
      if (!silent) setError('Geçmiş yüklenemedi');
    }
    if (!silent) setLoading(false);
  }, [casino.id]);

  useEffect(() => { fetchAll(false); }, [fetchAll]);

  // Notlar sekmesi açıldığında JSON'dan yükle
  useEffect(() => {
    if (tab !== 'notlar') return;
    setNotesLoading(true);
    fetch(`/api/casino-notes/${casino.id}`)
      .then(r => r.json())
      .then(d => {
        setNotes(d.notes ?? '');
        setNotesDraft(d.notes ?? '');
        setLastUpdated(d.updatedAt ?? null);
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, [tab, casino.id]);

  async function saveNotes() {
    setNotesSaving(true);
    setNotesError('');
    try {
      await fetch(`/api/casino-notes/${casino.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft }),
      });
      setNotes(notesDraft);
      setNotesEditing(false);
      setNotesSaved(true);
      setLastUpdated(new Date().toISOString());
      setTimeout(() => setNotesSaved(false), 2500);
    } catch {
      setNotesError('Kaydedilemedi, tekrar dene.');
    } finally {
      setNotesSaving(false);
    }
  }

  async function saveCasinoInfo() {
    if (!editName.trim()) { setEditError('Casino adı boş olamaz'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/casinos/${casino.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          fee_type: editFeeType,
          fee_rate: parseFloat(editFeeRate) || 0,
          fee_currency: editFeeType === 'fixed' ? editFeeCur : 'TRY',
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Hata'); }
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 2500);
      onSaved?.();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setEditSaving(false);
    }
  }

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      const usd = parseFloat(d.usd);
      const eur = parseFloat(d.eur);
      if (usd > 0) setRates({ usd, eur: eur > 0 ? eur : usd });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      // Üstte FeeModal açıkken Esc profili kapatmasın (onu FeeModal yakalar)
      if (e.key === 'Escape' && editMonth === null) onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, editMonth]);

  const toUSD = (n: number) => rates ? n / rates.usd : n;
  const toTRY = (amount: number, currency: string) => {
    if (!rates) return amount;
    if (currency === 'USD' || currency === 'CRYPTO') return amount * rates.usd;
    if (currency === 'EUR') return amount * rates.eur;
    return amount;
  };

  // ── Genel özet (tüm zamanlar) ──
  const expected    = feeRows.reduce((s, r) => s + (r.turnover ?? 0), 0);
  const collected   = feeRows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const outstanding = Math.max(0, expected - collected);
  const rate        = expected > 0 ? Math.min(100, (collected / expected) * 100) : 0;

  // ── Hareket listesi ──
  const rowById = new Map(feeRows.map(r => [r.id, r]));
  const allEvents: HistoryEvent[] = [
    ...feeRows
      .filter(r => (r.turnover ?? 0) > 0 || (r.paid_amount ?? 0) > 0)
      .map((r): HistoryEvent => ({
        key: `entry-${r.id}`, kind: 'entry',
        date: r.created_at ?? null,
        amount: r.turnover ?? 0,
        note: r.note || '',
        month: r.month, year: r.year,
        rowId: r.id, txId: null,
      })),
    ...transactions.map((t): HistoryEvent => {
      const row = rowById.get(t.fee_row_id);
      return {
        key: `tx-${t.id}`, kind: 'payment',
        date: t.created_at ?? null,
        amount: t.paid_amount ?? 0,
        note: t.note || '',
        month: row?.month ?? 0, year: row?.year ?? 0,
        rowId: row?.id ?? null, txId: t.id,
      };
    }),
  ].sort((a, b) => {
    if (!a.date && !b.date) return (b.year - a.year) || (b.month - a.month);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const eventYears = Array.from(new Set(allEvents.map(e => e.year).filter(y => y > 0))).sort((a, b) => b - a);

  const q = searchQ.trim().toLocaleLowerCase('tr');
  const filteredEvents = allEvents.filter(ev => {
    if (typeFilter !== 'all' && ev.kind !== typeFilter) return false;
    if (yearFilter !== 0 && ev.year !== yearFilter) return false;
    if (q && !ev.note.toLocaleLowerCase('tr').includes(q)) return false;
    return true;
  });

  // Ay başlıklı gruplama — hareket tarihine göre (tarihsizler dönemine göre)
  type EventGroup = { key: string; label: string; sortVal: number; events: HistoryEvent[] };
  const groupMap = new Map<string, EventGroup>();
  for (const ev of filteredEvents) {
    let gy: number, gm: number;
    if (ev.date) {
      const d = new Date(ev.date);
      gy = d.getFullYear(); gm = d.getMonth() + 1;
    } else {
      gy = ev.year; gm = ev.month;
    }
    const key = `${gy}-${gm}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, label: `${MONTHS[gm] ?? '?'} ${gy}`, sortVal: gy * 12 + gm, events: [] });
    }
    groupMap.get(key)!.events.push(ev);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => b.sortVal - a.sortVal);

  // ── İstatistikler ──
  const activeRows  = feeRows.filter(r => (r.turnover ?? 0) > 0 || (r.paid_amount ?? 0) > 0);
  const avgDebt     = activeRows.length ? expected / activeRows.length : 0;
  const avgPaid     = activeRows.length ? collected / activeRows.length : 0;
  const maxDebtRow  = activeRows.reduce<FeeRow | null>((m, r) => (!m || (r.turnover ?? 0) > (m.turnover ?? 0)) ? r : m, null);
  const maxPaidRow  = activeRows.reduce<FeeRow | null>((m, r) => (!m || (r.paid_amount ?? 0) > (m.paid_amount ?? 0)) ? r : m, null);
  const lastPayment = transactions.length > 0 ? transactions[0] : null;

  const fullPaid = activeRows.filter(r => (r.turnover ?? 0) > 0 && (r.paid_amount ?? 0) >= (r.turnover ?? 0)).length;
  const partial  = activeRows.filter(r => (r.turnover ?? 0) > 0 && (r.paid_amount ?? 0) > 0 && (r.paid_amount ?? 0) < (r.turnover ?? 0)).length;
  const unpaid   = activeRows.filter(r => (r.turnover ?? 0) > 0 && (r.paid_amount ?? 0) === 0).length;

  // Trend: son 3 dönem vs önceki 3 dönem tahsilatı
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const idxOf = (r: FeeRow) => r.year * 12 + (r.month - 1);
  const last3 = feeRows.filter(r => idxOf(r) >= nowIdx - 2 && idxOf(r) <= nowIdx).reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const prev3 = feeRows.filter(r => idxOf(r) >= nowIdx - 5 && idxOf(r) <= nowIdx - 3).reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const trendPct = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : null;

  // ── Aylık detay ──
  const feeYears = Array.from(new Set([...feeRows.map(r => r.year), new Date().getFullYear()])).sort((a, b) => b - a);
  const yearRows = MONTHS.slice(1).map((_, i) => {
    const m = i + 1;
    const row = feeRows.find(r => r.year === detailYear && r.month === m) ?? null;
    return { month: m, row };
  });
  const yearTotals = yearRows.reduce((s, { row }) => ({
    debt: s.debt + (row?.turnover ?? 0),
    paid: s.paid + (row?.paid_amount ?? 0),
  }), { debt: 0, paid: 0 });

  // ── Aylık kalem matrisi (Tablo sekmesi) ──
  const norm = (s: string) => s.trim().toLocaleUpperCase('tr');
  const isFeeName = (s: string) => { const n = norm(s); return n === 'BORÇ' || n.includes('FEE'); };
  const feeLabel = casino.fee_type === 'percent' ? `FEE %${casino.fee_rate}` : casino.fee_type === 'fixed' ? 'FEE (SABİT)' : 'BORÇ';

  const matrixRows = MONTHS.slice(1).map((_, i) => {
    const m = i + 1;
    return { month: m, row: feeRows.find(r => r.year === detailYear && r.month === m) ?? null };
  });

  // Kolonlar: seçili yıldaki borç kalemi adlarının birleşimi (FEE/BORÇ hariç — o ayrı kolonda)
  const itemColumns: string[] = [];
  for (const { row } of matrixRows) {
    for (const it of row?.debt_items ?? []) {
      if (isFeeName(it.name)) continue;
      const n = norm(it.name);
      if (!itemColumns.includes(n)) itemColumns.push(n);
    }
  }

  type CellData = { amount: number; paid: number; currency: string } | null;

  function feeCellOf(row: FeeRow | null): CellData {
    if (!row) return null;
    const items = row.debt_items ?? [];
    if (items.length === 0) {
      if ((row.turnover ?? 0) === 0 && (row.paid_amount ?? 0) === 0) return null;
      return { amount: row.turnover ?? 0, paid: row.paid_amount ?? 0, currency: 'TRY' };
    }
    const fi = items.filter(it => isFeeName(it.name));
    if (fi.length === 0) return null;
    return {
      amount: fi.reduce((s, it) => s + it.amount, 0),
      paid: fi.reduce((s, it) => s + (it.paid_amount ?? (it.paid ? it.amount : 0)), 0),
      currency: fi[0].currency,
    };
  }

  function itemCellOf(row: FeeRow | null, colName: string): CellData {
    const its = (row?.debt_items ?? []).filter(it => !isFeeName(it.name) && norm(it.name) === colName);
    if (its.length === 0) return null;
    return {
      amount: its.reduce((s, it) => s + it.amount, 0),
      paid: its.reduce((s, it) => s + (it.paid_amount ?? (it.paid ? it.amount : 0)), 0),
      currency: its[0].currency,
    };
  }

  function columnTotalTRY(cellOf: (row: FeeRow | null) => CellData) {
    return matrixRows.reduce((acc, { row }) => {
      const c = cellOf(row);
      if (c) { acc.amt += toTRY(c.amount, c.currency); acc.paid += toTRY(c.paid, c.currency); }
      return acc;
    }, { amt: 0, paid: 0 });
  }
  const feeColTotal = columnTotalTRY(feeCellOf);
  const itemColTotals = itemColumns.map(name => columnTotalTRY(row => itemCellOf(row, name)));

  const fmtAmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const curSym = (c: string) => c === 'TRY' ? '₺' : c === 'EUR' ? '€' : c === 'USD' ? '$' : c;

  function MatrixCell({ cell }: { cell: CellData }) {
    if (!cell || cell.amount === 0) return <span className="text-slate-700">—</span>;
    const done = cell.paid >= cell.amount;
    const some = cell.paid > 0;
    return (
      <div>
        <p className="font-semibold text-white whitespace-nowrap">{fmtAmt(cell.amount)} {curSym(cell.currency)}</p>
        <p className="text-[9px] font-bold tracking-wide" style={{ color: done ? 'var(--success-strong)' : some ? 'var(--accent)' : 'var(--danger-strong)' }}>
          {done ? 'ALINDI' : some ? 'KISMİ' : 'ALINMADI'}
        </p>
      </div>
    );
  }

  // ── Giderler ──
  const totalExpensesTRY = expenses.reduce((s, e) => s + toTRY(e.amount ?? 0, e.currency || 'TRY'), 0);
  const netProfit = collected - totalExpensesTRY;
  const sortedExpenses = [...expenses].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));

  function statusInfo(row: FeeRow | null): { label: string; cls: string } {
    if (!row || ((row.turnover ?? 0) === 0 && (row.paid_amount ?? 0) === 0)) return { label: '—', cls: 'text-slate-600' };
    const t = row.turnover ?? 0, p = row.paid_amount ?? 0;
    if (t > 0 && p >= t) return { label: 'ALINDI', cls: 'bg-green-500/20 text-green-400' };
    if (p > 0) return { label: 'KISMİ', cls: 'bg-amber-500/20 text-amber-400' };
    return { label: 'ALINMADI', cls: 'bg-red-500/20 text-red-400' };
  }

  // ── Excel ekstre ──
  function exportExcel() {
    const wb = XLSX.utils.book_new();

    // Tablo görünümü (seçili yıl) — ekrandaki matrisin aynısı
    const cellStatus = (c: { amount: number; paid: number } | null) =>
      !c || c.amount === 0 ? '' : c.paid >= c.amount ? 'ALINDI' : c.paid > 0 ? 'KISMİ' : 'ALINMADI';
    const tableData = matrixRows.map(({ month: m, row }) => {
      const rec: Record<string, string | number> = { 'Ay': MONTHS[m] };
      const fc = feeCellOf(row);
      rec[feeLabel] = fc && fc.amount > 0 ? `${fmtAmt(fc.amount)} ${curSym(fc.currency)}` : '';
      rec[`${feeLabel} DURUM`] = cellStatus(fc);
      for (const name of itemColumns) {
        const c = itemCellOf(row, name);
        rec[name] = c && c.amount > 0 ? `${fmtAmt(c.amount)} ${curSym(c.currency)}` : '';
        rec[`${name} DURUM`] = cellStatus(c);
      }
      return rec;
    });
    const wsTable = XLSX.utils.json_to_sheet(tableData);
    wsTable['!cols'] = [{ wch: 9 }, ...Array((itemColumns.length + 1) * 2).fill({ wch: 14 })];
    XLSX.utils.book_append_sheet(wb, wsTable, `Tablo ${detailYear}`);

    // Özet sayfası
    const summaryData: Record<string, string | number>[] = [
      { 'Alan': 'Casino', 'Değer (TRY)': casino.name, 'Değer (USD)': '' },
      { 'Alan': 'Beklenen (tüm zamanlar)', 'Değer (TRY)': expected, 'Değer (USD)': rates ? +toUSD(expected).toFixed(2) : '' },
      { 'Alan': 'Tahsil Edilen', 'Değer (TRY)': collected, 'Değer (USD)': rates ? +toUSD(collected).toFixed(2) : '' },
      { 'Alan': 'Bekleyen', 'Değer (TRY)': outstanding, 'Değer (USD)': rates ? +toUSD(outstanding).toFixed(2) : '' },
      { 'Alan': 'Tahsilat Oranı', 'Değer (TRY)': `%${rate.toFixed(1)}`, 'Değer (USD)': '' },
      { 'Alan': 'Toplam Gider', 'Değer (TRY)': +totalExpensesTRY.toFixed(2), 'Değer (USD)': rates ? +toUSD(totalExpensesTRY).toFixed(2) : '' },
      { 'Alan': 'Net (Tahsilat − Gider)', 'Değer (TRY)': +netProfit.toFixed(2), 'Değer (USD)': rates ? +toUSD(netProfit).toFixed(2) : '' },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');

    // Aylık detay — tüm yıllar
    const monthlyData = [...feeRows]
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .map(r => {
        const os = Math.max(0, (r.turnover ?? 0) - (r.paid_amount ?? 0));
        return {
          'Yıl': r.year, 'Ay': MONTHS[r.month],
          'Borç (TRY)': r.turnover ?? 0,
          'Ödenen (TRY)': r.paid_amount ?? 0,
          'Kalan (TRY)': os,
          'Durum': statusInfo(r).label,
          'Not': r.note || '',
        };
      });
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
    wsMonthly['!cols'] = [{ wch: 6 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Aylık Detay');

    // Hareketler
    const eventData = allEvents.map(ev => ({
      'Tarih': ev.date ? formatDate(ev.date) : '',
      'Tür': ev.kind === 'payment' ? 'Ödeme' : 'Borç Girişi',
      'Dönem': ev.month > 0 ? `${MONTHS[ev.month]} ${ev.year}` : '',
      'Tutar (TRY)': ev.amount,
      'Not': ev.note || '',
    }));
    const wsEvents = XLSX.utils.json_to_sheet(eventData);
    wsEvents['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Hareketler');

    // Giderler
    if (expenses.length > 0) {
      const expData = sortedExpenses.map(e => ({
        'Yıl': e.year, 'Ay': MONTHS[e.month],
        'Gider': e.name,
        'Tutar': e.amount,
        'Para Birimi': e.currency || 'TRY',
        'Tutar (TRY)': +toTRY(e.amount ?? 0, e.currency || 'TRY').toFixed(2),
        'Not': e.note || '',
      }));
      const wsExp = XLSX.utils.json_to_sheet(expData);
      wsExp['!cols'] = [{ wch: 6 }, { wch: 9 }, { wch: 20 }, { wch: 12 }, { wch: 11 }, { wch: 14 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsExp, 'Giderler');
    }

    XLSX.writeFile(wb, `${casino.name}-profil-ekstre.xlsx`);
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'table',    label: '📊 Tablo' },
    { id: 'timeline', label: '🧾 Hareketler' },
    { id: 'monthly',  label: '📅 Aylık Detay' },
    { id: 'stats',    label: '📈 İstatistik' },
    { id: 'cols',     label: '📌 Özel Kalemler' },
    { id: 'expenses', label: '💸 Giderler' },
    { id: 'bilgiler', label: '⚙️ Bilgiler' },
    { id: 'notlar',   label: '📝 Notlar' },
  ];

  const chipStyle = (active: boolean) => active
    ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' }
    : { background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border-accent)' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose} style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full rounded-t-2xl sm:rounded-xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', maxHeight: '94vh', maxWidth: 'min(96vw, 1400px)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
              👤
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">{casino.name}</h2>
              <p className="text-xs text-slate-400">
                Profil · Hareket Geçmişi
                <span className="text-slate-600"> · </span>
                {casino.fee_type === 'percent' ? `%${casino.fee_rate}` : casino.fee_type === 'fixed' ? 'Sabit' : 'Fee yok'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xl flex-shrink-0">×</button>
        </div>

        {/* Genel özet — sabit üst alan */}
        <div className="px-4 sm:px-5 py-3 border-b flex-shrink-0 space-y-2.5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Beklenen',      try: expected,    color: 'var(--text-muted)' },
              { label: 'Tahsil Edilen', try: collected,   color: collected > 0 ? 'var(--success)' : '#475569' },
              { label: 'Bekleyen',      try: outstanding, color: outstanding > 0 ? 'var(--danger)' : 'var(--success)' },
            ].map(c => (
              <div key={c.label} className="rounded-xl py-2 px-2 text-center" style={{ background: 'var(--bg-base)' }}>
                <p className="text-[10px] text-slate-500 mb-0.5">{c.label}</p>
                <p className="text-sm font-bold leading-tight" style={{ color: c.color }}>${fmtUSD(toUSD(c.try))}</p>
                <p className="text-[10px] text-slate-600 leading-tight">₺{fmt(c.try)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tüm zamanlar tahsilat oranı</span>
              <span className="font-bold" style={{ color: rate >= 100 ? 'var(--success)' : rate > 50 ? 'var(--accent)' : 'var(--danger)' }}>
                %{rate.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-accent)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${rate}%`, background: rate >= 100 ? '#22c55e' : rate > 50 ? 'var(--accent)' : '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex items-center gap-1 px-3 sm:px-4 pt-2 border-b flex-shrink-0 overflow-x-auto"
          style={{ borderColor: 'var(--border-color)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px"
              style={tab === t.id
                ? { color: 'var(--accent)', borderColor: 'var(--accent)' }
                : { color: 'var(--text-dim)', borderColor: 'transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <p className="text-slate-500 text-sm animate-pulse text-center py-8">Yükleniyor...</p>
          ) : error ? (
            <p className="text-red-400 text-sm text-center py-8">Hata: {error}</p>
          ) : (
            <>
              {/* ═══ TABLO (Excel görünümü) ═══ */}
              {tab === 'table' && (
                <div className="space-y-3">
                  {/* Yıl seçici */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {feeYears.map(y => (
                      <button key={y} onClick={() => setDetailYear(y)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={detailYear === y
                          ? { background: 'var(--accent)', color: 'var(--accent-contrast)' }
                          : { background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border-accent)' }}>
                        {y}
                      </button>
                    ))}
                    <span className="text-[10px] text-slate-600 ml-auto hidden sm:block">Satıra tıklayarak o ayı düzenleyebilirsin</span>
                  </div>

                  <div className="rounded-xl border" style={{ borderColor: 'var(--border-accent)', overflow: 'auto', maxHeight: '58vh' }}>
                    <table className="w-full text-xs border-collapse" style={{ minWidth: 200 + (itemColumns.length + 1) * 130 }}>
                      <thead className="sticky top-0 z-20">
                        <tr style={{ background: 'var(--bg-card)' }}>
                          <th className="px-2 py-2.5 text-left text-[10px] font-bold text-amber-400 uppercase tracking-wider sticky left-0 z-30"
                            style={{ background: 'var(--bg-card)', borderRight: '2px solid var(--border-accent)', boxShadow: '0 1px 0 var(--border-accent)', width: 76, minWidth: 76 }}>
                            {detailYear}
                          </th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-300 uppercase tracking-wider border-r"
                            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 1px 0 var(--border-accent)' }}>
                            {feeLabel}
                          </th>
                          {itemColumns.map(name => (
                            <th key={name} className="px-3 py-2.5 text-right text-[10px] font-bold text-slate-300 uppercase tracking-wider border-r"
                              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 1px 0 var(--border-accent)' }}>
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map(({ month: m, row }, i) => {
                          const rowBg = i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)';
                          return (
                            <tr key={m}
                              onClick={() => setEditMonth(m)}
                              className="cursor-pointer transition-colors hover:bg-white/5"
                              style={{ background: rowBg, borderTop: '1px solid var(--border-color)' }}>
                              <td className="px-2 py-2.5 font-semibold text-white uppercase sticky left-0 z-10 whitespace-nowrap"
                                style={{ background: rowBg, borderRight: '2px solid var(--border-accent)', width: 76, minWidth: 76 }}>
                                {MONTHS[m]}
                              </td>
                              <td className="px-3 py-2 text-right border-r" style={{ borderColor: 'var(--border-color)' }}>
                                <MatrixCell cell={feeCellOf(row)} />
                              </td>
                              {itemColumns.map(name => (
                                <td key={name} className="px-3 py-2 text-right border-r" style={{ borderColor: 'var(--border-color)' }}>
                                  <MatrixCell cell={itemCellOf(row, name)} />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-20">
                        <tr style={{ background: 'var(--bg-card)' }}>
                          <td className="px-2 py-2.5 text-[10px] font-bold text-white uppercase tracking-wider sticky left-0 z-30 whitespace-nowrap"
                            style={{ background: 'var(--bg-card)', borderRight: '2px solid var(--border-accent)', boxShadow: '0 -2px 0 var(--border-accent)', width: 76, minWidth: 76 }}>
                            TOPLAM (₺)
                          </td>
                          {[feeColTotal, ...itemColTotals].map((t, ti) => (
                            <td key={ti} className="px-3 py-2 text-right border-r"
                              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 -2px 0 var(--border-accent)' }}>
                              {t.amt > 0 ? (
                                <p className="font-bold text-white whitespace-nowrap">₺{fmt(t.amt)}</p>
                              ) : (
                                <span className="text-slate-700">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {itemColumns.length === 0 && matrixRows.every(({ row }) => !feeCellOf(row)) && (
                    <p className="text-center text-slate-600 text-xs py-4">
                      {detailYear} yılında kayıt yok. Satıra tıklayıp borç girişi yapabilirsin.
                    </p>
                  )}
                </div>
              )}

              {/* ═══ HAREKETLER ═══ */}
              {tab === 'timeline' && (
                <div className="space-y-3">
                  {/* Filtre çipleri */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {([['all', 'Tümü'], ['payment', '💰 Ödemeler'], ['entry', '📝 Borç Girişleri']] as const).map(([v, l]) => (
                      <button key={v} onClick={() => setTypeFilter(v)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95"
                        style={chipStyle(typeFilter === v)}>
                        {l}
                      </button>
                    ))}
                    <span className="w-px h-4 mx-1" style={{ background: 'var(--border-accent)' }} />
                    <button onClick={() => setYearFilter(0)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={chipStyle(yearFilter === 0)}>
                      Tüm Yıllar
                    </button>
                    {eventYears.map(y => (
                      <button key={y} onClick={() => setYearFilter(y)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all active:scale-95"
                        style={chipStyle(yearFilter === y)}>
                        {y}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder="🔍 Not içinde ara..."
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  />

                  {groups.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-slate-500 text-sm">Filtreye uyan hareket yok.</p>
                    </div>
                  ) : (
                    groups.map(g => {
                      const gPaid = g.events.filter(e => e.kind === 'payment').reduce((s, e) => s + e.amount, 0);
                      const gDebt = g.events.filter(e => e.kind === 'entry').reduce((s, e) => s + e.amount, 0);
                      return (
                        <div key={g.key}>
                          {/* Ay başlığı */}
                          <div className="flex items-center justify-between px-1 py-1.5 sticky top-0 z-10"
                            style={{ background: 'var(--bg-surface)' }}>
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{g.label}</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              {gDebt > 0 && <span className="text-slate-500">Borç: ₺{fmt(gDebt)}</span>}
                              {gPaid > 0 && <span className="text-green-400 font-semibold">Tahsilat: +₺{fmt(gPaid)}</span>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {g.events.map(ev => {
                              const isPayment = ev.kind === 'payment';
                              const isOpen = expandedEvent === ev.key;
                              const evRow = ev.rowId != null ? rowById.get(ev.rowId) : undefined;
                              return (
                                <div key={ev.key} className="rounded-xl border overflow-hidden"
                                  style={{ background: 'var(--bg-base)', borderColor: isOpen ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border-accent)' }}>
                                  <button
                                    onClick={() => setExpandedEvent(isOpen ? null : ev.key)}
                                    className="w-full p-3 text-left transition-colors hover:bg-white/5">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                                          style={isPayment
                                            ? { background: 'rgba(34,197,94,0.12)', color: 'var(--success)' }
                                            : { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                                          {isPayment ? '💰' : '📝'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold" style={{ color: isPayment ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {isPayment ? 'Ödeme alındı' : 'Borç girişi yapıldı'}
                                          </p>
                                          <p className="text-xs text-slate-500 mt-0.5">
                                            {ev.month > 0 && <>{MONTHS[ev.month]} {ev.year} dönemi</>}
                                            {ev.month > 0 && ev.date && <span className="text-slate-600"> · </span>}
                                            {ev.date && formatDate(ev.date)}
                                          </p>
                                          {ev.note && !isOpen && <p className="text-xs text-slate-400 mt-1 truncate">&quot;{ev.note}&quot;</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2.5 flex-shrink-0">
                                        <div className="text-right">
                                          <p className="text-sm font-bold" style={{ color: isPayment ? 'var(--success)' : 'var(--text-primary)' }}>
                                            {isPayment ? '+' : ''}₺{fmt(ev.amount)}
                                          </p>
                                          {rates && <p className="text-[10px] text-slate-500">${fmtUSD(toUSD(ev.amount))}</p>}
                                        </div>
                                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 transition-transform"
                                          style={{
                                            background: isOpen ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'rgba(100,116,139,0.12)',
                                            color: isOpen ? 'var(--accent)' : 'var(--text-dim)',
                                            transform: isOpen ? 'rotate(90deg)' : 'none',
                                          }}>
                                          ▶
                                        </span>
                                      </div>
                                    </div>
                                  </button>

                                  {/* ── Hareket detayı ── */}
                                  {isOpen && (
                                    <div className="px-3 pb-3 pt-2.5 border-t space-y-2.5"
                                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                      {!evRow ? (
                                        <p className="text-xs text-slate-600">Bu hareketin dönem kaydı bulunamadı (silinmiş olabilir).</p>
                                      ) : isPayment ? (
                                        (() => {
                                          const tx = transactions.find(t => t.id === ev.txId);
                                          const debt = evRow.turnover ?? 0;
                                          const rowTxs = transactions
                                            .filter(t => t.fee_row_id === evRow.id)
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                          const idx = tx ? rowTxs.findIndex(t => t.id === tx.id) : -1;
                                          const cumBefore = idx > 0 ? rowTxs.slice(0, idx).reduce((s, t) => s + (t.paid_amount ?? 0), 0) : 0;
                                          const remainAfter = Math.max(0, debt - (cumBefore + ev.amount));
                                          const currentRemain = Math.max(0, debt - (evRow.paid_amount ?? 0));
                                          const st = statusInfo(evRow);
                                          return (
                                            <>
                                              <div className="space-y-1.5">
                                                {[
                                                  { label: 'Dönem borcu', val: `₺${fmt(debt)}`, sub: rates ? `$${fmtUSD(toUSD(debt))}` : '', color: 'var(--text-muted)' },
                                                  ...(cumBefore > 0 ? [{ label: 'Bu ödemeden önceki ödemeler', val: `₺${fmt(cumBefore)}`, sub: '', color: 'var(--text-muted)' }] : []),
                                                  { label: 'Bu ödeme', val: `+₺${fmt(ev.amount)}`, sub: rates ? `$${fmtUSD(toUSD(ev.amount))}` : '', color: 'var(--success)' },
                                                  { label: 'Bu ödemeden sonra kalan', val: `₺${fmt(remainAfter)}`, sub: '', color: remainAfter > 0 ? 'var(--danger)' : 'var(--success)' },
                                                ].map(l => (
                                                  <div key={l.label} className="flex items-center justify-between gap-2 text-xs">
                                                    <span className="text-slate-500">{l.label}</span>
                                                    <span className="font-semibold" style={{ color: l.color }}>
                                                      {l.val}{l.sub && <span className="text-slate-600 font-normal ml-1.5">{l.sub}</span>}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                <span className="text-xs text-slate-500">Dönemin güncel durumu</span>
                                                <span className="flex items-center gap-2">
                                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${st.cls}`}>{st.label}</span>
                                                  {currentRemain > 0 && <span className="text-xs font-semibold text-red-300">Kalan ₺{fmt(currentRemain)}</span>}
                                                </span>
                                              </div>
                                              {ev.note && <p className="text-xs text-slate-400">Not: &quot;{ev.note}&quot;</p>}
                                            </>
                                          );
                                        })()
                                      ) : (
                                        (() => {
                                          const debt = evRow.turnover ?? 0;
                                          const paid = evRow.paid_amount ?? 0;
                                          const remain = Math.max(0, debt - paid);
                                          const items = evRow.debt_items ?? [];
                                          const st = statusInfo(evRow);
                                          return (
                                            <>
                                              <div className="grid grid-cols-3 gap-2">
                                                {[
                                                  { label: 'Borç', try: debt, color: 'var(--text-muted)' },
                                                  { label: 'Ödenen', try: paid, color: paid > 0 ? 'var(--success)' : '#475569' },
                                                  { label: 'Kalan', try: remain, color: remain > 0 ? 'var(--danger)' : 'var(--success)' },
                                                ].map(c => (
                                                  <div key={c.label} className="rounded-lg py-2 px-1.5 text-center" style={{ background: 'var(--bg-base)' }}>
                                                    <p className="text-[9px] text-slate-600 mb-0.5">{c.label}</p>
                                                    <p className="text-xs font-bold leading-tight" style={{ color: c.color }}>₺{fmt(c.try)}</p>
                                                    {rates && <p className="text-[9px] text-slate-600 leading-tight">${fmtUSD(toUSD(c.try))}</p>}
                                                  </div>
                                                ))}
                                              </div>
                                              {items.length > 0 && (
                                                <div>
                                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Borç Kalemleri</p>
                                                  <div className="space-y-1">
                                                    {items.map((item, ii) => {
                                                      const paidAmt = item.paid_amount ?? (item.paid ? item.amount : 0);
                                                      const isFull = paidAmt >= item.amount;
                                                      const isPart = paidAmt > 0 && !isFull;
                                                      return (
                                                        <div key={ii} className="flex items-center gap-2 text-xs">
                                                          <span style={{ color: isFull ? 'var(--success)' : isPart ? 'var(--accent)' : 'var(--text-dim)' }}>
                                                            {isFull ? '✓' : isPart ? '≈' : '○'}
                                                          </span>
                                                          <span className="flex-1 truncate text-slate-300">{item.name}</span>
                                                          <span className="text-slate-400 font-medium">
                                                            {item.currency !== 'TRY' ? `${item.currency} ` : '₺'}{fmt(item.amount)}
                                                          </span>
                                                          {isPart && <span className="text-[10px] text-amber-400">(₺{fmt(paidAmt)} ödendi)</span>}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                              <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                <span className="text-xs text-slate-500">Dönemin güncel durumu</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${st.cls}`}>{st.label}</span>
                                              </div>
                                              {ev.note && <p className="text-xs text-slate-400">Not: &quot;{ev.note}&quot;</p>}
                                            </>
                                          );
                                        })()
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ═══ AYLIK DETAY ═══ */}
              {tab === 'monthly' && (
                <div className="space-y-3">
                  {/* Yıl seçici */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {feeYears.map(y => (
                      <button key={y} onClick={() => { setDetailYear(y); setExpandedMonth(null); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={detailYear === y
                          ? { background: 'var(--accent)', color: 'var(--accent-contrast)' }
                          : { background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--border-accent)' }}>
                        {y}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-accent)' }}>
                    {yearRows.map(({ month: m, row }, i) => {
                      const os = row ? Math.max(0, (row.turnover ?? 0) - (row.paid_amount ?? 0)) : 0;
                      const st = statusInfo(row);
                      const isExpanded = expandedMonth === m;
                      const monthTxs = row ? transactions.filter(t => t.fee_row_id === row.id) : [];
                      const items = row?.debt_items ?? [];
                      const hasDetail = !!row && ((items.length > 0) || monthTxs.length > 0 || !!row.note);
                      return (
                        <div key={m} className="border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
                          <button
                            onClick={() => setExpandedMonth(isExpanded ? null : m)}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                            style={{ background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)' }}>
                            <span className="w-12 text-xs font-semibold text-white flex-shrink-0">{MONTHS[m].slice(0, 3)}</span>
                            <div className="flex-1 grid grid-cols-3 gap-2 text-right">
                              <div>
                                <p className="text-[9px] text-slate-600">Borç</p>
                                <p className="text-xs font-medium text-slate-300">{row && (row.turnover ?? 0) > 0 ? `₺${fmt(row.turnover ?? 0)}` : '—'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-600">Ödenen</p>
                                <p className="text-xs font-medium" style={{ color: row && (row.paid_amount ?? 0) > 0 ? 'var(--success)' : '#475569' }}>
                                  {row && (row.paid_amount ?? 0) > 0 ? `₺${fmt(row.paid_amount ?? 0)}` : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-slate-600">Kalan</p>
                                <p className="text-xs font-medium" style={{ color: os > 0 ? 'var(--danger)' : '#475569' }}>
                                  {row ? `₺${fmt(os)}` : '—'}
                                </p>
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 w-16 text-center ${st.cls}`}>
                              {st.label}
                            </span>
                            <span className="text-slate-600 text-[10px] flex-shrink-0 w-3 text-center">
                              {hasDetail ? (isExpanded ? '▾' : '▸') : ''}
                            </span>
                          </button>

                          {/* Ay alt detayı */}
                          {isExpanded && hasDetail && row && (
                            <div className="px-3 pb-3 pt-1 space-y-2.5" style={{ background: 'var(--bg-card)' }}>
                              {items.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Borç Kalemleri</p>
                                  <div className="space-y-1">
                                    {items.map((item, ii) => {
                                      const paidAmt = item.paid_amount ?? (item.paid ? item.amount : 0);
                                      const isFull = paidAmt >= item.amount;
                                      const isPart = paidAmt > 0 && !isFull;
                                      return (
                                        <div key={ii} className="flex items-center gap-2 text-xs">
                                          <span style={{ color: isFull ? 'var(--success)' : isPart ? 'var(--accent)' : 'var(--text-dim)' }}>
                                            {isFull ? '✓' : isPart ? '≈' : '○'}
                                          </span>
                                          <span className="flex-1 truncate text-slate-300">{item.name}</span>
                                          <span className="text-slate-400 font-medium">
                                            {item.currency !== 'TRY' ? `${item.currency} ` : '₺'}{fmt(item.amount)}
                                          </span>
                                          {isPart && <span className="text-[10px] text-amber-400">(₺{fmt(paidAmt)} ödendi)</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {monthTxs.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Ödemeler</p>
                                  <div className="space-y-1">
                                    {monthTxs.map(tx => (
                                      <div key={tx.id} className="flex items-center gap-2 text-xs">
                                        <span className="text-green-400">💰</span>
                                        <span className="flex-1 text-slate-500">{tx.created_at ? formatDate(tx.created_at) : ''}</span>
                                        {tx.note && <span className="text-slate-500 truncate max-w-[120px]">&quot;{tx.note}&quot;</span>}
                                        <span className="text-green-400 font-semibold">+₺{fmt(tx.paid_amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {row.note && (
                                <p className="text-[10px] text-slate-500">Not: &quot;{row.note}&quot;</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Yıl toplamı */}
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-accent)' }}>
                      <span className="w-12 text-[10px] font-bold text-white uppercase flex-shrink-0">Toplam</span>
                      <div className="flex-1 grid grid-cols-3 gap-2 text-right">
                        <p className="text-xs font-bold text-white">₺{fmt(yearTotals.debt)}</p>
                        <p className="text-xs font-bold text-green-400">₺{fmt(yearTotals.paid)}</p>
                        <p className="text-xs font-bold text-red-400">₺{fmt(Math.max(0, yearTotals.debt - yearTotals.paid))}</p>
                      </div>
                      <span className="w-16 flex-shrink-0 text-center text-[10px] font-bold text-amber-400">
                        %{yearTotals.debt > 0 ? ((yearTotals.paid / yearTotals.debt) * 100).toFixed(0) : 0}
                      </span>
                      <span className="w-3 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ İSTATİSTİK ═══ */}
              {tab === 'stats' && (
                <div className="space-y-4">
                  {/* Trend */}
                  <div className="rounded-xl p-4 border flex items-center gap-4"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-accent)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: trendPct === null ? 'rgba(100,116,139,0.12)' : trendPct >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: trendPct === null ? 'var(--text-dim)' : trendPct >= 0 ? 'var(--success)' : 'var(--danger)',
                      }}>
                      {trendPct === null ? '—' : trendPct >= 0 ? '↑' : '↓'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Tahsilat Trendi (son 3 ay vs önceki 3 ay)</p>
                      <p className="text-lg font-bold" style={{ color: trendPct === null ? 'var(--text-muted)' : trendPct >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {trendPct === null ? (last3 > 0 ? 'Yeni dönem' : 'Veri yok') : `${trendPct >= 0 ? '+' : ''}%${trendPct.toFixed(1)}`}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Son 3 ay: ₺{fmt(last3)} · Önceki 3 ay: ₺{fmt(prev3)}
                      </p>
                    </div>
                  </div>

                  {/* Durum sayaçları */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Ay Durumları</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Tam Ödendi', count: fullPaid, icon: '✓', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', color: 'var(--success)' },
                        { label: 'Kısmi',      count: partial,  icon: '≈', bg: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: 'color-mix(in srgb, var(--accent) 25%, transparent)', color: 'var(--accent)' },
                        { label: 'Ödenmedi',   count: unpaid,   icon: '✗', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: 'var(--danger)' },
                      ].map(c => (
                        <div key={c.label} className="rounded-xl p-3 text-center border" style={{ background: c.bg, borderColor: c.border }}>
                          <p className="text-lg font-bold" style={{ color: c.color }}>{c.icon} {c.count}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{c.label} <span className="text-slate-600">ay</span></p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Genel istatistikler */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Genel İstatistikler</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Ortalama Aylık Borç', value: `₺${fmt(avgDebt)}`, sub: rates ? `$${fmtUSD(toUSD(avgDebt))}` : '' },
                        { label: 'Ortalama Aylık Tahsilat', value: `₺${fmt(avgPaid)}`, sub: rates ? `$${fmtUSD(toUSD(avgPaid))}` : '' },
                        { label: 'En Yüksek Borç Ayı', value: maxDebtRow ? `${MONTHS[maxDebtRow.month]} ${maxDebtRow.year}` : '—', sub: maxDebtRow ? `₺${fmt(maxDebtRow.turnover ?? 0)}` : '' },
                        { label: 'En Yüksek Tahsilat Ayı', value: maxPaidRow ? `${MONTHS[maxPaidRow.month]} ${maxPaidRow.year}` : '—', sub: maxPaidRow ? `₺${fmt(maxPaidRow.paid_amount ?? 0)}` : '' },
                        { label: 'Aktif Ay Sayısı', value: String(activeRows.length), sub: `${eventYears.length} yıl içinde` },
                        { label: 'Toplam Ödeme İşlemi', value: String(transactions.length), sub: lastPayment?.created_at ? `Son: ${formatShortDate(lastPayment.created_at)}` : '' },
                      ].map(c => (
                        <div key={c.label} className="rounded-xl p-3 border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-accent)' }}>
                          <p className="text-[10px] text-slate-500 mb-1">{c.label}</p>
                          <p className="text-sm font-bold text-white leading-tight">{c.value}</p>
                          {c.sub && <p className="text-[10px] text-slate-500 mt-0.5">{c.sub}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ÖZEL KALEMLER ═══ */}
              {tab === 'cols' && (
                cols.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 text-sm">Bu casinoya tanımlı özel kalem yok.</p>
                    <p className="text-slate-600 text-xs mt-1">⚙ Yönet menüsünden özel kalem ekleyebilirsin.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cols.map(col => {
                      const entries = colEntries
                        .filter(e => e.col_id === col.id)
                        .sort((a, b) => ((b.year ?? 0) * 12 + (b.month ?? 0)) - ((a.year ?? 0) * 12 + (a.month ?? 0)));
                      const received = entries.filter(e => e.status === 1).length;
                      return (
                        <div key={col.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-accent)' }}>
                          <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: 'var(--bg-card)' }}>
                            <div>
                              <p className="text-sm font-semibold text-white">{col.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {col.currency} {fmt(col.amount)} · {col.monthly === 1 ? 'Aylık' : col.monthly === 2 ? 'Yıllık' : 'Tek seferlik'}
                              </p>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg"
                              style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
                              {received}/{entries.length} alındı
                            </span>
                          </div>
                          {entries.length === 0 ? (
                            <p className="px-3.5 py-3 text-xs text-slate-600" style={{ background: 'var(--bg-base)' }}>Henüz kayıt yok.</p>
                          ) : (
                            <div className="divide-y" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                              {entries.map(e => (
                                <div key={e.id} className="flex items-center gap-2 px-3.5 py-2 text-xs">
                                  <span className="flex-1 text-slate-300">
                                    {e.month ? `${MONTHS[e.month]} ` : ''}{e.year ?? ''}
                                    {!e.month && !e.year && 'Tek seferlik'}
                                  </span>
                                  {e.updated_at && <span className="text-[10px] text-slate-600">{formatShortDate(e.updated_at)}</span>}
                                  <span className="text-slate-400 font-medium">
                                    {col.currency} {fmt(e.amount ?? col.amount)}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${e.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {e.status === 1 ? 'ALINDI' : 'ALINMADI'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* ═══ GİDERLER ═══ */}
              {tab === 'expenses' && (
                <div className="space-y-3">
                  {/* Net kâr özeti */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Tahsilat', try: collected, color: 'var(--success)' },
                      { label: 'Toplam Gider', try: totalExpensesTRY, color: totalExpensesTRY > 0 ? 'var(--danger)' : '#475569' },
                      { label: 'Net (Tahsilat − Gider)', try: netProfit, color: netProfit >= 0 ? 'var(--success)' : 'var(--danger)' },
                    ].map(c => (
                      <div key={c.label} className="rounded-xl py-2.5 px-2 text-center border"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-accent)' }}>
                        <p className="text-[10px] text-slate-500 mb-0.5">{c.label}</p>
                        <p className="text-sm font-bold leading-tight" style={{ color: c.color }}>${fmtUSD(toUSD(c.try))}</p>
                        <p className="text-[10px] text-slate-600 leading-tight">₺{fmt(c.try)}</p>
                      </div>
                    ))}
                  </div>

                  {sortedExpenses.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 text-sm">Bu casinoya bağlı gider kaydı yok.</p>
                      <p className="text-slate-600 text-xs mt-1">Giderler ekranında gider eklerken casino seçersen burada görünür.</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: 'var(--border-accent)' }}>
                      {sortedExpenses.map(e => (
                        <div key={e.id} className="flex items-center gap-3 px-3.5 py-2.5" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>💸</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{e.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {MONTHS[e.month]} {e.year}{e.note && <> · &quot;{e.note}&quot;</>}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-red-300">
                              −{e.currency && e.currency !== 'TRY' ? `${e.currency} ` : '₺'}{fmt(e.amount ?? 0)}
                            </p>
                            {e.currency && e.currency !== 'TRY' && rates && (
                              <p className="text-[10px] text-slate-500">₺{fmt(toTRY(e.amount ?? 0, e.currency))}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ BİLGİLER (casino ayarlarını düzenle) ═══ */}
              {tab === 'bilgiler' && (
                <div className="space-y-4 max-w-lg">
                  <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border-accent)', background: 'var(--bg-card)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>⚙️</span>
                      <div>
                        <p className="text-sm font-bold text-white">Casino Ayarları</p>
                        <p className="text-[11px] text-slate-500">Ad ve fee bilgilerini buradan güncelleyebilirsin</p>
                      </div>
                    </div>

                    {/* Casino Adı */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Casino Adı</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)' }}
                        placeholder="Casino adı"
                      />
                    </div>

                    {/* Fee Türü */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fee Türü</label>
                      <div className="flex gap-2">
                        {(['percent', 'fixed', 'none'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setEditFeeType(t)}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all border"
                            style={editFeeType === t
                              ? { background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }
                              : { background: 'transparent', color: 'var(--text-dim)', borderColor: 'var(--border-accent)' }}>
                            {t === 'percent' ? 'Yüzde %' : t === 'fixed' ? 'Sabit' : 'Yok'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fee Oranı */}
                    {editFeeType !== 'none' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          {editFeeType === 'percent' ? 'Fee Oranı (%)' : 'Sabit Tutar'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editFeeRate}
                            onChange={e => setEditFeeRate(e.target.value)}
                            className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)' }}
                            placeholder="0"
                          />
                          {editFeeType === 'fixed' && (
                            <select
                              value={editFeeCur}
                              onChange={e => setEditFeeCur(e.target.value)}
                              className="px-3 py-2.5 rounded-lg text-sm outline-none"
                              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                              {['TRY', 'USD', 'EUR', 'CRYPTO'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                        </div>
                      </div>
                    )}

                    {editError && (
                      <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⚠️ {editError}
                      </div>
                    )}

                    <button
                      onClick={saveCasinoInfo}
                      disabled={editSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{ background: editSaved ? '#22c55e' : 'var(--accent)', color: editSaved ? '#fff' : 'var(--accent-contrast)' }}
                    >
                      {editSaving ? '⏳ Kaydediliyor...' : editSaved ? '✅ Kaydedildi!' : 'Kaydet'}
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ NOTLAR ═══ */}
              {tab === 'notlar' && (
                <div className="max-w-2xl">
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                    </div>
                  ) : notesEditing ? (
                    /* Düzenleme modu */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Not Düzenleniyor</p>
                        <button onClick={() => { setNotesDraft(notes); setNotesEditing(false); }}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                          × İptal
                        </button>
                      </div>
                      <textarea
                        value={notesDraft}
                        onChange={e => setNotesDraft(e.target.value)}
                        autoFocus
                        rows={14}
                        className="w-full px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all resize-none leading-relaxed"
                        style={{
                          background: 'var(--bg-base)',
                          border: '1.5px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                          fontFamily: 'inherit',
                        }}
                        placeholder={`${casino.name} hakkında notlarınızı buraya yazın...`}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-600">{notesDraft.length} karakter</p>
                        {notesError && <p className="text-[11px] text-red-400">⚠ {notesError}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setNotesDraft(notes); setNotesEditing(false); }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                          style={{ background: 'transparent', border: '1px solid var(--border-accent)', color: 'var(--text-dim)' }}>
                          İptal
                        </button>
                        <button onClick={saveNotes} disabled={notesSaving}
                          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                          style={{ background: notesSaved ? '#22c55e' : 'var(--accent)', color: notesSaved ? '#fff' : 'var(--accent-contrast)' }}>
                          {notesSaving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Görüntüleme modu */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notlar</p>
                          {lastUpdated && (
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              Son güncelleme: {new Date(lastUpdated).toLocaleString('tr-TR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                            </p>
                          )}
                        </div>
                        <button onClick={() => { setNotesDraft(notes); setNotesEditing(true); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                          ✏️ Düzenle
                        </button>
                      </div>

                      {notes ? (
                        <div
                          className="w-full min-h-[280px] px-4 py-4 rounded-xl text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
                          style={{
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border-accent)',
                            fontFamily: 'inherit',
                          }}
                        >
                          {notes}
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center min-h-[280px] rounded-xl gap-3 cursor-pointer"
                          style={{ background: 'var(--bg-base)', border: '1px dashed var(--border-accent)' }}
                          onClick={() => setNotesEditing(true)}
                        >
                          <span className="text-3xl">📝</span>
                          <p className="text-slate-500 text-sm">Henüz not eklenmemiş</p>
                          <p className="text-slate-600 text-xs">Tıkla ve yazmaya başla</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs text-slate-500 flex-1">{allEvents.length} hareket · {feeRows.length} dönem</span>
          <button onClick={exportExcel} disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:bg-white/5 disabled:opacity-40"
            style={{ borderColor: 'var(--border-accent)', color: 'var(--success)' }}>
            📥 Excel Ekstre
          </button>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
            Kapat
          </button>
        </div>

        {/* Ay düzenleme pop-up'ı (tablo satırından açılır) */}
        {editMonth !== null && (
          <FeeModal
            casino={casino}
            month={editMonth}
            year={detailYear}
            feeRow={feeRows.find(r => r.year === detailYear && r.month === editMonth) ?? null}
            cols={cols.filter(c => c.monthly === 1)}
            colEntries={cols
              .filter(c => c.monthly === 1)
              .flatMap(c => colEntries.filter(e => e.col_id === c.id && e.year === detailYear && e.month === editMonth))}
            onClose={() => setEditMonth(null)}
            onSaved={() => { fetchAll(true); onSaved?.(); }}
          />
        )}
      </div>
    </div>
  );
}
