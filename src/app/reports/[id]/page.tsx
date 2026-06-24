'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Casino, FeeRow, CasinoCol, ColEntry } from '@/lib/supabase';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const SHORT  = ['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortKey = 'month' | 'turnover' | 'paid_amount' | 'outstanding' | 'status';
type SortDir = 'asc' | 'desc';

export default function CasinoReportPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [year, setYear] = useState(parseInt(searchParams.get('year') || String(new Date().getFullYear())));
  const [casino, setCasino]     = useState<Casino | null>(null);
  const [feeRows, setFeeRows]   = useState<FeeRow[]>([]);
  const [cols, setCols]         = useState<CasinoCol[]>([]);
  const [colEntries, setColEntries] = useState<ColEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  const [sortKey, setSortKey]   = useState<SortKey>('month');
  const [sortDir, setSortDir]   = useState<SortDir>('asc');
  const [usdRate, setUsdRate]   = useState<number | null>(null);
  const [pdfOpen, setPdfOpen]   = useState(false);
  const [monthPicker, setMonthPicker] = useState(false);

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setUsdRate(parseFloat(d.usd));
    });
  }, []);

  const toUSD = (tryAmount: number) => usdRate ? tryAmount / usdRate : tryAmount;

  const load = useCallback(async () => {
    setLoading(true);
    const [allCasinos, allFees, allCols, allEntries] = await Promise.all([
      fetch('/api/casinos').then(r => r.json()),
      fetch(`/api/fee-rows?year=${year}`).then(r => r.json()),
      fetch('/api/casino-cols').then(r => r.json()),
      fetch(`/api/col-entries?year=${year}`).then(r => r.json()),
    ]);
    const found = (Array.isArray(allCasinos) ? allCasinos : []).find((c: Casino) => c.id === parseInt(id));
    setCasino(found ?? null);
    setFeeRows((Array.isArray(allFees) ? allFees : []).filter((r: FeeRow) => r.casino_id === parseInt(id)));
    setCols((Array.isArray(allCols) ? allCols : []).filter((c: CasinoCol) => c.casino_id === parseInt(id)));
    setColEntries(Array.isArray(allEntries) ? allEntries : []);
    setLoading(false);
  }, [id, year]);

  useEffect(() => { load(); }, [load]);

  if (!casino && !loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <p className="text-slate-400">Casino bulunamadı.</p>
    </div>
  );

  // Chart data — 12 months
  const chartData = MONTHS.slice(1).map((_, i) => {
    const m = i + 1;
    const row = feeRows.find(r => r.month === m);
    return {
      name: SHORT[m],
      'Ödenen': row ? (row.paid_amount ?? 0) : 0,
      'Kalan': row ? Math.max(0, (row.turnover ?? 0) - (row.paid_amount ?? 0)) : 0,
    };
  });

  // Summary stats
  const total       = feeRows.reduce((s, r) => s + (r.turnover ?? 0), 0);
  const collected   = feeRows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const outstanding = Math.max(0, total - collected);
  const rate        = total > 0 ? (collected / total) * 100 : 0;

  // Table rows (12 months always shown)
  const tableRows = MONTHS.slice(1).map((_, i) => {
    const m = i + 1;
    const row = feeRows.find(r => r.month === m);
    const outstanding = row ? Math.max(0, (row.turnover ?? 0) - (row.paid_amount ?? 0)) : 0;
    return { month: m, row, outstanding };
  });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  const sortedRows = [...tableRows].sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'month') return (a.month - b.month) * mult;
    if (sortKey === 'status') {
      const sa = a.row ? a.row.status : -1;
      const sb = b.row ? b.row.status : -1;
      return (sa - sb) * mult;
    }
    const va = a.row ? ((a.row as unknown as Record<string, number>)[sortKey] ?? 0) : 0;
    const vb = b.row ? ((b.row as unknown as Record<string, number>)[sortKey] ?? 0) : 0;
    return (va - vb) * mult;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-slate-600">↕</span>;
    return <span className="ml-1 text-amber-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function StatusBadge({ row }: { row: FeeRow | undefined }) {
    if (!row) return <span className="text-slate-600 text-xs">—</span>;
    const paid = row.paid_amount ?? 0;
    const total = row.turnover ?? 0;
    if (row.status === 1 || (total > 0 && paid >= total)) return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400">ALINDI</span>;
    if (paid > 0) return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400">KISMİ</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">ALINMADI</span>;
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; fill: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl p-3 border text-xs space-y-1" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-accent)' }}>
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.fill }}>
            {p.name}: ₺{fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const years = [year - 1, year, year + 1];

  function exportExcel() {
    const MONTHS_TR = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const data = MONTHS_TR.slice(1).map((_, i) => {
      const m   = i + 1;
      const row = feeRows.find(r => r.month === m);
      const turnover = row?.turnover ?? 0;
      const paid     = row?.paid_amount ?? 0;
      const os       = Math.max(0, turnover - paid);
      const statusLabel = !row ? '' : row.status === 1 || (turnover > 0 && paid >= turnover) ? 'ALINDI' : paid > 0 ? 'KISMİ' : 'ALINMADI';
      return {
        'Ay': MONTHS_TR[m],
        'Borç (TRY)': turnover || '',
        'Borç (USD)': usdRate && turnover ? +(turnover / usdRate).toFixed(2) : '',
        'Ödenen (TRY)': paid || '',
        'Ödenen (USD)': usdRate && paid ? +(paid / usdRate).toFixed(2) : '',
        'Kalan (TRY)': os || '',
        'Kalan (USD)': usdRate && os ? +(os / usdRate).toFixed(2) : '',
        'Durum': statusLabel,
        'Not': row?.note || '',
      };
    });

    // Totals row
    const total     = feeRows.reduce((s, r) => s + (r.turnover ?? 0), 0);
    const collected = feeRows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
    const remaining = Math.max(0, total - collected);
    data.push({
      'Ay': 'TOPLAM',
      'Borç (TRY)': total,
      'Borç (USD)': usdRate ? +(total / usdRate).toFixed(2) : '',
      'Ödenen (TRY)': collected,
      'Ödenen (USD)': usdRate ? +(collected / usdRate).toFixed(2) : '',
      'Kalan (TRY)': remaining,
      'Kalan (USD)': usdRate ? +(remaining / usdRate).toFixed(2) : '',
      'Durum': `%${total > 0 ? ((collected / total) * 100).toFixed(1) : 0} tahsil`,
      'Not': '',
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${casino?.name} ${year}`);
    XLSX.writeFile(wb, `${casino?.name ?? 'casino'}-${year}-rapor.xlsx`);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
          <span className="text-amber-400 font-bold text-lg">♠</span>
          <button onClick={() => router.push('/reports')} className="text-slate-400 hover:text-white text-sm transition-colors">
            Raporlar
          </button>
          <span className="text-slate-600">›</span>
          <span className="text-white text-sm font-semibold truncate max-w-[120px] sm:max-w-none">
            {casino?.name ?? '...'}
          </span>

          <div className="flex items-center gap-1 ml-2">
            {years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={y === year ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 } : { color: '#94a3b8' }}>
                {y}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportExcel} disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40"
              style={{ borderColor: 'var(--border-accent)', color: '#86efac' }}>
              Excel
            </button>
            {/* PDF Dropdown */}
            <div className="relative">
              <button onClick={() => setPdfOpen(o => !o)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                style={{ background: '#fbbf24', color: '#0f0f17' }}>
                PDF <span className="text-[10px]">▾</span>
              </button>
              {pdfOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setPdfOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-accent)' }}>
                    <button
                      onClick={() => { setPdfOpen(false); window.open(`/reports/${id}/print?year=${year}`, '_blank'); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      📄 12 Aylık Rapor
                    </button>
                    <button
                      onClick={() => { setPdfOpen(false); setMonthPicker(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      📅 Aylık Detay
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500 animate-pulse">Yükleniyor...</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">

          {/* Casino info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'var(--border-accent)' }}>♠</div>
            <div>
              <h1 className="text-xl font-bold text-white">{casino?.name}</h1>
              <p className="text-sm text-slate-400">{year} yılı raporu</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Beklenen', usd: toUSD(total), try: total, color: '#94a3b8' },
              { label: 'Tahsil Edilen', usd: toUSD(collected), try: collected, color: '#86efac' },
              { label: 'Bekleyen', usd: toUSD(outstanding), try: outstanding, color: outstanding > 0 ? '#fca5a5' : '#86efac' },
              { label: 'Tahsilat Oranı', usd: null, try: null, pct: `%${rate.toFixed(1)}`, color: rate >= 100 ? '#86efac' : rate > 50 ? '#fbbf24' : '#fca5a5' },
            ].map(card => (
              <div key={card.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                {card.pct ? (
                  <p className="text-lg font-bold" style={{ color: card.color }}>{card.pct}</p>
                ) : (
                  <>
                    <p className="text-lg font-bold" style={{ color: card.color }}>${fmtUSD(card.usd!)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">₺{fmt(card.try!)}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-xl border p-4 sm:p-5" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="font-semibold text-white text-sm mb-4">Aylık Ödeme Grafiği</h2>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} width={45} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }} />
                  <Bar dataKey="Ödenen" stackId="a" fill="#22c55e" radius={[0, 0, 2, 2]} />
                  <Bar dataKey="Kalan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly detail table */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <h2 className="font-semibold text-white text-sm">Aylık Detay</h2>
              <span className="text-xs text-slate-500">Sütun başlıklarına tıklayarak sıralayın</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 520 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    {([
                      ['month', 'Ay'],
                      ['turnover', 'Borç'],
                      ['paid_amount', 'Ödenen'],
                      ['outstanding', 'Kalan'],
                      ['status', 'Durum'],
                    ] as [SortKey, string][]).map(([k, label]) => (
                      <th key={k} onClick={() => toggleSort(k)}
                        className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right first:text-left cursor-pointer hover:text-white select-none">
                        {label}<SortIcon k={k} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(({ month: m, row, outstanding: os }, i) => (
                    <tr key={m} style={{ background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)', borderTop: '1px solid #1e1e2e' }}>
                      <td className="px-4 py-3 font-medium text-white">{MONTHS[m]}</td>
                      <td className="px-4 py-3 text-right text-slate-300 font-medium">
                        {row ? <><span className="text-white">${fmtUSD(toUSD(row.turnover ?? 0))}</span><br/><span className="text-xs text-slate-500">₺{fmt(row.turnover ?? 0)}</span></> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium"
                        style={{ color: row && (row.paid_amount ?? 0) > 0 ? '#86efac' : '#475569' }}>
                        {row ? <><span>${fmtUSD(toUSD(row.paid_amount ?? 0))}</span><br/><span className="text-xs opacity-60">₺{fmt(row.paid_amount ?? 0)}</span></> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium"
                        style={{ color: os > 0 ? '#fca5a5' : row ? '#86efac' : '#475569' }}>
                        {row ? <><span>${fmtUSD(toUSD(os))}</span><br/><span className="text-xs opacity-60">₺{fmt(os)}</span></> : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-surface)', borderTop: '2px solid #2a2a3e' }}>
                    <td className="px-4 py-3 font-bold text-white text-xs uppercase">TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold text-white">${fmtUSD(toUSD(total))}<br/><span className="text-xs text-slate-500 font-normal">₺{fmt(total)}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-green-400">${fmtUSD(toUSD(collected))}<br/><span className="text-xs text-slate-500 font-normal">₺{fmt(collected)}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-red-400">${fmtUSD(toUSD(outstanding))}<br/><span className="text-xs text-slate-500 font-normal">₺{fmt(outstanding)}</span></td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-bold" style={{ color: rate >= 100 ? '#86efac' : rate > 50 ? '#fbbf24' : '#fca5a5' }}>
                        %{rate.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Özel kalemler */}
          {cols.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
              <div className="px-4 py-3 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold text-white text-sm">Özel Kalemler</h2>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {cols.map(col => {
                  const entries = colEntries.filter(e => e.col_id === col.id);
                  const colPaid = entries.filter(e => e.status === 1).length;
                  return (
                    <div key={col.id} className="px-4 py-3 flex items-center gap-4" style={{ background: 'var(--bg-base)' }}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{col.name}</p>
                        <p className="text-xs text-slate-500">{col.currency} · {col.monthly === 1 ? 'Aylık' : col.monthly === 2 ? 'Yıllık' : 'Tek seferlik'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">₺{fmt(col.amount)}</p>
                        <p className="text-xs text-slate-400">{colPaid}/{entries.length} ay alındı</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Ay Seçici Modal */}
      {monthPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Hangi ay?</p>
              <button onClick={() => setMonthPicker(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xl"
                style={{ color: 'var(--text-dim)' }}>×</button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
              {MONTHS.slice(1).map((m, i) => {
                const monthNum = i + 1;
                const hasData  = feeRows.some(r => r.month === monthNum);
                return (
                  <button key={monthNum}
                    onClick={() => { setMonthPicker(false); window.open(`/reports/${id}/print?year=${year}&month=${monthNum}`, '_blank'); }}
                    className="py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      background: hasData ? 'rgba(251,191,36,0.12)' : 'var(--bg-card)',
                      border: `1px solid ${hasData ? 'rgba(251,191,36,0.35)' : 'var(--border-accent)'}`,
                      color: hasData ? '#fbbf24' : 'var(--text-dim)',
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
            <p className="px-5 pb-4 text-[10px]" style={{ color: 'var(--text-dim)' }}>
              Sarı = veri mevcut
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
