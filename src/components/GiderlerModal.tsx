'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Expense, Casino } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

const MONTHS       = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                       'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const CURRENCIES   = ['TRY', 'USD', 'EUR', 'CRYPTO'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return fmt(n);
}

interface Props { year: number; onClose: () => void; }

export default function GiderlerModal({ year: initialYear, onClose }: Props) {
  const { theme }   = useTheme();
  const isLight     = theme === 'light';

  const [year, setYear]             = useState(initialYear);
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [casinos, setCasinos]       = useState<Casino[]>([]);
  const [rates, setRates]           = useState<{ usd: number; eur: number } | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  // Form
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [note, setNote]         = useState('');
  const [casinoId, setCasinoId] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [expRes, casinoRes, rateRes] = await Promise.all([
      fetch(`/api/expenses?year=${year}`),
      fetch('/api/casinos'),
      fetch('/api/currency'),
    ]);
    const expData    = await expRes.json();
    const casinoData = await casinoRes.json();
    const rateData   = await rateRes.json();
    setExpenses(Array.isArray(expData) ? expData : []);
    setCasinos(Array.isArray(casinoData) ? casinoData : []);
    if (rateData.usd && rateData.eur) {
      setRates({ usd: parseFloat(rateData.usd), eur: parseFloat(rateData.eur) });
    }
    setLoading(false);
  }, [year]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (activeMonth !== null) setActiveMonth(null); else onClose(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, activeMonth]);

  // Kur çevirisi: her şeyi TRY'ye çevir
  function toTRY(amount: number, cur: string): number {
    if (!rates) return amount;
    if (cur === 'USD' || cur === 'CRYPTO') return amount * rates.usd;
    if (cur === 'EUR') return amount * rates.eur;
    return amount;
  }

  function monthTotalTRY(month: number) {
    return expenses.filter(e => e.month === month).reduce((s, e) => s + toTRY(e.amount, e.currency), 0);
  }
  function monthExpenses(month: number) { return expenses.filter(e => e.month === month); }

  const yearTotalTRY = expenses.reduce((s, e) => s + toTRY(e.amount, e.currency), 0);

  // Toplam gider yüzdesini renklendirmek için max ayı bul
  const maxMonthTotal = Math.max(...MONTHS.slice(1).map((_, i) => monthTotalTRY(i + 1)), 1);

  async function addExpense() {
    if (!name.trim() || !amount || activeMonth === null) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        amount: parseFloat(amount.replace(',', '.')),
        currency,
        year,
        month: activeMonth,
        note,
        casino_id: casinoId ? parseInt(casinoId) : null,
      }),
    });
    if (!res.ok) {
      const d = await res.json(); setError(d.error || 'Hata oluştu');
    } else {
      setName(''); setAmount(''); setNote(''); setCasinoId('');
      await load();
    }
    setSaving(false);
  }

  async function deleteExpense(id: number) {
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
    await load();
  }

  const years = [year - 1, year, year + 1];

  const inputSt = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-accent)',
    color: 'var(--text-primary)',
  } as React.CSSProperties;

  // Renkler
  const danger  = isLight ? '#991b1b' : '#fca5a5';
  const warning = isLight ? '#78350f' : '#fbbf24';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose} style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            {activeMonth !== null && (
              <button onClick={() => setActiveMonth(null)}
                className="text-sm transition-colors px-2 py-1 rounded-lg"
                style={{ color: 'var(--text-dim)', background: 'var(--bg-card)' }}>← Geri</button>
            )}
            <div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {activeMonth !== null ? `${MONTHS[activeMonth]} ${year}` : 'Giderler'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {activeMonth !== null
                  ? `${monthExpenses(activeMonth).length} kalem · ₺${fmt(monthTotalTRY(activeMonth))}`
                  : `${year} · ₺${fmt(yearTotalTRY)} toplam`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {activeMonth === null && years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={y === year
                  ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 }
                  : { color: 'var(--text-dim)' }}>
                {y}
              </button>
            ))}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-xl ml-1"
              style={{ color: 'var(--text-dim)' }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm animate-pulse" style={{ color: 'var(--text-dim)' }}>Yükleniyor...</p>
            </div>
          ) : activeMonth === null ? (

            /* ── TAKVİM GÖRÜNÜMÜ ── */
            <div className="space-y-4">
              {/* Yıl özet bandı */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Toplam Gider', value: `₺${fmtShort(yearTotalTRY)}`, sub: `${expenses.length} kalem`, color: danger },
                  { label: 'Aktif Ay', value: String(MONTHS.slice(1).filter((_, i) => monthTotalTRY(i+1) > 0).length), sub: 'ay gider var', color: warning },
                  { label: 'Dolar / TL', value: rates ? `₺${rates.usd.toFixed(2)}` : '—', sub: rates ? `1 EUR = ₺${rates.eur.toFixed(2)}` : 'kur yükleniyor', color: 'var(--text-muted)' },
                ].map(c => (
                  <div key={c.label} className="rounded-xl p-3 border"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>{c.label}</p>
                    <p className="text-base font-bold leading-tight" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Ay grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {MONTHS.slice(1).map((_, i) => {
                  const month        = i + 1;
                  const total        = monthTotalTRY(month);
                  const count        = monthExpenses(month).length;
                  const isCurrentMon = month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                  const intensity    = total > 0 ? Math.max(0.06, (total / maxMonthTotal) * 0.22) : 0;
                  const hasMixed     = monthExpenses(month).some(e => e.currency !== 'TRY');

                  return (
                    <button key={month}
                      onClick={() => setActiveMonth(month)}
                      className="rounded-xl p-3 border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      style={{
                        background: total > 0
                          ? isLight ? `rgba(153,27,27,${intensity * 0.6})` : `rgba(239,68,68,${intensity})`
                          : 'var(--bg-card)',
                        borderColor: isCurrentMon ? '#fbbf24' : total > 0
                          ? isLight ? 'rgba(153,27,27,0.25)' : 'rgba(239,68,68,0.25)'
                          : 'var(--border-color)',
                      }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-xs font-bold" style={{ color: isCurrentMon ? '#fbbf24' : 'var(--text-muted)' }}>
                          {MONTHS_SHORT[month]}
                        </p>
                        {count > 0 && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.15)', color: danger }}>
                            {count}
                          </span>
                        )}
                      </div>
                      {total > 0 ? (
                        <>
                          <p className="text-sm font-bold leading-tight" style={{ color: danger }}>
                            ₺{fmtShort(total)}
                          </p>
                          {hasMixed && (
                            <p className="text-[9px] mt-0.5 font-medium" style={{ color: warning }}>
                              döviz var
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>–</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          ) : (

            /* ── AY DETAY GÖRÜNÜMÜ ── */
            <div className="space-y-3">

              {/* Mevcut giderler */}
              {monthExpenses(activeMonth).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Bu ay için gider yok</p>
                </div>
              ) : (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  {monthExpenses(activeMonth).map((exp) => {
                    const tryVal = toTRY(exp.amount, exp.currency);
                    const isForeign = exp.currency !== 'TRY';
                    const casinoName = exp.casino_id ? casinos.find(c => c.id === exp.casino_id)?.name : null;
                    return (
                      <div key={exp.id}
                        className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                        {/* İkon */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: 'rgba(239,68,68,0.1)' }}>
                          💸
                        </div>
                        {/* Bilgi */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{exp.name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {casinoName && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                                {casinoName}
                              </span>
                            )}
                            {exp.note && (
                              <span className="text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>{exp.note}</span>
                            )}
                          </div>
                        </div>
                        {/* Tutar */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: danger }}>
                            {isForeign ? `${exp.currency} ${fmt(exp.amount)}` : `₺${fmt(exp.amount)}`}
                          </p>
                          {isForeign && rates && (
                            <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                              ≈ ₺{fmtShort(tryVal)}
                            </p>
                          )}
                        </div>
                        {/* Sil */}
                        <button onClick={() => deleteExpense(exp.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full text-base flex-shrink-0 transition-all hover:bg-red-500/10"
                          style={{ color: 'var(--text-dim)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {/* Toplam */}
                  <div className="flex items-center justify-between px-4 py-3 border-t"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-accent)' }}>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Toplam</span>
                      {!rates && monthExpenses(activeMonth).some(e => e.currency !== 'TRY') && (
                        <span className="ml-2 text-[10px]" style={{ color: warning }}>⚠ kur yükleniyor</span>
                      )}
                    </div>
                    <span className="text-base font-bold" style={{ color: danger }}>
                      ₺{fmt(monthTotalTRY(activeMonth))}
                    </span>
                  </div>
                </div>
              )}

              {/* Yeni gider formu */}
              <div className="rounded-xl border p-4 space-y-2.5"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  + Yeni Gider
                </p>

                <select value={casinoId} onChange={e => setCasinoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...inputSt, color: casinoId ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  <option value="">— Casino (opsiyonel) —</option>
                  {casinos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputSt} placeholder="Gider adı (Kira, Maaş, Elektrik...)" />

                <div className="flex gap-2">
                  <input type="text" inputMode="decimal" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addExpense(); }}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputSt} placeholder="Tutar" />
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none flex-shrink-0"
                    style={inputSt}>
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Kur önizleme */}
                {amount && currency !== 'TRY' && rates && (() => {
                  const val = parseFloat(amount.replace(',', '.'));
                  if (!val) return null;
                  return (
                    <p className="text-xs px-1" style={{ color: 'var(--text-dim)' }}>
                      ≈ ₺{fmt(toTRY(val, currency))}
                      {currency === 'EUR' && ` · 1 EUR = ₺${rates.eur.toFixed(2)}`}
                      {currency === 'USD' && ` · 1 USD = ₺${rates.usd.toFixed(2)}`}
                    </p>
                  );
                })()}

                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputSt} placeholder="Not (opsiyonel)" />

                {error && <p className="text-xs" style={{ color: '#ef4444' }}>⚠ {error}</p>}

                <button onClick={addExpense} disabled={saving || !name.trim() || !amount}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#fbbf24', color: '#0f0f17' }}>
                  {saving ? 'Kaydediliyor...' : '+ Gider Ekle'}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
