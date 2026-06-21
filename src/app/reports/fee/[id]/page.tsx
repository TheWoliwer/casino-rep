'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function today() {
  return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

type ReportRow = { kategori: string; saglayici: string; bet: number; win: number };
type ExtraItem = { name: string; amount: number; currency: 'TRY' | 'USD' | 'EUR' };

type FeeReportData = {
  casinoName: string;
  feeType: 'percent' | 'fixed' | 'none';
  feeRate: number;
  feeFixed: number;
  year: number;
  month: number;
  usdRate: number;
  eurRate: number;
  rows: ReportRow[];
  extras: ExtraItem[];
};

export default function FeeReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<FeeReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/fee-reports?id=${id}`);
    if (!res.ok) { setLoading(false); return; }
    const raw = await res.json();
    setReport(raw.data as FeeReportData);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function share() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-slate-400 text-sm animate-pulse">Rapor yükleniyor...</p>
    </div>
  );
  if (!report) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-slate-400 text-sm">Rapor bulunamadı.</p>
    </div>
  );

  const { rows, extras, feeType, feeRate, feeFixed, usdRate, eurRate, casinoName } = report;

  const totalBet = rows.reduce((s, r) => s + r.bet, 0);
  const totalWin = rows.reduce((s, r) => s + r.win, 0);
  const totalNet = totalWin - totalBet;

  const komisyonTRY = feeType === 'percent'
    ? Math.abs(totalNet) * feeRate / 100
    : feeType === 'fixed' ? feeFixed : 0;
  const komisyonUSD = komisyonTRY / usdRate;

  function toUSD(item: ExtraItem) {
    if (item.currency === 'USD') return item.amount;
    if (item.currency === 'EUR') return (item.amount * eurRate) / usdRate;
    return item.amount / usdRate;
  }

  const extrasUSD = extras.map(toUSD);
  const totalUSD = komisyonUSD + extrasUSD.reduce((s, v) => s + v, 0);

  const komisyonLabel = feeType === 'percent'
    ? `Komisyon %${feeRate}`
    : feeType === 'fixed' ? 'Komisyon (Sabit)' : null;

  return (
    <>
      {/* Toolbar — gizli baskıda */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold text-lg">♠</span>
          <span className="text-white text-sm font-semibold">{casinoName} — {MONTHS[report.month]} {report.year} Fee Raporu</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.close()}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
            style={{ borderColor: '#2a2a3e' }}>
            ← Geri
          </button>
          <button onClick={share}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
            {copied ? '✓ Kopyalandı' : '🔗 Paylaş'}
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{ background: '#fbbf24', color: '#0f0f17' }}>
            🖨️ İndir / Yazdır
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="print-page" style={{ paddingTop: 56 }}>
        <div className="a4">

          {/* Corner brackets */}
          <div className="bracket bracket-tl" />
          <div className="bracket bracket-tl2" />
          <div className="bracket bracket-tr" />
          <div className="bracket bracket-tr2" />
          <div className="bracket bracket-bl" />
          <div className="bracket bracket-bl2" />
          <div className="bracket bracket-br" />
          <div className="bracket bracket-br2" />

          {/* Page content */}
          <div className="page-content">

            {/* Başlık */}
            <div className="title-row">
              <div>
                <p className="casino-label">{casinoName}</p>
                <h1 className="main-title">Ödeme ve Ek Talep Detayı</h1>
              </div>
              <div className="title-right">
                <span className="date-label">Rapor Tarihi:</span>
                <span className="date-value">{today()}</span>
                {usdRate && <p className="rate-info">1 USD = ₺{fmt(usdRate)}</p>}
              </div>
            </div>

            {/* ÜST TABLO */}
            <table className="report-table upper-table">
              <thead>
                <tr>
                  <th className="text-left">Kategori</th>
                  <th className="text-left">Sağlayıcı</th>
                  <th className="text-right">Toplam Bet (TRY)</th>
                  <th className="text-right">Toplam Win (TRY)</th>
                  <th className="text-right">Net Kar / Zarar (W/L)</th>
                  {komisyonLabel && <th className="text-right komisyon-header">{komisyonLabel}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const net = row.win - row.bet;
                  return (
                    <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''}>
                      <td>{row.kategori}</td>
                      <td className="font-bold">{row.saglayici}</td>
                      <td className="text-right">{row.bet ? fmt(row.bet) : '—'}</td>
                      <td className="text-right">{row.win ? fmt(row.win) : '—'}</td>
                      <td className="text-right" style={{ color: net < 0 ? '#dc2626' : '#16a34a' }}>
                        {row.bet || row.win ? fmt(net) : '—'}
                      </td>
                      {komisyonLabel && <td />}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">TOPLAM</td>
                  <td className="font-bold">Live Slots</td>
                  <td className="text-right font-bold">{fmt(totalBet)}</td>
                  <td className="text-right font-bold">{fmt(totalWin)}</td>
                  <td className="text-right font-bold" style={{ color: totalNet < 0 ? '#dc2626' : '#16a34a' }}>
                    {fmt(totalNet)}
                  </td>
                  {komisyonLabel && (
                    <td className="text-right font-bold komisyon-cell">
                      <span style={{ display: 'block' }}>{fmt(komisyonTRY)}₺</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{fmtUSD(komisyonUSD)}$</span>
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>

            {/* ALT TABLO */}
            <table className="report-table lower-table">
              <thead>
                <tr>
                  <th className="text-left">Kategori</th>
                  <th className="text-right" />
                  <th className="text-right dolar-header">DOLAR TUTARI</th>
                </tr>
              </thead>
              <tbody>
                {komisyonLabel && (
                  <tr>
                    <td>Live Slot Komisyon</td>
                    <td className="text-right">{fmt(komisyonTRY)}₺</td>
                    <td className="text-right font-bold">{fmtUSD(komisyonUSD)}$</td>
                  </tr>
                )}
                {extras.map((ex, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'row-alt' : ''}>
                    <td>{ex.name}</td>
                    <td className="text-right">
                      {ex.currency === 'TRY' ? `${fmt(ex.amount)}₺` : ex.currency === 'EUR' ? `${fmt(ex.amount)}€` : `${fmtUSD(ex.amount)}$`}
                    </td>
                    <td className="text-right font-bold">{fmtUSD(toUSD(ex))}$</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="font-bold">GENEL TOPLAM</td>
                  <td />
                  <td className="text-right font-bold">{fmtUSD(totalUSD)}$</td>
                </tr>
              </tfoot>
            </table>

          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #d1d5db; font-family: system-ui, -apple-system, sans-serif; }

        .print-page {
          display: flex;
          justify-content: center;
          padding: 24px 16px 48px;
          min-height: 100vh;
        }

        .a4 {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          background: white;
          box-shadow: 0 6px 32px rgba(0,0,0,0.18);
          color: #1e293b;
          font-size: 11px;
          line-height: 1.5;
        }

        /* Corner brackets */
        .bracket {
          position: absolute;
          width: 38px;
          height: 38px;
        }
        .bracket-tl  { top: 14px; left: 14px; border-top: 2px solid #94a3b8; border-left: 2px solid #94a3b8; }
        .bracket-tl2 { top: 21px; left: 21px; border-top: 2px solid #cbd5e1; border-left: 2px solid #cbd5e1; }
        .bracket-tr  { top: 14px; right: 14px; border-top: 2px solid #94a3b8; border-right: 2px solid #94a3b8; }
        .bracket-tr2 { top: 21px; right: 21px; border-top: 2px solid #cbd5e1; border-right: 2px solid #cbd5e1; }
        .bracket-bl  { bottom: 14px; left: 14px; border-bottom: 2px solid #94a3b8; border-left: 2px solid #94a3b8; }
        .bracket-bl2 { bottom: 21px; left: 21px; border-bottom: 2px solid #cbd5e1; border-left: 2px solid #cbd5e1; }
        .bracket-br  { bottom: 14px; right: 14px; border-bottom: 2px solid #94a3b8; border-right: 2px solid #94a3b8; }
        .bracket-br2 { bottom: 21px; right: 21px; border-bottom: 2px solid #cbd5e1; border-right: 2px solid #cbd5e1; }

        .page-content {
          padding: 22mm 20mm 22mm;
        }

        /* Title */
        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
        }
        .casino-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          margin-bottom: 4px;
        }
        .main-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .title-right { text-align: right; }
        .date-label { font-size: 11px; color: #64748b; font-weight: 600; margin-right: 6px; }
        .date-value { font-size: 11px; color: #1e293b; font-weight: 700; }
        .rate-info { font-size: 9px; color: #94a3b8; margin-top: 3px; }

        /* Tables */
        .report-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          font-size: 11px;
        }
        .upper-table { margin-bottom: 24px; }
        .lower-table { }

        .report-table th {
          padding: 9px 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #334155;
          background: #f1f5f9;
          border-bottom: 2px solid #cbd5e1;
          border-right: 1px solid #cbd5e1;
        }
        .report-table th:last-child { border-right: none; }

        .komisyon-header {
          background: #fbbf24 !important;
          color: #1e293b !important;
          font-weight: 800 !important;
        }
        .dolar-header {
          background: #fbbf24 !important;
          color: #1e293b !important;
          font-weight: 800 !important;
        }

        .report-table td {
          padding: 9px 12px;
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          color: #334155;
        }
        .report-table td:last-child { border-right: none; }
        .report-table tbody tr:last-child td { border-bottom: none; }

        .report-table tfoot td {
          padding: 10px 12px;
          border-top: 2px solid #94a3b8;
          border-right: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 700;
        }
        .report-table tfoot td:last-child { border-right: none; }

        .komisyon-cell {
          background: #fffbeb;
          color: #1e293b !important;
          font-size: 13px !important;
        }

        .row-alt td { background: #fafafa; }

        .text-left  { text-align: left; }
        .text-right { text-align: right; }
        .font-bold  { font-weight: 700; }

        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; background: white !important; }
          .a4 { box-shadow: none !important; width: 100% !important; min-height: 100vh !important; }
        }
      `}</style>
    </>
  );
}
