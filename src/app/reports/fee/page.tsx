'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

type ExtraLike = { amount: number; currency: 'TRY' | 'USD' | 'EUR' };
type RowLike = { bet: number; win: number };

type SingleData = {
  casinoName: string;
  feeType: 'percent' | 'fixed' | 'none';
  feeRate: number;
  feeFixed: number;
  usdRate: number;
  eurRate: number;
  rows: RowLike[];
  extras: ExtraLike[];
};

type MultiData = {
  type: 'multi';
  casinoName: string;
  feeType: 'percent' | 'fixed' | 'none';
  feeRate: number;
  usdRate: number;
  eurRate: number;
  combineMode: 'separate' | 'combined';
  months: { year: number; month: number; feeFixed: number; rows: RowLike[]; extras: ExtraLike[] }[];
};

type FeeReportListItem = {
  id: string;
  casino_id: number;
  year: number;
  month: number;
  created_at: string;
  data: SingleData | MultiData;
};

function isMulti(d: SingleData | MultiData): d is MultiData {
  return (d as MultiData).type === 'multi';
}

function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function komisyonAndExtrasUSD(rows: RowLike[], extras: ExtraLike[], feeType: SingleData['feeType'], feeRate: number, feeFixed: number, usdRate: number, eurRate: number) {
  const totalBet = rows.reduce((s, row) => s + row.bet, 0);
  const totalWin = rows.reduce((s, row) => s + row.win, 0);
  const totalNet = totalWin - totalBet;
  const komisyonTRY = feeType === 'percent' ? Math.abs(totalNet) * feeRate / 100 : feeType === 'fixed' ? feeFixed : 0;
  const komisyonUSD = usdRate ? komisyonTRY / usdRate : 0;
  const extrasUSD = extras.reduce((s, ex) => {
    if (ex.currency === 'USD') return s + ex.amount;
    if (ex.currency === 'EUR') return s + (usdRate ? (ex.amount * eurRate) / usdRate : 0);
    return s + (usdRate ? ex.amount / usdRate : 0);
  }, 0);
  return komisyonUSD + extrasUSD;
}

function reportTotalUSD(d: SingleData | MultiData) {
  if (isMulti(d)) {
    return d.months.reduce((sum, m) => sum + komisyonAndExtrasUSD(m.rows, m.extras, d.feeType, d.feeRate, m.feeFixed, d.usdRate, d.eurRate), 0);
  }
  return komisyonAndExtrasUSD(d.rows, d.extras, d.feeType, d.feeRate, d.feeFixed, d.usdRate, d.eurRate);
}

function reportPeriodLabel(r: FeeReportListItem) {
  if (isMulti(r.data)) {
    const months = r.data.months;
    if (months.length === 1) return `${MONTHS[months[0].month]} ${months[0].year}`;
    const first = months[0], last = months[months.length - 1];
    return `${MONTHS[first.month]} ${first.year} – ${MONTHS[last.month]} ${last.year} (${months.length} ay)`;
  }
  return `${MONTHS[r.month]} ${r.year}`;
}

function reportUrl(r: FeeReportListItem) {
  return isMulti(r.data) ? `/reports/fee-multi/${r.id}` : `/reports/fee/${r.id}`;
}

export default function FeeReportHistoryPage() {
  const [reports, setReports] = useState<FeeReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/fee-reports');
    const d = await res.json();
    setReports(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
          <a href="/reports" title="Ana Sayfa" className="text-amber-400 font-bold text-lg hover:opacity-80 transition-opacity">♠</a>
          <a href="/reports" title="Ana Sayfa" className="font-bold text-white text-sm hidden sm:block hover:text-amber-400 transition-colors">Casino Takip</a>
          <span className="text-slate-600 text-sm hidden sm:block">·</span>
          <span className="text-slate-400 text-sm font-medium">Aylık Fee Rapor Geçmişi</span>

          <div className="ml-auto">
            <button onClick={() => router.push('/reports')}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              ← Ana Sayfa
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-4">

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
            <h2 className="font-semibold text-white text-sm">Oluşturulan Raporlar</h2>
            <span className="text-xs text-slate-500">{reports.length} rapor</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-slate-500 text-sm animate-pulse">Yükleniyor...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-slate-500 text-sm">Henüz rapor oluşturulmadı.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {reports.map((r, i) => (
                <div key={r.id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
                  style={{ background: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-base-alt)' }}>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {r.data.casinoName}
                      {isMulti(r.data) && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold align-middle" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>
                          ÇOKLU AY
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {reportPeriodLabel(r)} · {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-amber-400">${fmtUSD(reportTotalUSD(r.data))}</span>
                    <button onClick={() => router.push(reportUrl(r))}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
                      style={{ borderColor: 'var(--border-accent)' }}>
                      Görüntüle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
