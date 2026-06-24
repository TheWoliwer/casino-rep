'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { Casino, FeeRow, CasinoCol, ColEntry } from '@/lib/supabase';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function today() {
  return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const year  = parseInt(searchParams.get('year')  || String(new Date().getFullYear()));
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

  const [casino, setCasino]       = useState<Casino | null>(null);
  const [feeRows, setFeeRows]     = useState<FeeRow[]>([]);
  const [cols, setCols]           = useState<CasinoCol[]>([]);
  const [colEntries, setColEntries] = useState<ColEntry[]>([]);
  const [usdRate, setUsdRate]     = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    const [allCasinos, allFees, allCols, allEntries, rates] = await Promise.all([
      fetch('/api/casinos').then(r => r.json()),
      fetch(`/api/fee-rows?year=${year}`).then(r => r.json()),
      fetch('/api/casino-cols').then(r => r.json()),
      fetch(`/api/col-entries?year=${year}`).then(r => r.json()),
      fetch('/api/currency').then(r => r.json()),
    ]);
    const found = (Array.isArray(allCasinos) ? allCasinos : []).find((c: Casino) => c.id === parseInt(id));
    setCasino(found ?? null);
    setFeeRows((Array.isArray(allFees) ? allFees : []).filter((r: FeeRow) => r.casino_id === parseInt(id)));
    setCols((Array.isArray(allCols) ? allCols : []).filter((c: CasinoCol) => c.casino_id === parseInt(id)));
    setColEntries(Array.isArray(allEntries) ? allEntries : []);
    if (rates.usd) setUsdRate(parseFloat(rates.usd));
    setLoading(false);
  }, [id, year]);

  useEffect(() => { load(); }, [load]);

  const toUSD = (n: number) => usdRate ? n / usdRate : n;

  // Aylık modda sadece o ayın satırını, değilse tümünü kullan
  const summaryRows = month ? feeRows.filter(r => r.month === month) : feeRows;
  const total       = summaryRows.reduce((s, r) => s + (r.turnover ?? 0), 0);
  const collected   = summaryRows.reduce((s, r) => s + (r.paid_amount ?? 0), 0);
  const outstanding = Math.max(0, total - collected);
  const rate        = total > 0 ? (collected / total) * 100 : 0;

  // Aylık mod: sadece seçili ay; 12 aylık mod: tüm aylar
  const tableRows = (month ? [month] : MONTHS.slice(1).map((_, i) => i + 1)).map(m => {
    const row = feeRows.find(r => r.month === m);
    const os  = row ? Math.max(0, (row.turnover ?? 0) - (row.paid_amount ?? 0)) : 0;
    return { month: m, row, os };
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-slate-400 text-sm animate-pulse">Rapor hazırlanıyor...</p>
    </div>
  );

  if (!casino) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-slate-400 text-sm">Casino bulunamadı.</p>
    </div>
  );

  return (
    <>
      {/* Print action toolbar — hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">♠</span>
          <span className="text-white text-sm font-semibold">
            {casino.name} — {month ? `${MONTHS[month]} ${year}` : `${year} Yıllık`} Raporu
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.close()}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
            style={{ borderColor: '#2a2a3e' }}>
            ← Geri
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: '#fbbf24', color: '#0f0f17' }}>
            🖨️ PDF Olarak Kaydet
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="print-page" style={{ paddingTop: '56px' }}>
        <div className="a4">

          {/* Report Header */}
          <div className="report-header">
            <div className="header-left">
              <div className="logo-badge">♠</div>
              <div>
                <h1 className="casino-name">{casino.name}</h1>
                <p className="report-subtitle">
                  {month ? `${MONTHS[month]} ${year} · Aylık Detay` : `Ödeme Takip Raporu · ${year}`}
                </p>
              </div>
            </div>
            <div className="header-right">
              <p className="report-meta">Oluşturulma tarihi</p>
              <p className="report-date">{today()}</p>
              {usdRate && <p className="report-meta" style={{ marginTop: 4 }}>1 USD = ₺{fmt(usdRate)}</p>}
            </div>
          </div>

          <div className="divider" />

          {/* Summary Section */}
          <div className="summary-grid">
            {[
              { label: 'Toplam Borç', usd: toUSD(total), try: total, color: '#1e293b' },
              { label: 'Tahsil Edilen', usd: toUSD(collected), try: collected, color: '#16a34a' },
              { label: 'Bekleyen', usd: toUSD(outstanding), try: outstanding, color: outstanding > 0 ? '#dc2626' : '#16a34a' },
              { label: 'Tahsilat Oranı', pct: `%${rate.toFixed(1)}`, color: rate >= 100 ? '#16a34a' : rate > 50 ? '#d97706' : '#dc2626' },
            ].map(c => (
              <div key={c.label} className="summary-card">
                <p className="summary-label">{c.label}</p>
                {c.pct ? (
                  <p className="summary-value" style={{ color: c.color }}>{c.pct}</p>
                ) : (
                  <>
                    <p className="summary-value" style={{ color: c.color }}>${fmtUSD(c.usd!)}</p>
                    <p className="summary-sub">₺{fmt(c.try!)}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="progress-section">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{
                width: `${Math.min(100, rate)}%`,
                background: rate >= 100 ? '#16a34a' : rate > 50 ? '#d97706' : '#dc2626',
              }} />
            </div>
            <span className="progress-label">%{rate.toFixed(1)} tahsil edildi</span>
          </div>

          <div className="section-title">{month ? `${MONTHS[month]} Detayı` : 'Aylık Detay'}</div>

          {/* Monthly Table */}
          <table className="report-table">
            <thead>
              <tr>
                {!month && <th className="text-left">Ay</th>}
                <th className="text-right">Borç (USD)</th>
                <th className="text-right">Borç (TRY)</th>
                <th className="text-right">Ödenen (USD)</th>
                <th className="text-right">Kalan (USD)</th>
                <th className="text-center">Durum</th>
                {month && <th className="text-left">Not</th>}
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ month: m, row, os }) => {
                const turnover = row?.turnover ?? 0;
                const paid     = row?.paid_amount ?? 0;
                const statusLabel = !row ? '—' : row.status === 1 || (turnover > 0 && paid >= turnover) ? 'ALINDI' : paid > 0 ? 'KISMİ' : 'ALINMADI';
                const statusColor = !row ? '#94a3b8' : statusLabel === 'ALINDI' ? '#16a34a' : statusLabel === 'KISMİ' ? '#d97706' : '#dc2626';
                return (
                  <tr key={m} className={m % 2 === 0 ? 'row-alt' : ''}>
                    {!month && <td className="font-medium">{MONTHS[m]}</td>}
                    <td className="text-right">{row ? `$${fmtUSD(toUSD(turnover))}` : '—'}</td>
                    <td className="text-right text-muted">{row ? `₺${fmt(turnover)}` : '—'}</td>
                    <td className="text-right" style={{ color: paid > 0 ? '#16a34a' : undefined }}>
                      {row ? `$${fmtUSD(toUSD(paid))}` : '—'}
                    </td>
                    <td className="text-right" style={{ color: os > 0 ? '#dc2626' : os === 0 && row ? '#16a34a' : undefined }}>
                      {row ? `$${fmtUSD(toUSD(os))}` : '—'}
                    </td>
                    <td className="text-center">
                      <span className="status-badge" style={{ color: statusColor, borderColor: statusColor + '40', background: statusColor + '15' }}>
                        {statusLabel}
                      </span>
                    </td>
                    {month && <td className="text-muted">{row?.note || '—'}</td>}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                {!month && <td className="font-bold">TOPLAM</td>}
                <td className="text-right font-bold">${fmtUSD(toUSD(total))}</td>
                <td className="text-right font-bold text-muted">₺{fmt(total)}</td>
                <td className="text-right font-bold" style={{ color: '#16a34a' }}>${fmtUSD(toUSD(collected))}</td>
                <td className="text-right font-bold" style={{ color: outstanding > 0 ? '#dc2626' : '#16a34a' }}>${fmtUSD(toUSD(outstanding))}</td>
                <td className="text-center font-bold" style={{ color: rate >= 100 ? '#16a34a' : '#d97706' }}>%{rate.toFixed(1)}</td>
                {month && <td />}
              </tr>
            </tfoot>
          </table>

          {/* Özel Kalemler */}
          {cols.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 24 }}>Özel Kalemler</div>
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="text-left">Kalem</th>
                    <th className="text-left">Tür</th>
                    <th className="text-right">Tutar</th>
                    <th className="text-center">Alınan Ay</th>
                    <th className="text-center">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map((col, i) => {
                    const entries  = colEntries.filter(e => e.col_id === col.id);
                    const paid     = entries.filter(e => e.status === 1).length;
                    const typeLabel = col.monthly === 1 ? 'Aylık' : col.monthly === 2 ? 'Yıllık' : 'Tek seferlik';
                    const allPaid  = entries.length > 0 && paid === entries.length;
                    return (
                      <tr key={col.id} className={i % 2 === 0 ? 'row-alt' : ''}>
                        <td className="font-medium">{col.name}</td>
                        <td className="text-muted">{typeLabel}</td>
                        <td className="text-right">{col.currency} {fmt(col.amount)}</td>
                        <td className="text-center">{paid}/{entries.length}</td>
                        <td className="text-center">
                          <span className="status-badge"
                            style={allPaid
                              ? { color: '#16a34a', borderColor: '#16a34a40', background: '#16a34a15' }
                              : { color: '#d97706', borderColor: '#d9770640', background: '#d9770615' }}>
                            {allPaid ? 'TAMAM' : 'EKSİK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Aylık modda borç kalemleri */}
          {month && (() => {
            const monthRow = feeRows.find(r => r.month === month);
            const items = monthRow?.debt_items ?? [];
            if (!items.length) return null;
            return (
              <>
                <div className="section-title" style={{ marginTop: 24 }}>Borç Kalemleri</div>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th className="text-left">Kalem</th>
                      <th className="text-right">Tutar</th>
                      <th className="text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'row-alt' : ''}>
                        <td className="font-medium">{item.name}</td>
                        <td className="text-right">{item.currency !== 'TRY' ? item.currency + ' ' : '₺'}{fmt(item.amount)}</td>
                        <td className="text-center">
                          {item.paid
                            ? <span className="status-badge" style={{ color: '#16a34a', borderColor: '#16a34a40', background: '#16a34a15' }}>ALINDI</span>
                            : <span className="status-badge" style={{ color: '#dc2626', borderColor: '#dc262640', background: '#dc262615' }}>BEKLIYOR</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            );
          })()}

          {/* Notes for unpaid months */}
          {!month && feeRows.some(r => r.note) && (
            <>
              <div className="section-title" style={{ marginTop: 24 }}>Notlar</div>
              <div className="notes-section">
                {feeRows.filter(r => r.note).map(r => (
                  <div key={r.id} className="note-row">
                    <span className="note-month">{MONTHS[r.month]}</span>
                    <span className="note-text">{r.note}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="report-footer">
            <span>Casino Takip · {today()}</span>
            <span>{casino.name} · {year} Yılı</span>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e5e7eb; font-family: system-ui, -apple-system, sans-serif; }

        .no-print { }

        .print-page {
          display: flex;
          justify-content: center;
          padding: 24px 16px 40px;
          min-height: 100vh;
        }

        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: white;
          padding: 16mm 18mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          color: #1e293b;
          font-size: 11px;
          line-height: 1.5;
        }

        /* Header */
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .logo-badge {
          width: 40px; height: 40px; border-radius: 10px;
          background: #0f0f17; color: #fbbf24;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700; flex-shrink: 0;
        }
        .casino-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .report-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
        .header-right { text-align: right; }
        .report-meta { font-size: 10px; color: #94a3b8; }
        .report-date { font-size: 13px; font-weight: 600; color: #1e293b; }

        .divider { height: 1px; background: #e2e8f0; margin: 14px 0; }

        /* Summary */
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 12px; }
        .summary-card {
          border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;
          background: #f8fafc;
        }
        .summary-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
        .summary-value { font-size: 16px; font-weight: 800; line-height: 1.2; }
        .summary-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }

        /* Progress */
        .progress-section { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .progress-bar-bg { flex: 1; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }
        .progress-label { font-size: 10px; color: #64748b; white-space: nowrap; font-weight: 600; }

        /* Section title */
        .section-title {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          color: #64748b; margin-bottom: 8px; padding-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
        }

        /* Table */
        .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .report-table th {
          padding: 7px 10px; font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: #64748b; background: #f1f5f9;
          border-bottom: 2px solid #e2e8f0;
        }
        .report-table td {
          padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155;
        }
        .report-table tbody tr:last-child td { border-bottom: none; }
        .report-table tfoot td {
          padding: 8px 10px; border-top: 2px solid #e2e8f0;
          background: #f8fafc; color: #1e293b;
        }
        .row-alt td { background: #fafafa; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-muted { color: #94a3b8; }
        .font-medium { font-weight: 600; }
        .font-bold { font-weight: 700; }

        /* Status badge */
        .status-badge {
          display: inline-block; padding: 2px 7px; border-radius: 4px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
          border: 1px solid;
        }

        /* Notes */
        .notes-section { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .note-row { display: flex; gap: 12px; padding: 7px 12px; border-bottom: 1px solid #f1f5f9; }
        .note-row:last-child { border-bottom: none; }
        .note-month { font-weight: 700; min-width: 60px; color: #475569; }
        .note-text { color: #64748b; }

        /* Footer */
        .report-footer {
          display: flex; justify-content: space-between;
          margin-top: 24px; padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 9px; color: #94a3b8;
        }

        /* Print styles */
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; background: white !important; }
          .a4 {
            box-shadow: none !important;
            padding: 14mm 16mm !important;
            width: 100% !important;
            min-height: 100vh !important;
          }
        }
      `}</style>
    </>
  );
}
