'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, type Theme } from '@/components/ThemeProvider';

const THEMES: { id: Theme; label: string; desc: string; dot: string }[] = [
  { id: 'dark',  label: 'Koyu',     desc: 'Varsayılan koyu mor',  dot: '#0f0f17' },
  { id: 'navy',  label: 'Lacivert', desc: 'Koyu mavi gece',       dot: '#0f172a' },
  { id: 'light', label: 'Açık',     desc: 'Aydınlık tema',        dot: '#f8fafc' },
];

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [msg, setMsg]                 = useState('');
  const [saving, setSaving]           = useState(false);
  const { theme, setTheme }           = useTheme();
  const router = useRouter();

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setMsg('Şifreler eşleşmiyor'); return; }
    if (newPassword.length < 4)  { setMsg('Şifre en az 4 karakter olmalı'); return; }
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'password', value: newPassword }),
    });
    setSaving(false);
    if (res.ok) { setMsg('Şifre değiştirildi'); setNewPassword(''); setConfirm(''); }
    else        { setMsg('Hata oluştu'); }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <header className="flex items-center gap-3 px-4 py-2.5 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
        <span className="text-amber-400 font-bold text-lg">♠</span>
        <span className="font-bold text-white text-sm">Casino Takip</span>
        <span className="text-slate-500 text-sm">· Ayarlar</span>
        <div className="ml-auto">
          <button onClick={() => router.push('/dashboard')}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border transition-colors"
            style={{ borderColor: 'var(--border-accent)' }}>
            ← Geri
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-lg font-semibold text-white">Ayarlar</h1>

        {/* Tema Seçici */}
        <div className="rounded-xl border p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold text-white">Tema</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className="rounded-xl p-3 border text-left transition-all"
                style={theme === t.id
                  ? { borderColor: 'rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.08)' }
                  : { borderColor: 'var(--border-accent)', background: 'var(--bg-input)' }}>
                {/* Preview dot */}
                <div className="w-8 h-8 rounded-lg mb-2 border"
                  style={{ background: t.dot, borderColor: 'var(--border-accent)' }} />
                <p className="text-xs font-semibold text-white leading-tight">{t.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                {theme === t.id && (
                  <p className="text-[10px] text-amber-400 mt-1 font-semibold">✓ Aktif</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Şifre Değiştir */}
        <div className="rounded-xl border p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-sm font-semibold text-white">Şifre Değiştir</h2>
          <form onSubmit={changePassword} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Yeni Şifre</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)' }}
                placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Şifre Tekrar</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-accent)' }}
                placeholder="••••••••" required />
            </div>
            {msg && (
              <p className={`text-sm ${msg.includes('değiştirildi') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 transition-all active:scale-95"
              style={{ background: '#fbbf24', color: '#0f0f17' }}>
              {saving ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
