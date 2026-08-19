'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ResetStep = 'idle' | 'form' | 'success';

export default function LoginPage() {
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  // Reset akışı
  const [resetOpen, setResetOpen]           = useState(false);
  const [resetStep, setResetStep]           = useState<ResetStep>('idle');
  const [resetCode, setResetCode]           = useState('');
  const [newPass, setNewPass]               = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [resetError, setResetError]         = useState('');
  const [resetLoading, setResetLoading]     = useState(false);

  useEffect(() => {
    router.prefetch('/reports');
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      router.replace('/reports');
    } else {
      setLoading(false);
      const data = await res.json();
      setError(data.error || 'Hata oluştu');
    }
  }

  function openReset() {
    setResetOpen(true);
    setResetStep('form');
    setResetCode('');
    setNewPass('');
    setNewPassConfirm('');
    setResetError('');
  }

  function closeReset() {
    setResetOpen(false);
    setResetStep('idle');
    setResetError('');
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');

    if (!resetCode.trim()) { setResetError('Reset kodunu girin'); return; }
    if (newPass.length < 4) { setResetError('Şifre en az 4 karakter olmalı'); return; }
    if (newPass !== newPassConfirm) { setResetError('Şifreler eşleşmiyor'); return; }

    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCode, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetStep('success');
      } else {
        setResetError(data.error || 'Hata oluştu');
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0a0a12' }}>

      {/* Arka plan — blurlu dekoratif içerik */}
      <div className="absolute inset-0" style={{ filter: 'blur(2px)', opacity: 0.4 }}>
        {/* Sahte summary kartlar */}
        <div className="absolute top-10 left-8 w-44 h-24 rounded-2xl border"
          style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
          <div className="p-4 space-y-2">
            <div className="w-20 h-2 rounded" style={{ background: '#334155' }} />
            <div className="w-28 h-5 rounded" style={{ background: '#fbbf2430' }} />
            <div className="w-16 h-2 rounded" style={{ background: '#1e293b' }} />
          </div>
        </div>
        <div className="absolute top-10 left-60 w-44 h-24 rounded-2xl border"
          style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
          <div className="p-4 space-y-2">
            <div className="w-16 h-2 rounded" style={{ background: '#334155' }} />
            <div className="w-24 h-5 rounded" style={{ background: '#86efac30' }} />
            <div className="w-20 h-2 rounded" style={{ background: '#1e293b' }} />
          </div>
        </div>
        <div className="absolute top-10 right-60 w-44 h-24 rounded-2xl border"
          style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
          <div className="p-4 space-y-2">
            <div className="w-24 h-2 rounded" style={{ background: '#334155' }} />
            <div className="w-32 h-5 rounded" style={{ background: '#fca5a530' }} />
            <div className="w-14 h-2 rounded" style={{ background: '#1e293b' }} />
          </div>
        </div>
        <div className="absolute top-10 right-8 w-44 h-24 rounded-2xl border"
          style={{ background: '#1e1e2e', borderColor: '#2a2a3e' }}>
          <div className="p-4 space-y-2">
            <div className="w-18 h-2 rounded" style={{ background: '#334155' }} />
            <div className="w-20 h-5 rounded" style={{ background: '#fbbf2430' }} />
            <div className="w-12 h-2 rounded" style={{ background: '#1e293b' }} />
          </div>
        </div>

        {/* Sahte tablo */}
        <div className="absolute top-48 left-6 right-6 rounded-2xl border overflow-hidden"
          style={{ background: '#14141f', borderColor: '#2a2a3e' }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#1a1a27' }}>
            <div className="w-28 h-2.5 rounded" style={{ background: '#334155' }} />
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded" style={{ background: '#2a2a3e' }} />
            ))}
          </div>
          {[...Array(9)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t"
              style={{ borderColor: '#1e1e2e', background: i % 2 === 0 ? '#14141f' : '#16161f' }}>
              <div className="w-28 flex-shrink-0">
                <div className="h-2.5 rounded mb-1.5" style={{ width: `${60 + (i * 17) % 40}px`, background: '#475569' }} />
                <div className="h-1.5 rounded" style={{ width: `${30 + (i * 11) % 25}px`, background: '#1e293b' }} />
              </div>
              {[...Array(12)].map((_, j) => {
                const colors = ['#22c55e22', '#fbbf2422', '#ef444422', 'transparent'];
                const pick = (i + j) % 7 === 0 ? 0 : (i + j) % 5 === 0 ? 1 : (i + j) % 9 === 0 ? 2 : 3;
                return (
                  <div key={j} className="flex-1 h-6 rounded-lg border"
                    style={{ background: colors[pick], borderColor: pick < 3 ? colors[pick] : '#1e1e2e' }} />
                );
              })}
            </div>
          ))}
        </div>

        {/* Dekoratif semboller */}
        <div className="absolute bottom-24 left-1/3 text-9xl select-none" style={{ color: '#fbbf2408' }}>♠</div>
        <div className="absolute bottom-36 right-1/3 text-9xl select-none" style={{ color: '#fbbf2408' }}>♦</div>
      </div>

      {/* Blur + dim overlay */}
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(14px)', background: 'rgba(8,8,16,0.70)' }} />

      {/* Login diyaloğu */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}>
        <div className="w-full max-w-xs">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span className="text-amber-400 text-2xl">♠</span>
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">Casino Takip</h1>
            <p className="text-slate-500 text-xs mt-1">Sisteme giriş yapın</p>
          </div>

          {/* Form kartı */}
          <form onSubmit={handleSubmit} className="rounded-2xl p-5"
            style={{
              background: 'rgba(18,18,28,0.9)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span className="text-red-400 text-xs">⚠</span>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-40"
              style={{ background: '#fbbf24', color: '#0f0f17' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                  Giriş yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-slate-700 text-[10px] mt-3">
            Oturum 15 dakika sonra otomatik kapanır
          </p>
        </div>
      </div>

      {/* ── Şifre Sıfırlama Modal ── */}
      {resetOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeReset(); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: 'rgba(18,18,28,0.97)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Modal başlık */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">🔑</span>
                <h2 className="text-white font-semibold text-sm">Şifre Sıfırlama</h2>
              </div>
              <button
                onClick={closeReset}
                className="text-slate-600 hover:text-slate-400 transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {resetStep === 'success' ? (
              /* Başarı ekranı */
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-semibold mb-1">Şifre güncellendi!</p>
                <p className="text-slate-400 text-xs mb-5">Yeni şifrenizle giriş yapabilirsiniz.</p>
                <button
                  onClick={closeReset}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                  style={{ background: '#fbbf24', color: '#0f0f17' }}
                >
                  Giriş yap
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-slate-400 text-xs mb-1">
                  Reset kodunu ve yeni şifrenizi girin.
                </p>

                {/* Reset Kodu */}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Reset Kodu</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={e => { setResetCode(e.target.value); setResetError(''); }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: resetError ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.09)',
                    }}
                    placeholder="Güvenlik kodunuzu girin"
                    autoFocus
                  />
                </div>

                {/* Yeni Şifre */}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setResetError(''); }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: resetError ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.09)',
                      letterSpacing: newPass ? '0.18em' : 'normal',
                    }}
                    placeholder="••••••••"
                  />
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={newPassConfirm}
                    onChange={e => { setNewPassConfirm(e.target.value); setResetError(''); }}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: resetError ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.09)',
                      letterSpacing: newPassConfirm ? '0.18em' : 'normal',
                    }}
                    placeholder="••••••••"
                  />
                </div>

                {resetError && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span className="text-red-400 text-xs">⚠</span>
                    <p className="text-red-400 text-xs">{resetError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{ background: '#fbbf24', color: '#0f0f17' }}
                >
                  {resetLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                      İşleniyor...
                    </span>
                  ) : 'Şifreyi Güncelle'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
