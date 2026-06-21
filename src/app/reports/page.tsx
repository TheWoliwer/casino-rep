'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Casino, FeeRow } from '@/lib/supabase';

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortKey = 'name' | 'total' | 'collected' | 'outstanding' | 'rate';
type SortDir = 'asc' | 'desc';

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('outstanding');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setUsdRate(parseFloat(d.usd));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, f] = await Promise.all([
      fetch('/api/casinos').then(r => r.json()),
      fetch(`/api/fee-rows?year=${year}`).then(r => r.json()),
    ]);
    setCasinos(Array.isArray(c) ? c : []);
    setFeeRows(Array.isArray(f) ? f : []);
    setLoading(false);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  function casinoStats(casino: Casino) {
    const rows = feeRows.filter(r => r.casino_id === casino.id);
    const total = rows.reduce((s, r) => s + (r.turnover ?? 0), 0); // borç = turnover
    const collected = rows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
    const outstanding = Math.max(0, total - collected);
    const rate = total > 0 ? (collected / total) * 100 : 0;
    const months = rows.length;
    return { total, collected, outstanding, rate, months };
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const tableData = casinos.map(c => ({ casino: c, ...casinoStats(c) })).sort((a, b) => {
    const mult = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'name') return a.casino.name.localeCompare(b.casino.name, 'tr') * mult;
    return ((a[sortKey] as number) - (b[sortKey] as number)) * mult;
  });

  const totals = tableData.reduce((s, r) => ({
    total: s.total + r.total,
    collected: s.collected + r.collected,
    outstanding: s.outstanding + r.outstanding,
  }), { total: 0, collected: 0, outstanding: 0 });

  const overallRate = totals.total > 0 ? (totals.collected / totals.total) * 100 : 0;
  const toUSD = (n: number) => usdRate ? n / usdRate : n;

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="ml-1 text-slate-600">↕</span>;
    return <span className="ml-1 text-amber-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const years = [year - 1, year, year + 1];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
          <span className="text-amber-400 font-bold text-lg">♠</span>
          <span className="font-bold text-white text-sm hidden sm:block">Casino Takip</span>
          <span className="text-slate-600 text-sm hidden sm:block">·</span>
          <span className="text-slate-400 text-sm font-medium">Raporlar</span>

          <div className="flex items-center gap-1 ml-2">
            {years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={y === year ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 } : { color: '#94a3b8' }}>
                {y}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <button onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">

        {/* Summary cards */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Beklenen', try: totals.total, color: '#94a3b8' },
              { label: 'Tahsil Edilen',   try: totals.collected, color: '#86efac' },
              { label: 'Bekleyen',        try: totals.outstanding, color: '#fca5a5' },
              { label: 'Tahsilat Oranı',  try: null, color: '#fbbf24' },
            ].map(card => (
              <div key={card.label} className="rounded-xl p-4 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                {card.try !== null ? (
                  <>
                    <p className="text-lg font-bold" style={{ color: card.color }}>${fmtUSD(toUSD(card.try))}</p>
                    <p className="text-xs text-slate-500 mt-0.5">₺{fmt(card.try)}</p>
                  </>
                ) : (
                  <p className="text-lg font-bold" style={{ color: card.color }}>%{overallRate.toFixed(1)}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Casino table */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="font-semibold text-white text-sm">Casino Raporu — {year}</h2>
            <span className="text-xs text-slate-500">{casinos.length} casino</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-slate-500 text-sm animate-pulse">Yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 640 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)' }}>
                    {([
                      ['name', 'Casino', 'text-left'],
                      ['months', 'Ay', 'text-center'],
                      ['total', 'Beklenen', 'text-right'],
                      ['collected', 'Tahsil', 'text-right'],
                      ['outstanding', 'Bekleyen', 'text-right'],
                      ['rate', 'Oran %', 'text-right'],
                    ] as [SortKey | 'months', string, string][]).map(([k, label, align]) => (
                      <th key={k}
                        onClick={() => k !== 'months' && toggleSort(k as SortKey)}
                        className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${align} ${k !== 'months' ? 'cursor-pointer hover:text-white select-none' : ''}`}>
                        {label}
                        {k !== 'months' && <SortIcon k={k as SortKey} />}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-xs text-slate-400 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={row.casino.id}
                      onClick={() => router.push(`/reports/${row.casino.id}?year=${year}`)}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                      style={{ borderTop: '1px solid #1e1e2e', background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)' }}>
                      <td className="px-4 py-3 font-semibold text-white">{row.casino.name}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{row.months}</td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        <p>${fmtUSD(toUSD(row.total))}</p>
                        <p className="text-xs text-slate-500">₺{fmt(row.total)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: row.collected > 0 ? '#86efac' : '#475569' }}>
                        <p>${fmtUSD(toUSD(row.collected))}</p>
                        <p className="text-xs opacity-60">₺{fmt(row.collected)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={{ color: row.outstanding > 0 ? '#fca5a5' : '#475569' }}>
                        <p>${fmtUSD(toUSD(row.outstanding))}</p>
                        <p className="text-xs opacity-60">₺{fmt(row.outstanding)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'var(--border-accent)' }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, row.rate)}%`,
                                background: row.rate >= 100 ? '#22c55e' : row.rate > 50 ? '#fbbf24' : '#ef4444',
                              }} />
                          </div>
                          <span className="text-xs font-semibold"
                            style={{ color: row.rate >= 100 ? '#86efac' : row.rate > 50 ? '#fbbf24' : '#fca5a5' }}>
                            %{row.rate.toFixed(0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 text-xs">→</td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr style={{ background: 'var(--bg-surface)', borderTop: '2px solid #2a2a3e' }}>
                    <td className="px-4 py-3 font-bold text-white text-xs uppercase tracking-wider" colSpan={2}>TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      <p>${fmtUSD(toUSD(totals.total))}</p>
                      <p className="text-xs text-slate-500 font-normal">₺{fmt(totals.total)}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-400">
                      <p>${fmtUSD(toUSD(totals.collected))}</p>
                      <p className="text-xs text-slate-500 font-normal">₺{fmt(totals.collected)}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-400">
                      <p>${fmtUSD(toUSD(totals.outstanding))}</p>
                      <p className="text-xs text-slate-500 font-normal">₺{fmt(totals.outstanding)}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">%{overallRate.toFixed(1)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
