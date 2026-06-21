'use client';
import { useState, useEffect } from 'react';
import type { Expense, Casino } from '@/lib/supabase';
import { useTheme } from '@/components/ThemeProvider';

const MONTHS = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_SHORT = ['', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                      'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const CURRENCIES = ['TRY', 'USD', 'EUR', 'CRYPTO'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  year: number;
  onClose: () => void;
}

export default function GiderlerModal({ year: initialYear, onClose }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [year, setYear]           = useState(initialYear);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [casinos, setCasinos]     = useState<Casino[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeMonth, setActiveMonth] = useState<number | null>(null);

  // Form
  const [name, setName]         = useState('');
  const [amount, setAmount]     = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [note, setNote]         = useState('');
  const [casinoId, setCasinoId] = useState<string>('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function load() {
    setLoading(true);
    const [expRes, casinoRes] = await Promise.all([
      fetch(`/api/expenses?year=${year}`),
      fetch('/api/casinos'),
    ]);
    const expData    = await expRes.json();
    const casinoData = await casinoRes.json();
    setExpenses(Array.isArray(expData) ? expData : []);
    setCasinos(Array.isArray(casinoData) ? casinoData : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [year]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeMonth !== null) setActiveMonth(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, activeMonth]);

  function monthTotal(month: number) {
    return expenses.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0);
  }

  function monthExpenses(month: number) {
    return expenses.filter(e => e.month === month);
  }

  async function addExpense() {
    if (!name.trim() || !amount || activeMonth === null) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), amount: parseFloat(amount.replace(',', '.')), currency, year, month: activeMonth, note, casino_id: casinoId ? parseInt(casinoId) : null }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || 'Hata oluştu');
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

  const yearTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const years = [year - 1, year, year + 1];

  const cellBg = (month: number) => {
    const total = monthTotal(month);
    if (total === 0) return { bg: 'var(--bg-card)', border: 'var(--border-color)', text: 'var(--text-dim)' };
    return isLight
      ? { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' }
      : { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' };
  };

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
                className="text-slate-400 hover:text-white transition-colors text-lg">←</button>
            )}
            <div>
              <h2 className="font-bold text-white text-base">
                {activeMonth !== null ? `${MONTHS[activeMonth]} ${year} — Giderler` : 'Giderler'}
              </h2>
              {activeMonth === null && (
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {year} toplamı: ₺{fmt(yearTotal)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeMonth === null && (
              <div className="flex items-center gap-1">
                {years.map(y => (
                  <button key={y} onClick={() => setYear(y)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={y === year
                      ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 }
                      : { color: 'var(--text-dim)' }}>
                    {y}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-xl transition-all"
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {MONTHS.slice(1).map((_, i) => {
                const month = i + 1;
                const total = monthTotal(month);
                const c = cellBg(month);
                const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                return (
                  <button key={month}
                    onClick={() => setActiveMonth(month)}
                    className="rounded-xl p-3 border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: c.bg, borderColor: isCurrentMonth ? '#fbbf24' : c.border }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: isCurrentMonth ? '#fbbf24' : 'var(--text-muted)' }}>
                      {MONTHS_SHORT[month]}
                    </p>
                    {total > 0 ? (
                      <>
                        <p className="text-sm font-bold leading-tight" style={{ color: c.text }}>
                          ₺{fmt(total)}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          {expenses.filter(e => e.month === month).length} kalem
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium" style={{ color: 'var(--text-dim)' }}>–</p>
                    )}
                  </button>
                );
              })}
            </div>

          ) : (

            /* ── AY DETAY GÖRÜNÜMÜ ── */
            <div className="space-y-4">

              {/* Mevcut giderler */}
              {monthExpenses(activeMonth).length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-accent)' }}>
                  {monthExpenses(activeMonth).map((exp, i) => (
                    <div key={exp.id}
                      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0"
                      style={{ background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{exp.name}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {exp.casino_id && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                              {casinos.find(c => c.id === exp.casino_id)?.name ?? '–'}
                            </span>
                          )}
                          {exp.note && <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>{exp.note}</p>}
                        </div>
                      </div>
                      <p className="text-sm font-bold flex-shrink-0" style={{ color: isLight ? '#991b1b' : '#fca5a5' }}>
                        {exp.currency !== 'TRY' ? `${exp.currency} ` : '₺'}{fmt(exp.amount)}
                      </p>
                      <button onClick={() => deleteExpense(exp.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-base leading-none transition-colors flex-shrink-0"
                        style={{ color: 'var(--text-dim)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                        ×
                      </button>
                    </div>
                  ))}
                  {/* Toplam */}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-accent)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Toplam</span>
                    <span className="text-base font-bold" style={{ color: isLight ? '#991b1b' : '#fca5a5' }}>
                      ₺{fmt(monthTotal(activeMonth))}
                    </span>
                  </div>
                </div>
              )}

              {/* Yeni gider formu */}
              <div className="rounded-xl border p-4 space-y-3"
                style={{ background: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  Yeni Gider Ekle
                </p>

                <select
                  value={casinoId}
                  onChange={e => setCasinoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: casinoId ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  <option value="">— Casino seç (opsiyonel) —</option>
                  {casinos.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  placeholder="Gider adı (Kira, Maaş, Elektrik...)"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addExpense(); }}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                    placeholder="Tutar"
                  />
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm outline-none flex-shrink-0"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  placeholder="Not (opsiyonel)"
                />

                {error && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>⚠ {error}</p>
                )}

                <button
                  onClick={addExpense}
                  disabled={saving || !name.trim() || !amount}
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
