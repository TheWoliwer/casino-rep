'use client';
import { useState, useEffect } from 'react';
import type { Casino, CasinoCol } from '@/lib/supabase';

interface Props {
  casino: Casino;
  cols: CasinoCol[];
  onClose: () => void;
  onSaved: () => void;
}

const PERIOD_LABELS: Record<number, string> = { 0: 'Tek Seferlik', 1: 'Aylık', 2: 'Yıllık' };
const CURRENCIES = ['TRY', 'USD', 'EUR', 'CRYPTO'];
const FEE_TYPE_LABELS: Record<string, string> = { percent: 'Yüzde %', fixed: 'Sabit Tutar', none: 'Yok' };

function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function CasinoModal({ casino, cols, onClose, onSaved }: Props) {
  const [name, setName]       = useState(casino.name);
  const [feeType, setFeeType] = useState<'percent' | 'fixed' | 'none'>(casino.fee_type ?? 'none');
  const [feeRate, setFeeRate] = useState((casino.fee_rate ?? 0).toString());
  const [feeCurrency, setFeeCurrency] = useState(casino.fee_currency ?? 'TRY');
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tooltip, setTooltip] = useState<number | null>(null);

  // Hesaplayıcı
  const [calcAmount, setCalcAmount]     = useState('');
  const [calcCurrency, setCalcCurrency] = useState('TRY');
  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null);

  // New col form
  const [newColName, setNewColName]         = useState('');
  const [newColAmount, setNewColAmount]     = useState('');
  const [newColCurrency, setNewColCurrency] = useState('TRY');
  const [newColPeriod, setNewColPeriod]     = useState(1); // 0=tek, 1=aylık, 2=yıllık
  const [addingCol, setAddingCol]           = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setRates({ usd: parseFloat(d.usd), eur: parseFloat(d.eur) });
    }).catch(() => {});
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (tooltip === null) return;
    const fn = () => setTooltip(null);
    setTimeout(() => window.addEventListener('click', fn), 50);
    return () => window.removeEventListener('click', fn);
  }, [tooltip]);

  async function saveCasino() {
    setSaving(true);
    await fetch(`/api/casinos/${casino.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        fee_type: feeType,
        fee_rate: parseFloat(feeRate) || 0,
        fee_currency: feeType === 'fixed' ? feeCurrency : 'TRY',
      }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  async function deleteCasino() {
    if (!confirm(`"${casino.name}" casinosunu silmek istediğinize emin misiniz? Tüm kayıtlar silinecek.`)) return;
    setDeleting(true);
    await fetch(`/api/casinos/${casino.id}`, { method: 'DELETE' });
    setDeleting(false);
    onSaved();
    onClose();
  }

  async function addCol() {
    if (!newColName.trim()) return;
    setAddingCol(true);
    await fetch('/api/casino-cols', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        casino_id: casino.id,
        name: newColName.trim(),
        amount: parseFloat(newColAmount) || 0,
        currency: newColCurrency,
        monthly: newColPeriod,
      }),
    });
    setAddingCol(false);
    setNewColName('');
    setNewColAmount('');
    onSaved();
  }

  async function deleteCol(colId: number) {
    if (!confirm('Bu kalemi sil?')) return;
    await fetch(`/api/casino-cols?id=${colId}`, { method: 'DELETE' });
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose} style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-white">{casino.name} — Yönet</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Casino adı */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Casino Adı</p>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid #2a2a3e' }} />
          </div>

          {/* Fee Ayarları */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fee Ayarları</p>

            {/* Fee türü */}
            <div className="flex gap-2">
              {(['percent', 'fixed', 'none'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFeeType(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all border"
                  style={feeType === t
                    ? { borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }
                    : { borderColor: 'var(--border-accent)', color: '#64748b', background: 'transparent' }}>
                  {FEE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Fee oranı / tutarı */}
            {feeType !== 'none' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={feeRate}
                  onChange={e => setFeeRate(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  placeholder={feeType === 'percent' ? 'Oran (%)' : 'Tutar'}
                />
                {feeType === 'fixed' && (
                  <select value={feeCurrency} onChange={e => setFeeCurrency(e.target.value)}
                    className="px-2 py-2.5 rounded-xl text-xs outline-none flex-shrink-0"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Fee Hesaplayıcı — sadece yüzde modunda */}
            {feeType === 'percent' && (() => {
              const rate   = parseFloat(feeRate.replace(',', '.')) || 0;
              const amount = parseFloat(calcAmount.replace(',', '.')) || 0;
              const result = amount * rate / 100;
              const fmt = (n: number) => n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

              const toTRY = (n: number, cur: string) => {
                if (!rates) return n;
                if (cur === 'USD') return n * rates.usd;
                if (cur === 'EUR') return n * rates.eur;
                return n;
              };
              const toUSD = (n: number, cur: string) => {
                if (!rates) return n;
                if (cur === 'TRY') return n / rates.usd;
                if (cur === 'EUR') return n * rates.eur / rates.usd;
                return n;
              };

              return (
                <div className="rounded-xl p-3.5 space-y-3 mt-1" style={{ background: 'var(--bg-base)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Fee Hesaplayıcı</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={calcAmount}
                      onChange={e => setCalcAmount(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                      placeholder="Ciro miktarı girin..."
                    />
                    <select
                      value={calcCurrency}
                      onChange={e => setCalcCurrency(e.target.value)}
                      className="px-2 py-2 rounded-xl text-xs outline-none flex-shrink-0"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>

                  {amount > 0 && rate > 0 && (
                    <div className="rounded-lg px-3.5 py-3 space-y-1.5" style={{ background: 'var(--bg-surface)' }}>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">%{rate} fee sonucu</span>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: '#fbbf24' }}>
                            {calcCurrency === 'TRY' ? '₺' : calcCurrency === 'EUR' ? '€' : '$'}{fmt(result)}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">{calcCurrency}</span>
                        </div>
                      </div>
                      {rates && calcCurrency !== 'USD' && (
                        <p className="text-xs text-slate-500 text-right">
                          ≈ ${fmt(toUSD(result, calcCurrency))}
                          {calcCurrency !== 'TRY' && <span className="ml-2">· ₺{fmt(toTRY(result, calcCurrency))}</span>}
                        </p>
                      )}
                      {rates && calcCurrency === 'USD' && (
                        <p className="text-xs text-slate-500 text-right">≈ ₺{fmt(toTRY(result, 'USD'))}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>

          {/* Özel Kalemler */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Özel Kalemler</p>

            {cols.length === 0 && (
              <p className="text-xs text-slate-600 italic">Henüz özel kalem eklenmedi.</p>
            )}

            {cols.map(col => (
              <div key={col.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 relative"
                style={{ background: 'var(--bg-base)', border: '1px solid #1e1e2e' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{col.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {col.currency} · {PERIOD_LABELS[col.monthly] ?? 'Aylık'}
                    {col.amount > 0 && ` · ₺${col.amount}`}
                  </p>
                </div>

                {/* 'i' info butonu */}
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setTooltip(tooltip === col.id ? null : col.id); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-all hover:bg-white/10"
                    style={{ color: '#64748b', border: '1px solid #2a2a3e' }}
                    title="Ekleniş tarihi">
                    i
                  </button>
                  {tooltip === col.id && (
                    <div className="absolute right-0 bottom-8 z-50 rounded-xl p-3 text-xs whitespace-nowrap shadow-xl"
                      style={{ background: 'var(--bg-base)', border: '1px solid #2a2a3e', minWidth: 180 }}
                      onClick={e => e.stopPropagation()}>
                      <p className="text-slate-400 mb-1 font-semibold">Ekleniş tarihi</p>
                      <p className="text-white">{formatDate(col.created_at)}</p>
                    </div>
                  )}
                </div>

                <button onClick={() => deleteCol(col.id)}
                  className="text-red-400 hover:text-red-300 transition-colors text-sm w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/10">
                  ×
                </button>
              </div>
            ))}

            {/* Yeni kalem formu */}
            <div className="rounded-xl p-4 space-y-3 border border-dashed" style={{ borderColor: 'var(--border-accent)' }}>
              <p className="text-xs font-medium text-slate-500">Yeni kalem ekle</p>

              <input type="text" value={newColName} onChange={e => setNewColName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: 'var(--bg-base)', border: '1px solid #2a2a3e' }}
                placeholder="Kalem adı (örn: Depozito, Makina Kirası)" />

              <div className="flex gap-2">
                <input type="number" value={newColAmount} onChange={e => setNewColAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid #2a2a3e' }}
                  placeholder="Tutar" />
                <select value={newColCurrency} onChange={e => setNewColCurrency(e.target.value)}
                  className="px-2 py-2 rounded-xl text-sm text-white outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid #2a2a3e' }}>
                  {['TRY', 'USD', 'EUR', 'CRYPTO'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Period selector */}
              <div className="flex gap-1.5">
                {([1, 2, 0] as const).map(p => (
                  <button key={p} onClick={() => setNewColPeriod(p)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={newColPeriod === p
                      ? { borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }
                      : { borderColor: 'var(--border-accent)', color: '#64748b' }}>
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>

              <button onClick={addCol} disabled={addingCol || !newColName.trim()}
                className="w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all active:scale-95"
                style={{ background: addingCol || !newColName.trim() ? 'var(--border-color)' : '#fbbf24', color: addingCol || !newColName.trim() ? '#475569' : 'var(--bg-base)' }}>
                {addingCol ? 'Ekleniyor...' : '+ Kalem Ekle'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={deleteCasino} disabled={deleting}
            className="px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-60 transition-colors">
            {deleting ? 'Siliniyor...' : 'Casinoyu Sil'}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">İptal</button>
          <button onClick={saveCasino} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all active:scale-95"
            style={{ background: '#fbbf24', color: '#0f0f17' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
