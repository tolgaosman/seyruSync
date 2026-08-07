"use client";

import { useCallback, useSyncExternalStore } from "react";
import { apiGet } from "@/lib/api";

const TARGET_URL = "https://www.triprentacar.com.tr/kibris-ta-petrol-fiyatlari.html";
const REFRESH_MS = 24 * 60 * 60 * 1000; // 24 saat
const CACHED_DATE = "05.08.2026";

export interface FuelPrices {
  oktan95: number;
  oktan98: number;
  euroDiesel: number;
  gazyagi: number;
}

export interface UseFuelPriceResult {
  prices: FuelPrices;
  source: "live" | "cached";
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const FALLBACK_PRICES: FuelPrices = {
  oktan95: 61.12,
  oktan98: 62.5,
  euroDiesel: 58.2,
  gazyagi: 58.0,
};

/* ────────────────────────────────────────────────────────────
   Modül seviyesinde paylaşılan durum — bkz. useExchangeRate.
   Hook hem sayfa başlığından hem akaryakıt widget'ından çağrılıyor;
   tek fetch döngüsü yeterli.
   ──────────────────────────────────────────────────────────── */

interface Snapshot {
  prices: FuelPrices;
  source: "live" | "cached";
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
}

let snapshot: Snapshot = {
  prices: FALLBACK_PRICES,
  source: "cached",
  lastUpdated: CACHED_DATE,
  isLoading: true,
  error: null,
  hasFetched: false,
};

const subscribers = new Set<() => void>();
let inflight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function publish(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  subscribers.forEach((fn) => fn());
}

/** useSyncExternalStore aboneliği — ilk abone döngüyü başlatır, son abone durdurur */
function subscribe(onStoreChange: () => void): () => void {
  subscribers.add(onStoreChange);

  if (subscribers.size === 1) {
    if (!snapshot.hasFetched) queueMicrotask(() => void fetchFuelPrices());
    timer = setInterval(() => void fetchFuelPrices(), REFRESH_MS);
  }

  return () => {
    subscribers.delete(onStoreChange);
    if (subscribers.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => snapshot;

function formatDate(): string {
  return new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** HTML'den fiyatları ayıklar; başarılıysa yayınlar ve true döner. */
function parseHtml(html: string): boolean {
  const extract = (regex1: RegExp, regex2?: RegExp): number | null => {
    let m = html.match(regex1);
    if (!m && regex2) m = html.match(regex2);
    if (m && m[1]) {
      const p = parseFloat(m[1].replace(",", "."));
      if (!isNaN(p) && p > 20 && p < 200) return p;
    }
    return null;
  };

  const p95 = extract(
    /Kurşunsuz\s*95.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i,
    /95\s*oktan.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i
  );
  const p98 = extract(
    /Kurşunsuz\s*98.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i,
    /98\s*oktan.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i
  );
  const diesel = extract(
    /Euro\s*Diesel.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i,
    /Euro\s*Dizel.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i
  );
  const gaz = extract(/Gazyağı.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i);

  if (p95) {
    publish({
      prices: {
        oktan95: p95,
        oktan98: p98 ?? p95 + 1.38, // guess based on fallback offset
        euroDiesel: diesel ?? p95 - 2.92,
        gazyagi: gaz ?? p95 - 3.12,
      },
      source: "live",
      lastUpdated: formatDate(),
      isLoading: false,
      error: null,
      hasFetched: true,
    });
    return true;
  }
  return false;
}

async function fetchFuelPrices(): Promise<void> {
  if (inflight) return inflight;

  inflight = (async () => {
    publish({ isLoading: true, error: null });

    // Proxy 0: kendi backend'imiz — sunucu tarafında kazır, önbelleğe alır.
    // Tarayıcıdaki eski kazıma/proxy zinciri (aşağıda) yalnızca backend
    // ulaşılamadığında devreye giriyor; silinmedi, yedek olarak duruyor.
    const backend = await apiGet<{
      prices: FuelPrices;
      source: "live" | "cached" | "stale" | "fallback";
      lastUpdated: string;
    }>("/api/fuel", 8000);
    if (backend?.prices?.oktan95) {
      publish({
        prices: backend.prices,
        source: backend.source === "live" ? "live" : "cached",
        lastUpdated: backend.lastUpdated,
        isLoading: false,
        error: null,
        hasFetched: true,
      });
      return;
    }

    // Proxy 1: api.allorigins.win
    try {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        const html = data?.contents || "";
        if (parseHtml(html)) return;
      }
    } catch (e) {
      console.warn("AllOrigins proxy fetch failed:", e);
    }

    // Proxy 2: corsproxy.io
    try {
      const res = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(TARGET_URL)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const html = await res.text();
        if (parseHtml(html)) return;
      }
    } catch (e) {
      console.warn("Corsproxy fetch failed:", e);
    }

    // Fallback
    publish({
      prices: FALLBACK_PRICES,
      source: "cached",
      lastUpdated: CACHED_DATE,
      isLoading: false,
      error: "Canlı akaryakıt fiyatı çekilemedi, kayıtlı fiyatlar gösteriliyor.",
      hasFetched: true,
    });
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function useFuelPrice(): UseFuelPriceResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => void fetchFuelPrices(), []);

  return {
    prices: state.prices,
    source: state.source,
    lastUpdated: state.lastUpdated,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}
