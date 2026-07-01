'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const MONTHS = ['','Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

type FeeReportListItem = {
  id: string;
  casino_id: number;
  year: number;
  month: number;
  created_at: string;
  data: {
    casinoName: string;
    feeType: 'percent' | 'fixed' | 'none';
    feeRate: number;
    feeFixed: number;
    usdRate: number;
    eurRate: number;
    rows: { bet: number; win: number }[];
    extras: { amount: number; currency: 'TRY' | 'USD' | 'EUR' }[];
  };
};

function fmtUSD(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function reportTotalUSD(r: FeeReportListItem['data']) {
  const totalBet = r.rows.reduce((s, row) => s + row.bet, 0);
  const totalWin = r.rows.reduce((s, row) => s + row.win, 0);
  const totalNet = totalWin - totalBet;
  const komisyonTRY = r.feeType === 'percent'
    ? Math.abs(totalNet) * r.feeRate / 100
    : r.feeType === 'fixed' ? r.feeFixed : 0;
  const komisyonUSD = r.usdRate ? komisyonTRY / r.usdRate : 0;
  const extrasUSD = r.extras.reduce((s, ex) => {
    if (ex.currency === 'USD') return s + ex.amount;
    if (ex.currency === 'EUR') return s + (r.usdRate ? (ex.amount * r.eurRate) / r.usdRate : 0);
    return s + (r.usdRate ? ex.amount / r.usdRate : 0);
  }, 0);
  return komisyonUSD + extrasUSD;
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
          <span className="text-amber-400 font-bold text-lg">♠</span>
          <span className="font-bold text-white text-sm hidden sm:block">Casino Takip</span>
          <span className="text-slate-600 text-sm hidden sm:block">·</span>
          <span className="text-slate-400 text-sm font-medium">Aylık Fee Rapor Geçmişi</span>

          <div className="ml-auto">
            <button onClick={() => router.push('/dashboard')}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
              style={{ borderColor: 'var(--border-accent)' }}>
              ← Dashboard
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
                    <p className="font-semibold text-white text-sm truncate">{r.data.casinoName}</p>
                    <p className="text-xs text-slate-500">
                      {MONTHS[r.month]} {r.year} · {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-amber-400">${fmtUSD(reportTotalUSD(r.data))}</span>
                    <button onClick={() => router.push(`/reports/fee/${r.id}`)}
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
