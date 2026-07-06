'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Casino, FeeRow, CasinoCol, ColEntry } from '@/lib/supabase';
import FeeModal from '@/components/FeeModal';
import AddCasinoModal from '@/components/AddCasinoModal';
import CasinoProfileModal from '@/components/CasinoProfileModal';
import GiderlerModal from '@/components/GiderlerModal';
import AylikFeeModal from '@/components/AylikFeeModal';
import CokluFeeModal from '@/components/CokluFeeModal';
import { useTheme, type Theme } from '@/components/ThemeProvider';

const THEME_OPTIONS: { id: Theme; label: string; dot: string }[] = [
  { id: 'dark',  label: 'Sarı',  dot: '#fbbf24' },
  { id: 'navy',  label: 'Mavi',  dot: '#60a5fa' },
  { id: 'light', label: 'Beyaz', dot: '#f8fafc' },
];

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

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
  const [month, setMonth] = useState(0); // 0 = tüm yıl
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [casinoCols, setCasinoCols] = useState<CasinoCol[]>([]);
  const [colEntries, setColEntries] = useState<ColEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('outstanding');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [feeModal, setFeeModal] = useState<{ casino: Casino; month: number } | null>(null);
  const [profileCasino, setProfileCasino] = useState<Casino | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [giderlerModal, setGiderlerModal] = useState(false);
  const [feeReportModal, setFeeReportModal] = useState(false);
  const [cokluFeeModal, setCokluFeeModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setUsdRate(parseFloat(d.usd));
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, f, cc, ce] = await Promise.all([
      fetch('/api/casinos').then(r => r.json()),
      fetch(`/api/fee-rows?year=${year}`).then(r => r.json()),
      fetch('/api/casino-cols').then(r => r.json()),
      fetch(`/api/col-entries?year=${year}`).then(r => r.json()),
    ]);
    setCasinos(Array.isArray(c) ? c : []);
    setFeeRows(Array.isArray(f) ? f : []);
    setCasinoCols(Array.isArray(cc) ? cc : []);
    setColEntries(Array.isArray(ce) ? ce : []);
    setLoading(false);
  }, [year]);

  const silentRefresh = useCallback(async () => {
    const [f, ce] = await Promise.all([
      fetch(`/api/fee-rows?year=${year}`).then(r => r.json()),
      fetch(`/api/col-entries?year=${year}`).then(r => r.json()),
    ]);
    setFeeRows(Array.isArray(f) ? f : []);
    setColEntries(Array.isArray(ce) ? ce : []);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  function casinoStats(casino: Casino) {
    const rows = feeRows.filter(r => r.casino_id === casino.id);
    const total = rows.reduce((s, r) => s + (r.turnover ?? 0), 0); // Beklenen — her zaman yıllık toplam
    // Ay seçiliyse Tahsil/Bekleyen o aya göre hesaplanır
    const scoped = month === 0 ? rows : rows.filter(r => r.month === month);
    const scopedTotal = scoped.reduce((s, r) => s + (r.turnover ?? 0), 0);
    const collected = scoped.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
    const outstanding = Math.max(0, scopedTotal - collected);
    const rate = scopedTotal > 0 ? (collected / scopedTotal) * 100 : 0;
    const months = rows.length;
    return { total, scopedTotal, collected, outstanding, rate, months };
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
    scopedTotal: s.scopedTotal + r.scopedTotal,
    collected: s.collected + r.collected,
    outstanding: s.outstanding + r.outstanding,
  }), { total: 0, scopedTotal: 0, collected: 0, outstanding: 0 });

  const overallRate = totals.scopedTotal > 0 ? (totals.collected / totals.scopedTotal) * 100 : 0;
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
          <a href="/reports" title="Ana Sayfa" className="text-amber-400 font-bold text-lg hover:opacity-80 transition-opacity">♠</a>
          <a href="/reports" title="Ana Sayfa" className="font-bold text-white text-sm hidden sm:block hover:text-amber-400 transition-colors">Casino Takip</a>
          <span className="text-slate-600 text-sm hidden sm:block">·</span>
          <span className="text-slate-400 text-sm font-medium">Raporlar</span>

          <div className="flex items-center gap-1 ml-2">
            {years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={y === year ? { background: 'var(--accent)', color: 'var(--accent-contrast)', fontWeight: 700 } : { color: '#94a3b8' }}>
                {y}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setAddModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
              <span>+</span>
              <span className="hidden sm:inline">Casino Ekle</span>
            </button>
            {/* Menü */}
            <div className="relative">
              <button onClick={() => { setMenuOpen(o => !o); setThemeOpen(false); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
                style={{ borderColor: 'var(--border-accent)' }}>
                ☰ <span className="hidden sm:inline">Menü</span> <span className="text-[10px]">▾</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-accent)' }}>
                    <a href="/dashboard"
                      className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      📋 Dashboard (Aylık Tablo)
                    </a>
                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />
                    <button onClick={() => { setMenuOpen(false); setFeeReportModal(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      ✏️ Yeni Fee Rapor
                    </button>
                    <button onClick={() => { setMenuOpen(false); setCokluFeeModal(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      📚 Çoklu Ay Rapor
                    </button>
                    <a href="/reports/fee"
                      className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      🗂️ Fee Rapor Geçmişi
                    </a>
                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />
                    <button onClick={() => { setMenuOpen(false); setGiderlerModal(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      💸 Giderler
                    </button>
                    <a href="/settings"
                      className="flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      ⚙️ Ayarlar
                    </a>
                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />
                    <button onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                      style={{ color: 'var(--text-muted)' }}>
                      ↪ Çıkış
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tema seçici */}
            <div className="relative">
              <button onClick={() => { setThemeOpen(o => !o); setMenuOpen(false); }} title="Tema"
                className="w-8 h-8 flex items-center justify-center rounded-lg border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border-accent)' }}>
                <span className="w-3.5 h-3.5 rounded-full border"
                  style={{ background: 'var(--accent)', borderColor: 'var(--border-color)' }} />
              </button>
              {themeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-accent)' }}>
                    {THEME_OPTIONS.map(t => (
                      <button key={t.id}
                        onClick={() => { setTheme(t.id); setThemeOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                        style={{ color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: theme === t.id ? 700 : 400 }}>
                        <span className="w-3 h-3 rounded-full border flex-shrink-0"
                          style={{ background: t.dot, borderColor: 'var(--border-accent)' }} />
                        {t.label}
                        {theme === t.id && <span className="ml-auto">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">

        {/* Summary cards */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Toplam Beklenen', try: totals.total, color: '#94a3b8' },
              { label: month === 0 ? 'Tahsil Edilen' : `Tahsil Edilen (${MONTHS[month]})`, try: totals.collected, color: '#86efac' },
              { label: month === 0 ? 'Bekleyen' : `Bekleyen (${MONTHS[month]})`,           try: totals.outstanding, color: '#fca5a5' },
              { label: 'Tahsilat Oranı',  try: null, color: 'var(--accent)' },
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
          <div className="px-4 py-3 border-b flex items-center justify-between gap-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="font-semibold text-white text-sm">
              Casino Raporu — {year}{month !== 0 && <span className="text-amber-400"> · {MONTHS[month]}</span>}
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer"
                style={{ background: 'var(--bg-base)', border: `1px solid ${month !== 0 ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--border-accent)'}`, color: month !== 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                <option value={0}>Tüm Yıl</option>
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 hidden sm:block">{casinos.length} casino</span>
            </div>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{row.casino.name}</span>
                          <button
                            onClick={e => { e.stopPropagation(); setProfileCasino(row.casino); }}
                            title="Profil · Hareket Geçmişi"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all active:scale-95 flex-shrink-0"
                            style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                            👤 Profil
                          </button>
                        </div>
                      </td>
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
                                background: row.rate >= 100 ? '#22c55e' : row.rate > 50 ? 'var(--accent)' : '#ef4444',
                              }} />
                          </div>
                          <span className="text-xs font-semibold"
                            style={{ color: row.rate >= 100 ? '#86efac' : row.rate > 50 ? 'var(--accent)' : '#fca5a5' }}>
                            %{row.rate.toFixed(0)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {month !== 0 ? (
                          <button
                            onClick={e => { e.stopPropagation(); setFeeModal({ casino: row.casino, month }); }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 whitespace-nowrap"
                            style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                            Görüntüle
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">→</span>
                        )}
                      </td>
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

      {/* Ay detay düzenleme pop-up'ı (dashboard ile aynı modal) */}
      {feeModal && (
        <FeeModal
          casino={feeModal.casino}
          month={feeModal.month}
          year={year}
          feeRow={feeRows.find(r => r.casino_id === feeModal.casino.id && r.month === feeModal.month) ?? null}
          cols={casinoCols.filter(c => c.casino_id === feeModal.casino.id && c.monthly === 1)}
          colEntries={casinoCols
            .filter(c => c.casino_id === feeModal.casino.id && c.monthly === 1)
            .flatMap(c => colEntries.filter(e => e.col_id === c.id && e.year === year && e.month === feeModal.month))}
          onClose={() => setFeeModal(null)}
          onSaved={silentRefresh}
        />
      )}
      {profileCasino && (
        <CasinoProfileModal
          casino={profileCasino}
          onClose={() => setProfileCasino(null)}
          onSaved={silentRefresh}
        />
      )}
      {addModal && <AddCasinoModal onClose={() => setAddModal(false)} onAdded={load} />}
      {giderlerModal && <GiderlerModal year={year} onClose={() => setGiderlerModal(false)} />}
      {feeReportModal && <AylikFeeModal onClose={() => setFeeReportModal(false)} />}
      {cokluFeeModal && <CokluFeeModal onClose={() => setCokluFeeModal(false)} />}
    </div>
  );
}
