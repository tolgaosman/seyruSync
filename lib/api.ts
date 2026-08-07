/**
 * Kendi Python backend'imize istemci. `NEXT_PUBLIC_API_URL` build zamanında
 * bundle'a gömülür (statik export) — tanımsızsa backend tamamen devre dışı
 * kalır ve mevcut fallback merdivenleri (yerel JSON, sezgisel tahmin, doğrudan
 * kur sağlayıcıları) hiç değişmeden devreye girer.
 */

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const apiEnabled = (): boolean => BASE.length > 0;

/**
 * Hiçbir zaman throw etmez — ağ hatası, timeout, backend kapalı ya da
 * geçersiz yanıt: hepsi `null`. Çağıran taraf `null` gördüğünde kendi
 * fallback merdivenine düşer.
 */
export async function apiGet<T>(path: string, timeoutMs = 6000): Promise<T | null> {
  if (!apiEnabled()) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
