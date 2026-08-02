/**
 * In-memory password cache.
 * Sunucu başladığında şifreyi bir kez Supabase'den çeker,
 * sonraki login isteklerinde cache'ten okur → sıfır gecikme.
 * Reset sonrası invalidate() çağrılarak cache temizlenir.
 */
import { supabaseAdmin } from './supabase';

// globalThis üzerinde saklayarak hot-reload'da cache korunur
declare global {
  // eslint-disable-next-line no-var
  var __passwordCache: { value: string; ts: number } | null;
}
if (!globalThis.__passwordCache) globalThis.__passwordCache = null;

/** Cache max yaşı: 5 dakika (güvenlik için) */
const MAX_AGE_MS = 5 * 60 * 1000;

export async function getCachedPassword(): Promise<string | null> {
  const now = Date.now();
  if (
    globalThis.__passwordCache &&
    now - globalThis.__passwordCache.ts < MAX_AGE_MS
  ) {
    return globalThis.__passwordCache.value;
  }

  // Cache yok veya süresi dolmuş — Supabase'den çek
  const { data } = await supabaseAdmin
    .from('settings')
    .select('v')
    .eq('k', 'password')
    .single();

  if (!data?.v) return null;

  globalThis.__passwordCache = { value: data.v, ts: now };
  return data.v;
}

/** Reset sonrası çağrılır — bir sonraki login yeniden çeker */
export function invalidatePasswordCache() {
  globalThis.__passwordCache = null;
}
