'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Casino, FeeRow, CasinoCol, ColEntry, Transaction, DebtItem } from '@/lib/supabase';

interface Props {
  casino: Casino;
  month: number;
  year: number;
  feeRow: FeeRow | null;
  cols: CasinoCol[];
  colEntries: ColEntry[];
  onClose: () => void;
  onSaved: () => void;
}

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const DEFAULT_PRESETS = ['MAKİNA KİRASI', 'DEPOZİTO', 'SERVER ÜCRETİ', 'RTP', 'KİRA', 'BAKIM'];
const CURRENCIES      = ['TRY', 'USD', 'EUR', 'CRYPTO'];
const PRESET_KEY      = 'debt_presets';
const DEF_CURRENCY_KEY = 'default_currency';

function getDefaultCurrency() {
  try { return localStorage.getItem(DEF_CURRENCY_KEY) || 'TRY'; } catch { return 'TRY'; }
}

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
function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FeeModal({ casino, month, year, feeRow, cols, colEntries, onClose, onSaved }: Props) {
  // Debt items — named breakdown stored as JSON
  const [debtItems, setDebtItems] = useState<DebtItem[]>(() => feeRow?.debt_items || []);
  // Manual total — used only when no debt items (backward compat)
  const [manualBorc, setManualBorc] = useState(
    () => (feeRow?.debt_items?.length ? '' : (feeRow?.turnover?.toString() || ''))
  );

  // New item form state
  const [itemName, setItemName]         = useState('');
  const [itemAmount, setItemAmount]     = useState('');
  const [itemCurrency, setItemCurrency] = useState(() => getDefaultCurrency());
  const itemAmountRef = useRef<HTMLInputElement>(null);
  const itemNameRef   = useRef<HTMLInputElement>(null);

  const [newPayment, setNewPayment]         = useState(() => (feeRow?.paid_amount ?? 0).toString());
  const [paymentCurrency, setPaymentCurrency] = useState('TRY');
  const [note, setNote]             = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [histError, setHistError]     = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [histLoading, setHistLoading]   = useState(false);

  const [rates, setRates] = useState<{ usd: number; eur: number } | null>(null);

  // Preset management
  const [presets, setPresets] = useState<string[]>(DEFAULT_PRESETS);
  const [showPresetPanel, setShowPresetPanel] = useState(false);
  const [newPresetName, setNewPresetName]     = useState('');
  const [editingIdx, setEditingIdx]           = useState<number | null>(null);
  const [editingVal, setEditingVal]           = useState('');

  function savePresets(updated: string[]) {
    setPresets(updated);
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(updated)); } catch {}
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: PRESET_KEY, value: JSON.stringify(updated) }),
    }).catch(() => {});
  }
  function addPreset() {
    const name = newPresetName.trim().toUpperCase();
    if (!name || presets.includes(name)) return;
    savePresets([...presets, name]);
    setNewPresetName('');
  }
  function deletePreset(idx: number) {
    savePresets(presets.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }
  function commitEdit(idx: number) {
    const name = editingVal.trim().toUpperCase();
    if (name) savePresets(presets.map((p, i) => i === idx ? name : p));
    setEditingIdx(null);
  }

  const [defaultCurrency, setDefaultCurrency] = useState(() => getDefaultCurrency());
  function changeDefaultCurrency(c: string) {
    setDefaultCurrency(c);
    setItemCurrency(c);
    try { localStorage.setItem(DEF_CURRENCY_KEY, c); } catch {}
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: DEF_CURRENCY_KEY, value: c }),
    }).catch(() => {});
  }

  useEffect(() => {
    fetch('/api/currency').then(r => r.json()).then(d => {
      if (d.usd) setRates({ usd: parseFloat(d.usd), eur: parseFloat(d.eur) });
    });
  }, []);

  // DB'den preset etiketler ve varsayılan para birimi yükle
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((rows: { k: string; v: string }[]) => {
        const presetsRow  = rows.find(r => r.k === PRESET_KEY);
        const currencyRow = rows.find(r => r.k === DEF_CURRENCY_KEY);
        if (presetsRow) {
          try { setPresets(JSON.parse(presetsRow.v)); } catch {}
        } else {
          // localStorage fallback (eski kullanıcılar için)
          try {
            const saved = localStorage.getItem(PRESET_KEY);
            if (saved) setPresets(JSON.parse(saved));
          } catch {}
        }
        if (currencyRow) {
          setDefaultCurrency(currencyRow.v);
          setItemCurrency(currencyRow.v);
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem(PRESET_KEY);
          if (saved) setPresets(JSON.parse(saved));
        } catch {}
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toTRY(amount: number, currency: string): number {
    if (!rates) return amount;
    if (currency === 'USD' || currency === 'CRYPTO') return amount * rates.usd;
    if (currency === 'EUR') return amount * rates.eur;
    return amount;
  }
  function toUSD(amountTRY: number): number {
    if (!rates || rates.usd === 0) return amountTRY;
    return amountTRY / rates.usd;
  }

  const [colState, setColState] = useState<Record<number, { amount: string; status: number; note: string }>>(() => {
    const s: Record<number, { amount: string; status: number; note: string }> = {};
    for (const col of cols) {
      const entry = colEntries.find(e => e.col_id === col.id);
      s[col.id] = { amount: entry?.amount?.toString() || '', status: entry?.status ?? 0, note: entry?.note || '' };
    }
    return s;
  });

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (showHistory) setShowHistory(false); else onClose(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, showHistory]);

  const loadHistory = useCallback(async () => {
    if (!feeRow) return;
    setHistLoading(true);
    setHistError('');
    const res  = await fetch(`/api/transactions?fee_row_id=${feeRow.id}`);
    const data = await res.json();
    if (!res.ok) {
      setHistError(data.error || 'Geçmiş yüklenemedi');
      setTransactions([]);
    } else {
      setTransactions(Array.isArray(data) ? data : []);
    }
    setHistLoading(false);
  }, [feeRow]);

  useEffect(() => { if (showHistory) loadHistory(); }, [showHistory, loadHistory]);

  // TRY cinsinden toplam borç (DB'ye kaydedilen)
  const totalBorcTRY = debtItems.length > 0
    ? debtItems.reduce((s, i) => s + toTRY(i.amount, i.currency), 0)
    : (parseFloat(manualBorc.replace(',', '.')) || 0);
  const totalBorcUSD = toUSD(totalBorcTRY);
  const totalBorc    = totalBorcTRY; // payment hesapları için

  const currentPaid  = feeRow?.paid_amount ?? 0;

  // Payment input → TRY
  const paymentInputRaw = parseFloat(newPayment.replace(',', '.')) || 0;
  const totalPaid = paymentCurrency === 'USD' || paymentCurrency === 'CRYPTO'
    ? paymentInputRaw * (rates?.usd ?? 1)
    : paymentCurrency === 'EUR'
      ? paymentInputRaw * (rates?.eur ?? 1)
      : paymentInputRaw;
  const totalPaidUSD = toUSD(totalPaid);

  const addedPayment = Math.max(0, totalPaid - currentPaid);
  const remaining    = Math.max(0, totalBorc - totalPaid);
  const pct          = totalBorc > 0 ? Math.min(100, (totalPaid / totalBorc) * 100) : 0;

  // Per item paid_amount → TRY toplamı
  function itemPaidTRY(item: DebtItem): number {
    const pa = item.paid_amount ?? (item.paid ? item.amount : 0);
    return toTRY(pa, item.currency);
  }
  function recalcPayment(items: DebtItem[]) {
    const totalTRY = items.reduce((s, i) => s + itemPaidTRY(i), 0);
    const inCurrency = paymentCurrency === 'USD' || paymentCurrency === 'CRYPTO'
      ? totalTRY / (rates?.usd ?? 1)
      : paymentCurrency === 'EUR'
        ? totalTRY / (rates?.eur ?? 1)
        : totalTRY;
    setNewPayment(inCurrency.toFixed(2));
  }

  // Tick: fully paid toggle
  function tickItem(idx: number) {
    const updated = debtItems.map((item, i) => {
      if (i !== idx) return item;
      const newPaid = !item.paid;
      return { ...item, paid: newPaid, paid_amount: newPaid ? item.amount : 0 };
    });
    setDebtItems(updated);
    recalcPayment(updated);
  }

  // Kısmi ödeme girişi
  function updatePaidAmount(idx: number, val: string) {
    const pa = parseFloat(val.replace(',', '.')) || 0;
    const updated = debtItems.map((item, i) => {
      if (i !== idx) return item;
      const isPaid = pa >= item.amount;
      return { ...item, paid_amount: pa, paid: isPaid };
    });
    setDebtItems(updated);
    recalcPayment(updated);
  }

  function applyPreset(preset: string) {
    setItemName(preset);
    setTimeout(() => itemAmountRef.current?.focus(), 50);
  }

  function addItem() {
    const name   = itemName.trim();
    const amount = parseFloat(itemAmount.replace(',', '.'));
    if (!name || !amount || amount <= 0 || isNaN(amount)) return;

    // If this is the first item and there's a manual amount, carry it over as an item
    const baseAmount = parseFloat(manualBorc.replace(',', '.'));
    const leadingItems: DebtItem[] =
      debtItems.length === 0 && baseAmount > 0
        ? [{ name: 'Borç', amount: baseAmount, currency: 'TRY' }]
        : [];

    setDebtItems(prev => [...leadingItems, ...prev, { name, amount, currency: itemCurrency }]);
    setManualBorc('');
    setItemName('');
    setItemAmount('');
    setTimeout(() => itemNameRef.current?.focus(), 50);
  }

  function removeItem(idx: number) {
    const updated = debtItems.filter((_, i) => i !== idx);
    setDebtItems(updated);
    recalcPayment(updated);
  }

  const canAdd = itemName.trim().length > 0 && itemAmount.length > 0 &&
    parseFloat(itemAmount.replace(',', '.')) > 0;

  async function save() {
    setSaving(true);
    setSaveError('');

    const res = await fetch('/api/fee-rows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        casino_id: casino.id, year, month,
        turnover: totalBorc,
        fee_amount: totalBorc,
        paid_amount: totalPaid,
        status: totalPaid >= totalBorc && totalBorc > 0 ? 1 : 0,
        note: note || feeRow?.note || '',
        debt_items: debtItems,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setSaveError(err.error || 'Kayıt hatası oluştu');
      setSaving(false);
      return;
    }

    const savedRow = await res.json();

    if (addedPayment > 0 && savedRow?.id) {
      const txRes = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee_row_id: savedRow.id,
          paid_amount: addedPayment,
          note,
        }),
      });
      if (!txRes.ok) {
        const txErr = await txRes.json();
        setSaveError(`İşlem kaydı hatası: ${txErr.error || 'Bilinmeyen hata'}`);
        setSaving(false);
        return;
      }
    }

    for (const col of cols) {
      const cs = colState[col.id];
      if (cs) {
        await fetch('/api/col-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            col_id: col.id,
            year: col.monthly === 0 ? null : year,
            month: col.monthly === 1 ? month : null,
            amount: parseFloat(cs.amount) || null,
            status: cs.status,
            note: cs.note,
          }),
        });
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  async function deleteFee() {
    if (!feeRow) return;
    await fetch(`/api/fee-rows?id=${feeRow.id}`, { method: 'DELETE' });
    onSaved();
    onClose();
  }

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
            {showHistory && (
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white transition-colors">←</button>
            )}
            <div>
              <h2 className="font-bold text-white text-base leading-tight">{casino.name}</h2>
              <p className="text-xs text-slate-400">{showHistory ? 'İşlem Geçmişi' : `${MONTHS[month]} ${year}`}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xl flex-shrink-0">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* === GEÇMİŞ PANELİ === */}
          {showHistory ? (
            <div className="p-4 sm:p-5 space-y-3">
              {histLoading ? (
                <p className="text-slate-500 text-sm animate-pulse">Yükleniyor...</p>
              ) : histError ? (
                <div className="text-center py-8">
                  <p className="text-red-400 text-sm">Hata: {histError}</p>
                  <p className="text-slate-600 text-xs mt-1">Transactions tablosu Supabase'de mevcut değil olabilir.</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">Henüz işlem kaydı yok.</p>
                  <p className="text-slate-600 text-xs mt-1">Ödeme kaydedildiğinde burada görünür.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-xl p-3.5 border"
                      style={{ background: 'var(--bg-base)', borderColor: 'var(--border-accent)' }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                          {tx.note && <p className="text-sm text-slate-300 mt-1 truncate">"{tx.note}"</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: '#86efac' }}>
                            +{fmt(tx.paid_amount)} ₺
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : (
            /* === ANA PANEL === */
            <div className="p-4 sm:p-5 space-y-5">

              {/* ── BORÇ KALEMLERİ ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Borç Kalemleri</p>
                  <button
                    type="button"
                    onClick={() => { setShowPresetPanel(p => !p); setEditingIdx(null); }}
                    title="Etiketleri düzenle"
                    className="w-6 h-6 flex items-center justify-center rounded-md transition-colors text-base"
                    style={{ color: showPresetPanel ? '#fbbf24' : '#475569', background: showPresetPanel ? 'rgba(251,191,36,0.1)' : 'transparent' }}>
                    ⚙
                  </button>
                </div>

                {/* Hızlı preset chip'ler */}
                <div className="flex flex-wrap gap-1.5">
                  {presets.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 border"
                      style={itemName === p
                        ? { borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }
                        : { borderColor: 'var(--border-accent)', color: '#64748b', background: 'transparent' }}>
                      {p}
                    </button>
                  ))}
                </div>

                {/* Preset düzenleme paneli */}
                {showPresetPanel && (
                  <div className="rounded-xl border p-3 space-y-3" style={{ background: 'var(--bg-base)', borderColor: 'rgba(251,191,36,0.25)' }}>

                    {/* Varsayılan para birimi */}
                    <div>
                      <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Varsayılan Para Birimi</p>
                      <div className="flex gap-1.5">
                        {CURRENCIES.map(c => (
                          <button key={c} type="button" onClick={() => changeDefaultCurrency(c)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border"
                            style={defaultCurrency === c
                              ? { background: '#fbbf24', color: '#0f0f17', borderColor: '#fbbf24' }
                              : { background: 'transparent', color: '#64748b', borderColor: 'var(--border-accent)' }}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />

                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Etiket Yönetimi</p>

                    {/* Mevcut presetler */}
                    <div className="space-y-1">
                      {presets.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {editingIdx === idx ? (
                            <>
                              <input
                                autoFocus
                                type="text"
                                value={editingVal}
                                onChange={e => setEditingVal(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') commitEdit(idx); if (e.key === 'Escape') setEditingIdx(null); }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                                style={{ background: 'var(--bg-surface)', border: '1px solid rgba(251,191,36,0.4)', color: 'var(--text-primary)' }}
                              />
                              <button type="button" onClick={() => commitEdit(idx)}
                                className="px-2 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-400/10 transition-colors flex-shrink-0">✓</button>
                              <button type="button" onClick={() => setEditingIdx(null)}
                                className="px-1.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white transition-colors flex-shrink-0">✕</button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-xs text-slate-300 truncate">{p}</span>
                              <button type="button" onClick={() => { setEditingIdx(idx); setEditingVal(p); }}
                                className="text-slate-600 hover:text-amber-400 transition-colors text-xs px-1 flex-shrink-0" title="Düzenle">✎</button>
                              <button type="button" onClick={() => deletePreset(idx)}
                                className="text-slate-600 hover:text-red-400 transition-colors text-sm px-1 flex-shrink-0 leading-none" title="Sil">×</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Yeni preset ekle */}
                    <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addPreset(); }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                        placeholder="Yeni etiket adı..."
                      />
                      <button type="button" onClick={addPreset}
                        disabled={!newPresetName.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-all flex-shrink-0"
                        style={{ background: newPresetName.trim() ? '#fbbf24' : 'var(--border-accent)', color: newPresetName.trim() ? '#0f0f17' : '#475569' }}>
                        + Ekle
                      </button>
                    </div>
                  </div>
                )}

                {/* Kalem ekleme formu */}
                <div className="flex gap-2">
                  <input
                    ref={itemNameRef}
                    type="text"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') itemAmountRef.current?.focus(); }}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                    placeholder="Kalem adı"
                  />
                  <input
                    ref={itemAmountRef}
                    type="text"
                    inputMode="decimal"
                    value={itemAmount}
                    onChange={e => setItemAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
                    className="w-20 px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                    placeholder="Tutar"
                  />
                  <select
                    value={itemCurrency}
                    onChange={e => setItemCurrency(e.target.value)}
                    className="px-2 py-2.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  disabled={!canAdd}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: canAdd ? '#fbbf24' : 'var(--border-accent)', color: canAdd ? 'var(--bg-base)' : '#475569' }}>
                  + Borç Kalemi Ekle
                </button>

                {/* Kalem listesi — butonun altında */}
                {debtItems.length > 0 && (
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-accent)' }}>
                    {debtItems.map((item, i) => {
                      const itemUSD   = toUSD(toTRY(item.amount, item.currency));
                      const paidAmt   = item.paid_amount ?? (item.paid ? item.amount : 0);
                      const remaining = Math.max(0, item.amount - paidAmt);
                      const isPartial = paidAmt > 0 && paidAmt < item.amount;
                      const isFull    = paidAmt >= item.amount;
                      return (
                        <div key={i} className="border-b last:border-b-0 transition-colors"
                          style={{ background: isFull ? 'rgba(34,197,94,0.06)' : isPartial ? 'rgba(251,191,36,0.04)' : 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                          {/* Üst satır */}
                          <div className="flex items-center gap-2 px-3 py-2.5">
                            {/* Tick butonu */}
                            <button type="button" onClick={() => tickItem(i)}
                              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all border"
                              style={isFull
                                ? { background: '#22c55e', borderColor: '#22c55e', color: 'white' }
                                : isPartial
                                  ? { background: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24', color: '#fbbf24' }
                                  : { background: 'transparent', borderColor: 'var(--border-accent)', color: 'transparent' }}>
                              ✓
                            </button>
                            <span className="flex-1 text-sm truncate font-medium"
                              style={{ color: isFull ? '#86efac' : isPartial ? '#fbbf24' : 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold" style={{ color: isFull ? '#86efac' : 'var(--text-primary)' }}>
                                {item.currency !== 'TRY' ? `${item.currency} ${fmt(item.amount)}` : `₺${fmt(item.amount)}`}
                              </p>
                              {item.currency !== 'USD' && rates && (
                                <p className="text-xs text-slate-500">${fmtUSD(itemUSD)}</p>
                              )}
                            </div>
                            <button type="button" onClick={() => removeItem(i)}
                              className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors text-base leading-none flex-shrink-0">
                              ×
                            </button>
                          </div>
                          {/* Alt satır — kısmi ödeme */}
                          <div className="flex items-center gap-2 px-3 pb-2.5 pl-11">
                            <span className="text-[10px] text-slate-500 flex-shrink-0">Ödenen</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={paidAmt > 0 ? paidAmt.toString() : ''}
                              onChange={e => updatePaidAmount(i, e.target.value)}
                              className="w-24 px-2 py-1 rounded-lg text-xs outline-none"
                              style={{ background: 'var(--bg-surface)', border: `1px solid ${isFull ? 'rgba(34,197,94,0.3)' : isPartial ? 'rgba(251,191,36,0.3)' : 'var(--border-accent)'}`, color: 'var(--text-primary)' }}
                              placeholder="0"
                            />
                            <span className="text-[10px] text-slate-500 flex-shrink-0">{item.currency}</span>
                            {isPartial && (
                              <span className="text-[10px] text-amber-400 flex-shrink-0 ml-auto">
                                Kalan: {fmt(remaining)} {item.currency}
                              </span>
                            )}
                            {isFull && (
                              <span className="text-[10px] text-green-400 flex-shrink-0 ml-auto">Tamamı ödendi ✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between px-3 py-3"
                      style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-accent)' }}>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Borç</span>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">${fmtUSD(totalBorcUSD)}</p>
                        <p className="text-xs text-slate-500">₺{fmt(totalBorcTRY)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── ÖDEME DURUMU ── */}
              {totalBorc > 0 && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--bg-base)' }}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ödeme Durumu</p>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tahsilat</span>
                      <span className="font-bold"
                        style={{ color: pct >= 100 ? '#86efac' : pct > 0 ? '#fbbf24' : '#fca5a5' }}>
                        %{pct.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border-accent)' }}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : pct > 0 ? '#fbbf24' : '#ef4444' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Borç',   usd: toUSD(totalBorc), try: totalBorc, color: '#94a3b8' },
                      { label: 'Ödenen', usd: toUSD(totalPaid),  try: totalPaid, color: totalPaid > 0 ? '#86efac' : '#475569' },
                      { label: 'Kalan',  usd: toUSD(remaining),  try: remaining, color: remaining > 0 ? '#fca5a5' : '#86efac' },
                    ].map(c => (
                      <div key={c.label} className="rounded-lg py-2.5 px-1 text-center" style={{ background: 'var(--bg-surface)' }}>
                        <p className="text-[10px] text-slate-500 mb-1">{c.label}</p>
                        <p className="text-sm font-bold leading-tight" style={{ color: c.color }}>${fmtUSD(c.usd)}</p>
                        <p className="text-[10px] text-slate-600 leading-tight">₺{fmt(c.try)}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Toplam Ödenen</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newPayment}
                        onChange={e => setNewPayment(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl outline-none"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                        placeholder="0"
                      />
                      <select
                        value={paymentCurrency}
                        onChange={e => {
                          const nc = e.target.value;
                          // Convert current TRY total to new currency
                          const inNew = nc === 'USD' || nc === 'CRYPTO'
                            ? totalPaid / (rates?.usd ?? 1)
                            : nc === 'EUR'
                              ? totalPaid / (rates?.eur ?? 1)
                              : totalPaid;
                          setNewPayment(inNew.toFixed(2));
                          setPaymentCurrency(nc);
                        }}
                        className="px-2 py-2.5 rounded-xl text-xs outline-none flex-shrink-0"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {/* Döviz göstergesi */}
                    {paymentCurrency !== 'TRY' && totalPaid > 0 && (
                      <p className="text-xs text-slate-500 mt-1">= ₺{fmt(totalPaid)} · ${fmtUSD(totalPaidUSD)}</p>
                    )}
                    {paymentCurrency === 'TRY' && totalPaid > 0 && rates && (
                      <p className="text-xs text-slate-500 mt-1">= ${fmtUSD(totalPaidUSD)}</p>
                    )}
                    {/* Aşım uyarısı */}
                    {totalBorcTRY > 0 && totalPaid > totalBorcTRY * 1.01 && (
                      <div className="mt-2 px-3 py-2 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        <span className="text-red-400 text-sm flex-shrink-0">⚠</span>
                        <div>
                          <p className="text-xs font-semibold text-red-400">Ödeme borçtan fazla!</p>
                          <p className="text-[10px] text-red-400/70 mt-0.5">
                            Girilen: ₺{fmt(totalPaid)} — Borç: ₺{fmt(totalBorcTRY)}<br />
                            Fark: ₺{fmt(totalPaid - totalBorcTRY)}. Doğru mu?
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const inCurrency = paymentCurrency === 'USD' || paymentCurrency === 'CRYPTO'
                          ? totalBorcTRY / (rates?.usd ?? 1)
                          : paymentCurrency === 'EUR'
                            ? totalBorcTRY / (rates?.eur ?? 1)
                            : totalBorcTRY;
                        setNewPayment(inCurrency.toFixed(2));
                      }}
                      className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Tamamını ödenmiş olarak işaretle →
                    </button>
                  </div>
                </div>
              )}

              {/* ── NOT ── */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Not</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                  placeholder="Ödeme notu..."
                />
                {feeRow?.note && !note && (
                  <p className="text-xs text-slate-600 mt-1 truncate">Önceki: "{feeRow.note}"</p>
                )}
              </div>

              {/* İşlem Geçmişi */}
              {feeRow && (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:bg-white/5 flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--border-accent)', color: '#94a3b8' }}>
                  <span>🕐</span>
                  <span>İşlem Geçmişi</span>
                </button>
              )}

              {/* Özel Kalemler */}
              {cols.length > 0 && (
                <div className="space-y-3 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Özel Kalemler</p>
                  {cols.map(col => {
                    const cs = colState[col.id] || { amount: '', status: 0, note: '' };
                    const entry = colEntries.find(e => e.col_id === col.id);
                    return (
                      <div key={col.id} className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-base)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-slate-200 block truncate">{col.name}</span>
                            {entry?.updated_at && (
                              <span className="text-[10px] text-slate-600">{formatShortDate(entry.updated_at)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-500">{col.currency}</span>
                            <button
                              type="button"
                              onClick={() => setColState(p => ({ ...p, [col.id]: { ...p[col.id], status: p[col.id]?.status === 1 ? 0 : 1 } }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${cs.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {cs.status === 1 ? 'ALINDI' : 'ALINMADI'}
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={cs.amount}
                          onChange={e => setColState(p => ({ ...p, [col.id]: { ...p[col.id], amount: e.target.value } }))}
                          className="w-full px-2.5 py-2 rounded-lg text-sm outline-none"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', color: 'var(--text-primary)' }}
                          placeholder={`Tutar (varsayılan: ${col.amount})`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showHistory && (
          <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>

            {/* Inline silme onayı */}
            {confirmingDelete && (
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b" style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <p className="text-xs text-red-300 flex-1">Bu ayın kaydı silinecek. Emin misin?</p>
                <button type="button" onClick={() => setConfirmingDelete(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
                  Vazgeç
                </button>
                <button type="button" onClick={deleteFee}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all active:scale-95"
                  style={{ background: '#ef4444' }}>
                  Evet, Sil
                </button>
              </div>
            )}

          <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5">
            {feeRow && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                Sil
              </button>
            )}
            <div className="flex-1">
              {saveError && <p className="text-xs text-red-400 truncate">{saveError}</p>}
            </div>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">
              İptal
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-all active:scale-95"
              style={{ background: '#fbbf24', color: '#0f0f17' }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
