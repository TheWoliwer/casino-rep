'use client';
import { useState } from 'react';

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

const CURRENCIES = ['TRY', 'USD', 'EUR', 'CRYPTO'];

export default function AddCasinoModal({ onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [feeType, setFeeType] = useState<'percent' | 'fixed' | 'none'>('percent');
  const [feeRate, setFeeRate] = useState('');
  const [feeCurrency, setFeeCurrency] = useState('TRY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    if (!name.trim()) { setError('İsim zorunlu'); return; }
    setSaving(true);
    const res = await fetch('/api/casinos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        fee_type: feeType,
        fee_rate: parseFloat(feeRate) || 0,
        fee_currency: feeType === 'fixed' ? feeCurrency : 'TRY',
      }),
    });
    setSaving(false);
    if (res.ok) { onAdded(); onClose(); }
    else { const d = await res.json(); setError(d.error || 'Hata'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-sm rounded-xl border overflow-hidden"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold text-white">Casino Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Casino Adı</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
              placeholder="Casino adı" autoFocus />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fee Türü</label>
            <div className="flex gap-2">
              {(['percent', 'fixed', 'none'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFeeType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${feeType === t ? 'border-amber-400/50 text-amber-400 bg-amber-400/10' : 'text-slate-500'}`}
                  style={feeType !== t ? { borderColor: 'var(--border-accent)' } : {}}>
                  {t === 'percent' ? 'Yüzde' : t === 'fixed' ? 'Sabit' : 'Yok'}
                </button>
              ))}
            </div>
          </div>

          {feeType !== 'none' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {feeType === 'percent' ? 'Fee Oranı (%)' : 'Sabit Tutar'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={feeRate}
                  onChange={e => setFeeRate(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  placeholder="0"
                />
                {feeType === 'fixed' && (
                  <select
                    value={feeCurrency}
                    onChange={e => setFeeCurrency(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">
            İptal
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all active:scale-95"
            style={{ background: '#fbbf24', color: '#0f0f17' }}>
            {saving ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}
