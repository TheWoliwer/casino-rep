'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Casino, CasinoCol, FeeRow, ColEntry } from '@/lib/supabase';
import FeeModal from '@/components/FeeModal';
import AddCasinoModal from '@/components/AddCasinoModal';
import CasinoModal from '@/components/CasinoModal';
import GiderlerModal from '@/components/GiderlerModal';
import { useTheme } from '@/components/ThemeProvider';

const MONTHS = ['','Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

interface FeeCell { casino: Casino; month: number; }
interface CasinoManage { casino: Casino; }


function cellInfo(feeRow: FeeRow | null, isLight: boolean): { bg: string; color: string; label: string; border: string } {
  const empty = { bg: 'transparent', color: isLight ? '#7a8fa6' : '#334155', label: '–', border: 'var(--border-color)' };
  if (!feeRow) return empty;
  const paid = feeRow.paid_amount ?? 0;
  const borc = feeRow.turnover ?? 0;
  if (borc === 0 && paid === 0) return empty;
  if (borc > 0 && paid >= borc) {
    return isLight
      ? { bg: '#d1fae5', color: '#065f46', label: '✓', border: '#6ee7b7' }
      : { bg: 'rgba(34,197,94,0.1)', color: '#86efac', label: '✓', border: 'rgba(34,197,94,0.3)' };
  }
  if (paid > 0) {
    return isLight
      ? { bg: '#fef3c7', color: '#78350f', label: '≈', border: '#fcd34d' }
      : { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', label: '≈', border: 'rgba(251,191,36,0.3)' };
  }
  return isLight
    ? { bg: '#fee2e2', color: '#991b1b', label: '✗', border: '#fca5a5' }
    : { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5', label: '✗', border: 'rgba(239,68,68,0.3)' };
}

function cellTooltip(feeRow: FeeRow): string {
  const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const lines: string[] = [];
  if (feeRow.turnover > 0) lines.push(`Ciro: ₺${fmt(feeRow.turnover)}`);
  if (feeRow.fee_amount > 0) lines.push(`Fee: ₺${fmt(feeRow.fee_amount)}`);
  if (feeRow.paid_amount > 0) lines.push(`Ödenen: ₺${fmt(feeRow.paid_amount)}`);
  const rem = feeRow.turnover - feeRow.paid_amount;
  if (rem > 0) lines.push(`Kalan: ₺${fmt(rem)}`);
  if (feeRow.note) lines.push(`Not: ${feeRow.note}`);
  return lines.join('\n') || '—';
}

export default function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [casinoCols, setCasinoCols] = useState<CasinoCol[]>([]);
  const [colEntries, setColEntries] = useState<ColEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<{ usd: string | null; eur: string | null }>({ usd: null, eur: null });

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [feeModal, setFeeModal] = useState<FeeCell | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [casinoModal, setCasinoModal] = useState<CasinoManage | null>(null);
  const [giderlerModal, setGiderlerModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Drag & drop sıralama
  const [dragId, setDragId]       = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragIdRef = useRef<number | null>(null);


  function handleDragStart(id: number) {
    dragIdRef.current = id;
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, id: number) {
    e.preventDefault();
    if (dragIdRef.current !== id) setDragOverId(id);
  }

  async function handleDrop(targetId: number) {
    const fromId = dragIdRef.current;
    setDragId(null);
    setDragOverId(null);
    dragIdRef.current = null;
    if (!fromId || fromId === targetId) return;

    const fromIdx  = casinos.findIndex(c => c.id === fromId);
    const toIdx    = casinos.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...casinos];
    const [moved]   = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setCasinos(reordered);
    await Promise.all(
      reordered.map((c, i) =>
        fetch(`/api/casinos/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: i }),
        })
      )
    );
  }

  const router = useRouter();

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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(setRates).catch(() => {});
  }, []);


  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const getFeeRow = (casinoId: number, month: number) =>
    feeRows.find(r => r.casino_id === casinoId && r.month === month) ?? null;

  const getCasinoCols = (casinoId: number) =>
    casinoCols.filter(c => c.casino_id === casinoId);

  const getColEntries = (colId: number) =>
    colEntries.filter(e => e.col_id === colId);

  const years = [year - 1, year, year + 1];
  const filteredCasinos = search.trim()
    ? casinos.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()))
    : casinos;


  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
          <span className="text-amber-400 font-bold text-lg flex-shrink-0">♠</span>
          <span className="font-bold text-white text-sm hidden sm:block">Casino Takip</span>

          {/* Year selector */}
          <div className="flex items-center gap-1 ml-1 sm:ml-2">
            {years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={y === year ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 } : { color: '#94a3b8' }}>
                {y}
              </button>
            ))}
          </div>

          {/* Currency rates */}
          {(rates.usd || rates.eur) && (
            <div className="hidden sm:flex items-center gap-3 ml-2 text-xs">
              {rates.usd && (
                <span className="text-slate-400">
                  <span className="text-green-400 font-semibold">$</span> {rates.usd} ₺
                </span>
              )}
              {rates.eur && (
                <span className="text-slate-400">
                  <span className="text-blue-400 font-semibold">€</span> {rates.eur} ₺
                </span>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setAddModal(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex-shrink-0"
              style={{ background: '#fbbf24', color: '#0f0f17' }}>
              <span>+</span>
              <span className="hidden sm:inline">Casino Ekle</span>
            </button>

            {/* Masaüstü butonları */}
            <a href="/reports"
              className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              Raporlar
            </a>
            <button onClick={() => setGiderlerModal(true)}
              className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              Giderler
            </button>
            <a href="/settings"
              className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              Ayarlar
            </a>
            <button onClick={logout}
              className="hidden sm:block px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition-colors">
              Çıkış
            </button>

            {/* Mobil ikonlar */}
            <a href="/reports" title="Raporlar"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-accent)' }}>
              <span className="text-sm">📊</span>
            </a>
            <button onClick={() => setGiderlerModal(true)} title="Giderler"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-accent)' }}>
              <span className="text-sm">💸</span>
            </button>
            <a href="/settings" title="Ayarlar"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border-accent)' }}>
              <span className="text-sm">⚙</span>
            </a>
            <button onClick={logout} title="Çıkış"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors flex-shrink-0">
              <span className="text-sm">↪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden sm:overflow-x-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500 text-sm animate-pulse">Yükleniyor...</div>
          </div>
        ) : casinos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="text-4xl">♠</div>
            <p className="text-slate-500 text-sm">Henüz casino eklenmedi</p>
            <button onClick={() => setAddModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: '#fbbf24', color: '#0f0f17' }}>
              İlk Casinoyu Ekle
            </button>
          </div>
        ) : (
          <>
          {/* ── MOBİL ACCORDION (yalnızca küçük ekran) ── */}
          <div className="sm:hidden space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none">🔍</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Casino ara..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            {filteredCasinos.map(casino => {
              const isExpanded = expandedId === casino.id;
              const hasCols    = getCasinoCols(casino.id).length > 0;
              const allRows    = MONTHS.slice(1).map((_, mi) => getFeeRow(casino.id, mi + 1));
              const paid    = allRows.filter(r => r && r.turnover > 0 && r.paid_amount >= r.turnover).length;
              const pending = allRows.filter(r => r && r.turnover > 0 && r.paid_amount < r.turnover).length;
              const partial = allRows.filter(r => r && r.turnover > 0 && r.paid_amount > 0 && r.paid_amount < r.turnover).length;

              return (
                <div key={casino.id} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-surface)' }}>

                  {/* Kart başlığı */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <button className="flex-1 text-left min-w-0" onClick={() => setExpandedId(isExpanded ? null : casino.id)}>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm truncate">{casino.name}</p>
                        {hasCols && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#f97316' }} />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-slate-500">
                          {casino.fee_type === 'percent' ? `%${casino.fee_rate}` : casino.fee_type === 'fixed' ? 'Sabit' : 'Fee yok'}
                        </p>
                        {paid > 0    && <span className="text-[10px] font-semibold text-green-400">✓ {paid}</span>}
                        {partial > 0 && <span className="text-[10px] font-semibold text-amber-400">≈ {partial}</span>}
                        {pending - partial > 0 && <span className="text-[10px] font-semibold text-red-400">✗ {pending - partial}</span>}
                      </div>
                    </button>

                    <button onClick={() => setCasinoModal({ casino })}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white transition-colors"
                      style={{ border: '1px solid var(--border-accent)' }}>
                      <span className="text-sm">⚙</span>
                    </button>

                    <button onClick={() => setExpandedId(isExpanded ? null : casino.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      ▾
                    </button>
                  </div>

                  {/* Açılan ay grid'i */}
                  {isExpanded && (
                    <div className="px-3 pb-3 grid grid-cols-4 gap-1.5 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-base)' }}>
                      {MONTHS.slice(1).map((m, mi) => {
                        const month  = mi + 1;
                        const feeRow = getFeeRow(casino.id, month);
                        const info   = cellInfo(feeRow, isLight);
                        return (
                          <button key={month}
                            onClick={() => setFeeModal({ casino, month })}
                            className="rounded-xl pt-2 pb-1.5 border flex flex-col items-center gap-0.5 transition-all active:scale-95"
                            style={{ background: info.bg, borderColor: info.border }}>
                            <span className="text-[9px] font-medium" style={{ color: info.color === '#334155' ? '#475569' : info.color, opacity: 0.7 }}>{m}</span>
                            <span className="text-xs font-bold" style={{ color: info.color }}>{info.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── MASAÜSTÜ TABLO (sm ve üstü) ── */}
          <div className="hidden sm:block rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              <table className="w-full border-collapse text-sm" style={{ minWidth: 700 }}>
                <thead className="sticky top-0 z-20">
                  <tr style={{ background: 'var(--bg-surface)', boxShadow: '0 1px 0 var(--border-color)' }}>
                    <th className="text-left px-3 sm:px-4 py-2 border-r sticky left-0 z-30 min-w-[140px] sm:min-w-[180px]"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Casino</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                          {filteredCasinos.length}{filteredCasinos.length !== casinos.length && `/${casinos.length}`}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs select-none">🔍</span>
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Ara..."
                          className="w-full pl-6 pr-2 py-1 rounded-lg text-xs outline-none"
                          style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </th>
                    {MONTHS.slice(1).map((m, i) => (
                      <th key={i + 1} className="px-1 sm:px-2 py-3 text-xs font-semibold text-slate-500 text-center min-w-[52px] sm:min-w-[72px] border-r"
                        style={{ borderColor: 'var(--border-color)' }}>
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCasinos.map((casino, idx) => {
                    const cols = getCasinoCols(casino.id);
                    const hasCols = cols.length > 0;
                    const isDragging = dragId === casino.id;
                    const isOver    = dragOverId === casino.id;
                    return (
                      <tr key={casino.id}
                        draggable
                        onDragStart={() => handleDragStart(casino.id)}
                        onDragOver={e => handleDragOver(e, casino.id)}
                        onDrop={() => handleDrop(casino.id)}
                        onDragEnd={() => { setDragId(null); setDragOverId(null); dragIdRef.current = null; }}
                        style={{
                          background: idx % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)',
                          borderTop: isOver ? '2px solid #fbbf24' : '1px solid var(--border-color)',
                          opacity: isDragging ? 0.4 : 1,
                          cursor: dragId ? 'grabbing' : 'auto',
                          transition: 'opacity 0.15s',
                        }}>

                        {/* Casino name cell */}
                        <td className="px-3 sm:px-4 py-3 border-r sticky left-0 z-10"
                          style={{ background: idx % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)', borderColor: 'var(--border-color)' }}>
                          <div className="flex items-center gap-2">
                            {/* Drag handle */}
                            <span
                              className="flex-shrink-0 text-slate-700 hover:text-slate-400 transition-colors select-none"
                              style={{ cursor: 'grab', fontSize: 14, lineHeight: 1, letterSpacing: '-1px' }}
                              title="Sürükleyerek sırala">
                              ⠿
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm truncate">{casino.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {casino.fee_type === 'percent' ? `%${casino.fee_rate}` :
                                  casino.fee_type === 'fixed' ? 'Sabit' : 'Fee yok'}
                              </p>
                            </div>
                            <button
                              onClick={() => setCasinoModal({ casino })}
                              title="Yönet"
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
                              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-accent)' }}>
                              <span>⚙</span>
                              {hasCols && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                                  style={{ background: '#f97316' }} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Month cells */}
                        {MONTHS.slice(1).map((_, mi) => {
                          const month = mi + 1;
                          const feeRow = getFeeRow(casino.id, month);
                          const info = cellInfo(feeRow, isLight);
                          return (
                            <td key={month} className="px-1 sm:px-1.5 py-2 border-r text-center relative"
                              style={{ borderColor: 'var(--border-color)' }}>
                              <button
                                onClick={() => setFeeModal({ casino, month })}
                                className="w-full rounded-lg py-1.5 text-xs font-bold transition-all hover:opacity-80 active:scale-95 border"
                                style={{ background: info.bg, color: info.color, borderColor: info.border }}>
                                {info.label}
                              </button>
                              {feeRow && (feeRow.turnover > 0 || feeRow.paid_amount > 0) && (
                                <span
                                  title={cellTooltip(feeRow)}
                                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-bold cursor-default select-none"
                                  style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b', border: '1px solid rgba(100,116,139,0.25)', lineHeight: 1 }}>
                                  i
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* Legend */}
        {!loading && casinos.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border inline-block" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }} />
              ALINDI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border inline-block" style={{ background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)' }} />
              KISMİ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border inline-block" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }} />
              ALINMADI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#f97316' }} />
              Özel kalem var
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {feeModal && (
        <FeeModal
          casino={feeModal.casino}
          month={feeModal.month}
          year={year}
          feeRow={getFeeRow(feeModal.casino.id, feeModal.month)}
          cols={getCasinoCols(feeModal.casino.id).filter(c => c.monthly === 1)}
          colEntries={getCasinoCols(feeModal.casino.id)
            .filter(c => c.monthly === 1)
            .flatMap(c => getColEntries(c.id).filter(e => e.year === year && e.month === feeModal.month))}
          onClose={() => setFeeModal(null)}
          onSaved={load}
        />
      )}
      {addModal && <AddCasinoModal onClose={() => setAddModal(false)} onAdded={load} />}
      {giderlerModal && <GiderlerModal year={year} onClose={() => setGiderlerModal(false)} />}
      {casinoModal && (
        <CasinoModal
          casino={casinoModal.casino}
          cols={getCasinoCols(casinoModal.casino.id)}
          onClose={() => setCasinoModal(null)}
          onSaved={load}
        />
      )}

    </div>
  );
}
