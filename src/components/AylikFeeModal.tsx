'use client';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import type { Casino } from '@/lib/supabase';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const PROVIDERS = [
  { kategori: 'Live Slots', saglayici: 'EGT' },
  { kategori: 'Live Slots', saglayici: 'APEX' },
];

type Extra = { name: string; amount: string; currency: 'TRY' | 'USD' | 'EUR' };
type RowInput = { bet: string; win: string };

export default function AylikFeeModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [step, setStep] = useState(1);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [casinoId, setCasinoId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [usdRate, setUsdRate] = useState<number>(0);
  const [eurRate, setEurRate] = useState<number>(0);
  const [feeFixed, setFeeFixed] = useState('');
  const [rows, setRows] = useState<RowInput[]>(PROVIDERS.map(() => ({ bet: '', win: '' })));
  const [extras, setExtras] = useState<Extra[]>([]);
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

  const parsedRows = rows.map(r => ({ bet: parseNum(r.bet), win: parseNum(r.win) }));
  const totalBet = parsedRows.reduce((s, r) => s + r.bet, 0);
  const totalWin = parsedRows.reduce((s, r) => s + r.win, 0);
  const totalNet = totalWin - totalBet;
  const komisyonTRY = feeType === 'percent'
    ? Math.abs(totalNet) * feeRate / 100
    : feeType === 'fixed' ? parseNum(feeFixed) : 0;
  const komisyonUSD = usdRate ? komisyonTRY / usdRate : 0;

  function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtUSD(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

  function addExtra() {
    setExtras(e => [...e, { name: '', amount: '', currency: 'TRY' }]);
  }
  function removeExtra(i: number) { setExtras(e => e.filter((_, idx) => idx !== i)); }
  function updateExtra(i: number, field: keyof Extra, val: string) {
    setExtras(e => e.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  async function handleKontrolEt() {
    if (!casino) return;
    setSaving(true);
    setError('');
    try {
      const data = {
        casinoName: casino.name,
        feeType,
        feeRate,
        feeFixed: parseNum(feeFixed),
        year,
        month,
        usdRate,
        eurRate,
        rows: PROVIDERS.map((p, i) => ({
          kategori: p.kategori,
          saglayici: p.saglayici,
          bet: parsedRows[i].bet,
          win: parsedRows[i].win,
        })),
        extras: extras.map(e => ({
          name: e.name,
          amount: parseNum(e.amount),
          currency: e.currency,
        })),
      };

      const res = await fetch('/api/fee-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ casino_id: casino.id, year, month, data }),
      });

      if (!res.ok) { const d = await res.json(); setError(d.error || 'Hata'); return; }
      const { id } = await res.json();
      setReportId(id);
      setStep(3);
      window.open(`/reports/fee/${id}`, '_blank');
    } finally {
      setSaving(false);
    }
  }

  function shareUrl() { return `${window.location.origin}/reports/fee/${reportId}`; }

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

  const years = [year - 1, year, year + 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden max-h-[92vh]"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            {step > 1 && step < 3 && (
              <button onClick={() => setStep(s => s - 1)}
                className="text-sm transition-colors"
                style={{ color: 'var(--text-dim)' }}>←</button>
            )}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {step === 1 ? 'Adım 1 / 2' : step === 2 ? 'Adım 2 / 2' : 'Rapor Hazır'}
              </p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {step === 1 ? 'Casino & Dönem Seç' : step === 2 ? 'Verileri Gir' : 'Önizleme Açıldı'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-xl"
            style={{ color: 'var(--text-dim)' }}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Casino</label>
                <select value={casinoId} onChange={e => setCasinoId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}>
                  <option value="">— Casino seç —</option>
                  {casinos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {casino && (
                <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                  <p style={{ color: 'var(--text-dim)' }}>Fee Tipi:
                    <span className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>
                      {feeType === 'percent' ? `Yüzde — %${feeRate}` : feeType === 'fixed' ? 'Sabit tutar' : 'Yok'}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Yıl</label>
                <div className="flex gap-2">
                  {years.map(y => (
                    <button key={y} onClick={() => setYear(y)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={y === year
                        ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 }
                        : inputStyle}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Ay</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {MONTHS.slice(1).map((m, i) => (
                    <button key={i+1} onClick={() => setMonth(i+1)}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={month === i+1
                        ? { background: '#fbbf24', color: '#0f0f17', fontWeight: 700 }
                        : inputStyle}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!casinoId}
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#fbbf24', color: '#0f0f17' }}>
                Devam →
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              {/* Fee fixed input */}
              {feeType === 'fixed' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Sabit Komisyon Tutarı (TRY)</label>
                  <input type="text" inputMode="decimal" value={feeFixed} onChange={e => setFeeFixed(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle} placeholder="0,00" />
                </div>
              )}

              {/* Provider rows */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div className="px-3 py-2 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Sağlayıcı Verileri</p>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {PROVIDERS.map((p, i) => (
                    <div key={i} className="p-3 space-y-2" style={{ background: 'var(--bg-base)' }}>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {p.kategori} — <span style={{ color: '#fbbf24' }}>{p.saglayici}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-dim)' }}>Toplam Bet (TRY)</label>
                          <input type="text" inputMode="decimal" value={rows[i].bet}
                            onChange={e => setRows(r => r.map((row, idx) => idx === i ? { ...row, bet: e.target.value } : row))}
                            className="w-full px-2.5 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} placeholder="0,00" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-dim)' }}>Toplam Win (TRY)</label>
                          <input type="text" inputMode="decimal" value={rows[i].win}
                            onChange={e => setRows(r => r.map((row, idx) => idx === i ? { ...row, win: e.target.value } : row))}
                            className="w-full px-2.5 py-2 rounded-lg text-sm outline-none"
                            style={inputStyle} placeholder="0,00" />
                        </div>
                      </div>
                      {(parsedRows[i].bet > 0 || parsedRows[i].win > 0) && (
                        <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                          Net: <span style={{ color: (parsedRows[i].win - parsedRows[i].bet) < 0 ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
                            {fmt(parsedRows[i].win - parsedRows[i].bet)} ₺
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Özet */}
              {(totalBet > 0 || totalWin > 0) && (
                <div className="rounded-xl p-3 space-y-1.5 text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-dim)' }}>Toplam Bet</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(totalBet)} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-dim)' }}>Toplam Win</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(totalWin)} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-dim)' }}>Net Kar/Zarar</span>
                    <span style={{ color: totalNet < 0 ? '#fca5a5' : '#86efac', fontWeight: 700 }}>{fmt(totalNet)} ₺</span>
                  </div>
                  {feeType !== 'none' && (
                    <>
                      <div className="h-px my-1" style={{ background: 'var(--border-accent)' }} />
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-dim)' }}>
                          {feeType === 'percent' ? `Komisyon (%${feeRate})` : 'Komisyon (Sabit)'}
                        </span>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                          {fmt(komisyonTRY)} ₺ {usdRate ? `/ ${fmtUSD(komisyonUSD)}$` : ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Ekstra kalemler */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Ekstra Kalemler</p>
                  <button onClick={addExtra}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: '#fbbf24' }}>
                    + Ekle
                  </button>
                </div>
                {extras.map((ex, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={ex.name} onChange={e => updateExtra(i, 'name', e.target.value)}
                      className="flex-1 px-2.5 py-2 rounded-lg text-sm outline-none"
                      style={inputStyle} placeholder="Kalem adı" />
                    <input type="text" inputMode="decimal" value={ex.amount} onChange={e => updateExtra(i, 'amount', e.target.value)}
                      className="w-28 px-2.5 py-2 rounded-lg text-sm outline-none"
                      style={inputStyle} placeholder="Tutar" />
                    <select value={ex.currency} onChange={e => updateExtra(i, 'currency', e.target.value)}
                      className="px-2 py-2 rounded-lg text-sm outline-none"
                      style={inputStyle}>
                      <option>TRY</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                    <button onClick={() => removeExtra(i)} className="text-base" style={{ color: '#ef4444' }}>×</button>
                  </div>
                ))}
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button onClick={handleKontrolEt} disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#fbbf24', color: '#0f0f17' }}>
                {saving ? 'Hazırlanıyor...' : 'Kontrol Et — Önizle'}
              </button>
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-5 text-center space-y-2"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                <p className="text-2xl">✅</p>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Rapor hazır! Yeni sekmede açıldı.
                </p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Raporu inceleyip PDF olarak kaydedebilirsin.
                </p>
              </div>

              <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)' }}>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-dim)' }}>Paylaşım Linki</p>
                <div className="flex gap-2">
                  <input readOnly value={reportId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reports/fee/${reportId}` : ''}
                    className="flex-1 px-2.5 py-2 rounded-lg text-xs outline-none truncate"
                    style={inputStyle} />
                  <button onClick={copyLink}
                    className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: copied ? '#22c55e' : '#fbbf24', color: '#0f0f17' }}>
                    {copied ? '✓' : 'Kopyala'}
                  </button>
                </div>
              </div>

              <button onClick={() => window.open(`/reports/fee/${reportId}`, '_blank')}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                📄 Raporu Tekrar Aç
              </button>

              <button onClick={() => { setStep(1); setCasinoId(''); setRows(PROVIDERS.map(() => ({ bet: '', win: '' }))); setExtras([]); setReportId(''); }}
                className="w-full py-2 rounded-xl text-xs transition-all"
                style={{ color: 'var(--text-dim)' }}>
                Yeni rapor oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
