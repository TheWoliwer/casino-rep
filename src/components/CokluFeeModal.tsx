'use client';
import { useState, useEffect } from 'react';
import type { Casino } from '@/lib/supabase';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const PROVIDERS = [
  { kategori: 'Live Slots', saglayici: 'EGT' },
  { kategori: 'Live Slots', saglayici: 'APEX' },
];

type Extra = { name: string; amount: string; currency: 'TRY' | 'USD' | 'EUR' };
type RowInput = { kategori: string; saglayici: string; bet: string; win: string };
type MonthBlock = { id: string; year: number; month: number; feeFixed: string; rows: RowInput[]; extras: Extra[] };

function uid() { return Math.random().toString(36).slice(2, 10); }
function defaultRows(): RowInput[] { return PROVIDERS.map(p => ({ kategori: p.kategori, saglayici: p.saglayici, bet: '', win: '' })); }

function defaultMonths(): MonthBlock[] {
  const now = new Date();
  const curY = now.getFullYear(), curM = now.getMonth() + 1;
  let prevY = curY, prevM = curM - 1;
  if (prevM === 0) { prevM = 12; prevY -= 1; }
  return [
    { id: uid(), year: prevY, month: prevM, feeFixed: '', rows: defaultRows(), extras: [] },
    { id: uid(), year: curY, month: curM, feeFixed: '', rows: defaultRows(), extras: [] },
  ];
}

export default function CokluFeeModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [casinoId, setCasinoId] = useState('');
  const [usdRate, setUsdRate] = useState<number>(0);
  const [eurRate, setEurRate] = useState<number>(0);
  const [combineMode, setCombineMode] = useState<'separate' | 'combined'>('separate');
  const [months, setMonths] = useState<MonthBlock[]>(defaultMonths());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reportId, setReportId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/casinos').then(r => r.json()).then(d => setCasinos(Array.isArray(d) ? d : []));
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setUsdRate(parseFloat(d.usd));
      if (d.eur) setEurRate(parseFloat(d.eur));
    });
  }, []);

  const casino = casinos.find(c => c.id === parseInt(casinoId));
  const feeType = casino?.fee_type ?? 'none';
  const feeRate = casino?.fee_rate ?? 0;

  function parseNum(s: string) { return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0; }
  function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function addMonth() {
    const last = months[months.length - 1];
    let y = last ? last.year : new Date().getFullYear();
    let mo = last ? last.month + 1 : new Date().getMonth() + 1;
    if (mo > 12) { mo = 1; y += 1; }
    setMonths(m => [...m, { id: uid(), year: y, month: mo, feeFixed: '', rows: defaultRows(), extras: [] }]);
  }
  function removeMonth(id: string) { setMonths(m => m.filter(x => x.id !== id)); }
  function updateMonth(id: string, field: 'year' | 'month' | 'feeFixed', value: string) {
    setMonths(m => m.map(x => x.id === id ? { ...x, [field]: field === 'feeFixed' ? value : parseInt(value) || 0 } : x));
  }
  function updateRow(monthId: string, idx: number, field: keyof RowInput, value: string) {
    setMonths(m => m.map(x => x.id === monthId ? { ...x, rows: x.rows.map((r, i) => i === idx ? { ...r, [field]: value } : r) } : x));
  }
  function addExtra(monthId: string) {
    setMonths(m => m.map(x => x.id === monthId ? { ...x, extras: [...x.extras, { name: '', amount: '', currency: 'TRY' }] } : x));
  }
  function removeExtra(monthId: string, idx: number) {
    setMonths(m => m.map(x => x.id === monthId ? { ...x, extras: x.extras.filter((_, i) => i !== idx) } : x));
  }
  function updateExtra(monthId: string, idx: number, field: keyof Extra, value: string) {
    setMonths(m => m.map(x => x.id === monthId ? { ...x, extras: x.extras.map((e, i) => i === idx ? { ...e, [field]: value } : e) } : x));
  }

  async function handleOlustur() {
    if (!casino) return;
    setSaving(true);
    setError('');
    try {
      const data = {
        type: 'multi',
        casinoName: casino.name,
        feeType,
        feeRate,
        usdRate,
        eurRate,
        combineMode,
        months: months.map(m => ({
          year: m.year,
          month: m.month,
          feeFixed: parseNum(m.feeFixed),
          rows: m.rows.map(r => ({ kategori: r.kategori, saglayici: r.saglayici, bet: parseNum(r.bet), win: parseNum(r.win) })),
          extras: m.extras.map(e => ({ name: e.name, amount: parseNum(e.amount), currency: e.currency })),
        })),
      };
      const last = months[months.length - 1];
      const res = await fetch('/api/fee-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: casino.id, year: last.year, month: last.month, data }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Hata'); return; }
      const { id } = await res.json();
      setReportId(id);
      setStep(3);
      window.open(`/reports/fee-multi/${id}`, '_blank');
    } finally {
      setSaving(false);
    }
  }

  function shareUrl() { return `${window.location.origin}/reports/fee-multi/${reportId}`; }
  function copyLink() {
    navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-accent)',
    color: 'var(--text-primary)',
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-xl rounded-2xl flex flex-col overflow-hidden max-h-[92vh]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            {step > 1 && step < 3 && (
              <button onClick={() => setStep(s => s - 1)} className="text-sm" style={{ color: 'var(--text-dim)' }}>←</button>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {step === 1 ? 'Adım 1 / 2' : step === 2 ? 'Adım 2 / 2' : 'Rapor Hazır'}
              </p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {step === 1 ? 'Casino Seç' : step === 2 ? 'Aylık Verileri Gir' : 'Önizleme Açıldı'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-xl" style={{ color: 'var(--text-dim)' }}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Casino</label>
                <select value={casinoId} onChange={e => setCasinoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                  <option value="">— Casino seç —</option>
                  {casinos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {casino && (
                <div className="px-3 py-2.5 rounded-xl text-xs space-y-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                  <p style={{ color: 'var(--text-dim)' }}>Fee Tipi:
                    <span className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>
                      {feeType === 'percent' ? `Yüzde — %${feeRate}` : feeType === 'fixed' ? 'Sabit tutar' : 'Yok'}
                    </span>
                  </p>
                  <p style={{ color: 'var(--text-dim)' }}>Güncel Kur:
                    <span className="font-semibold ml-1" style={{ color: 'var(--accent)' }}>
                      {usdRate ? `1 USD = ₺${fmt(usdRate)}` : 'yükleniyor...'} {eurRate ? `· 1 EUR = ₺${fmt(eurRate)}` : ''}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Sayfa Düzeni</label>
                <div className="flex gap-2">
                  <button onClick={() => setCombineMode('separate')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={combineMode === 'separate' ? { background: 'var(--accent)', color: 'var(--accent-contrast)' } : inputStyle}>
                    Ayrı Sayfalar
                  </button>
                  <button onClick={() => setCombineMode('combined')}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={combineMode === 'combined' ? { background: 'var(--accent)', color: 'var(--accent-contrast)' } : inputStyle}>
                    Tek Sayfada Birleşik
                  </button>
                </div>
              </div>

              <button disabled={!casinoId} onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                Devam →
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              {months.map((m, mi) => (
                <div key={m.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                    <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Ay #{mi + 1}: {MONTHS[m.month]} {m.year}</p>
                    {months.length > 1 && (
                      <button onClick={() => removeMonth(m.id)} className="text-xs" style={{ color: '#ef4444' }}>✕ Kaldır</button>
                    )}
                  </div>
                  <div className="p-3 space-y-3" style={{ background: 'var(--bg-base)' }}>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-dim)' }}>Yıl</label>
                        <input type="number" value={m.year} onChange={e => updateMonth(m.id, 'year', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-dim)' }}>Ay</label>
                        <select value={m.month} onChange={e => updateMonth(m.id, 'month', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                          {MONTHS.slice(1).map((name, idx) => <option key={idx + 1} value={idx + 1}>{name}</option>)}
                        </select>
                      </div>
                    </div>

                    {feeType === 'fixed' && (
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-dim)' }}>Sabit Komisyon Tutarı (TRY)</label>
                        <input type="text" inputMode="decimal" value={m.feeFixed} onChange={e => updateMonth(m.id, 'feeFixed', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="0,00" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Sağlayıcı Verileri</p>
                      {m.rows.map((r, ri) => (
                        <div key={ri} className="rounded-lg p-2.5 space-y-2" style={{ background: 'var(--bg-card)' }}>
                          <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {r.kategori} — <span style={{ color: 'var(--accent)' }}>{r.saglayici}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" inputMode="decimal" value={r.bet} onChange={e => updateRow(m.id, ri, 'bet', e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Bet 0,00" />
                            <input type="text" inputMode="decimal" value={r.win} onChange={e => updateRow(m.id, ri, 'win', e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Win 0,00" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Ekstra Kalemler</p>
                        <button onClick={() => addExtra(m.id)} className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>+ Ekle</button>
                      </div>
                      {m.extras.map((ex, ei) => (
                        <div key={ei} className="flex gap-2 items-center">
                          <input type="text" value={ex.name} onChange={e => updateExtra(m.id, ei, 'name', e.target.value)}
                            className="flex-1 px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Kalem adı" />
                          <input type="text" inputMode="decimal" value={ex.amount} onChange={e => updateExtra(m.id, ei, 'amount', e.target.value)}
                            className="w-24 px-2.5 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Tutar" />
                          <select value={ex.currency} onChange={e => updateExtra(m.id, ei, 'currency', e.target.value)}
                            className="px-2 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                            <option>TRY</option><option>USD</option><option>EUR</option>
                          </select>
                          <button onClick={() => removeExtra(m.id, ei)} className="text-base" style={{ color: '#ef4444' }}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addMonth}
                className="w-full py-2.5 rounded-xl text-xs font-bold border transition-colors"
                style={{ borderColor: 'var(--border-accent)', color: 'var(--accent)' }}>
                + Ay Ekle
              </button>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button onClick={handleOlustur} disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}>
                {saving ? 'Hazırlanıyor...' : `Raporu Oluştur (${months.length} Ay)`}
              </button>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5 text-center space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                <p className="text-2xl">✅</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Rapor hazır! Yeni sekmede açıldı.</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{months.length} aylık veriyi içeren PDF'i inceleyip kaydedebilirsin.</p>
              </div>

              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-dim)' }}>Paylaşım Linki</p>
                <div className="flex gap-2">
                  <input readOnly value={reportId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reports/fee-multi/${reportId}` : ''}
                    className="flex-1 px-2.5 py-2 rounded-lg text-xs outline-none truncate" style={inputStyle} />
                  <button onClick={copyLink} className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: copied ? '#22c55e' : 'var(--accent)', color: 'var(--accent-contrast)' }}>
                    {copied ? '✓' : 'Kopyala'}
                  </button>
                </div>
              </div>

              <button onClick={() => window.open(`/reports/fee-multi/${reportId}`, '_blank')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                📄 Raporu Tekrar Aç
              </button>

              <a href="/reports/fee" className="block w-full py-2.5 rounded-xl text-xs font-medium text-center transition-all"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-dim)' }}>
                🗂️ Tüm Fee Raporları
              </a>

              <button onClick={() => { setStep(1); setCasinoId(''); setMonths(defaultMonths()); setReportId(''); }}
                className="w-full py-2 rounded-xl text-xs transition-all" style={{ color: 'var(--text-dim)' }}>
                Yeni rapor oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
