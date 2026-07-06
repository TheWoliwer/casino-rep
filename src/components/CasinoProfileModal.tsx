'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Casino, FeeRow, Transaction } from '@/lib/supabase';

interface Props {
  casino: Casino;
  onClose: () => void;
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

type HistoryEvent = {
  key: string;
  kind: 'entry' | 'payment';
  date: string | null;
  amount: number; // TRY
  note: string;
  month: number;
  year: number;
};

export default function CasinoProfileModal({ casino, onClose }: Props) {
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usdRate, setUsdRate] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [fRes, tRes] = await Promise.all([
      fetch(`/api/fee-rows?casino_id=${casino.id}`),
      fetch(`/api/transactions?casino_id=${casino.id}`),
    ]);
    const f = await fRes.json();
    const t = await tRes.json();
    if (!fRes.ok || !tRes.ok) {
      setError(f?.error || t?.error || 'Geçmiş yüklenemedi');
      setFeeRows([]);
      setTransactions([]);
    } else {
      setFeeRows(Array.isArray(f) ? f : []);
      setTransactions(Array.isArray(t) ? t : []);
    }
    setLoading(false);
  }, [casino.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setUsdRate(parseFloat(d.usd));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const toUSD = (n: number) => usdRate ? n / usdRate : n;

  // Genel özet — tüm zamanlar
  const expected    = feeRows.reduce((s, r) => s + (r.turnover ?? 0), 0);
  const collected   = feeRows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const outstanding = Math.max(0, expected - collected);
  const rate        = expected > 0 ? Math.min(100, (collected / expected) * 100) : 0;

  // Zaman çizelgesi: borç girişleri + ödemeler tek listede
  const rowById = new Map(feeRows.map(r => [r.id, r]));
  const events: HistoryEvent[] = [
    ...feeRows
      .filter(r => (r.turnover ?? 0) > 0 || (r.paid_amount ?? 0) > 0)
      .map((r): HistoryEvent => ({
        key: `entry-${r.id}`,
        kind: 'entry',
        date: r.created_at ?? null,
        amount: r.turnover ?? 0,
        note: r.note || '',
        month: r.month,
        year: r.year,
      })),
    ...transactions.map((t): HistoryEvent => {
      const row = rowById.get(t.fee_row_id);
      return {
        key: `tx-${t.id}`,
        kind: 'payment',
        date: t.created_at ?? null,
        amount: t.paid_amount ?? 0,
        note: t.note || '',
        month: row?.month ?? 0,
        year: row?.year ?? 0,
      };
    }),
  ].sort((a, b) => {
    if (!a.date && !b.date) return (b.year - a.year) || (b.month - a.month);
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose} style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
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
        <div className="px-4 sm:px-5 py-3.5 border-b flex-shrink-0 space-y-3"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Beklenen',      try: expected,    color: '#94a3b8' },
              { label: 'Tahsil Edilen', try: collected,   color: collected > 0 ? '#86efac' : '#475569' },
              { label: 'Bekleyen',      try: outstanding, color: outstanding > 0 ? '#fca5a5' : '#86efac' },
            ].map(c => (
              <div key={c.label} className="rounded-xl py-2.5 px-2 text-center" style={{ background: 'var(--bg-base)' }}>
                <p className="text-[10px] text-slate-500 mb-1">{c.label}</p>
                <p className="text-sm font-bold leading-tight" style={{ color: c.color }}>${fmtUSD(toUSD(c.try))}</p>
                <p className="text-[10px] text-slate-600 leading-tight">₺{fmt(c.try)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tüm zamanlar tahsilat oranı</span>
              <span className="font-bold" style={{ color: rate >= 100 ? '#86efac' : rate > 50 ? '#fbbf24' : '#fca5a5' }}>
                %{rate.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-accent)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${rate}%`, background: rate >= 100 ? '#22c55e' : rate > 50 ? '#fbbf24' : '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Hareket listesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <p className="text-slate-500 text-sm animate-pulse text-center py-8">Yükleniyor...</p>
          ) : error ? (
            <p className="text-red-400 text-sm text-center py-8">Hata: {error}</p>
          ) : events.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">Henüz hareket kaydı yok.</p>
              <p className="text-slate-600 text-xs mt-1">Borç girişi veya ödeme yapıldığında burada görünür.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(ev => {
                const isPayment = ev.kind === 'payment';
                return (
                  <div key={ev.key} className="rounded-xl p-3.5 border"
                    style={{ background: 'var(--bg-base)', borderColor: 'var(--border-accent)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={isPayment
                            ? { background: 'rgba(34,197,94,0.12)', color: '#86efac' }
                            : { background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                          {isPayment ? '💰' : '📝'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: isPayment ? '#86efac' : 'var(--text-primary)' }}>
                            {isPayment ? 'Ödeme alındı' : 'Borç girişi yapıldı'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ev.month > 0 && <>{MONTHS[ev.month]} {ev.year} dönemi</>}
                            {ev.month > 0 && ev.date && <span className="text-slate-600"> · </span>}
                            {ev.date && formatDate(ev.date)}
                          </p>
                          {ev.note && <p className="text-xs text-slate-400 mt-1 truncate">&quot;{ev.note}&quot;</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold" style={{ color: isPayment ? '#86efac' : 'var(--text-primary)' }}>
                          {isPayment ? '+' : ''}₺{fmt(ev.amount)}
                        </p>
                        {usdRate && (
                          <p className="text-[10px] text-slate-500">${fmtUSD(toUSD(ev.amount))}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-xs text-slate-500">{events.length} hareket</span>
          <button onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: '#fbbf24', color: '#0f0f17' }}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
