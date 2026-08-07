"use client";

import { useCallback, useSyncExternalStore } from "react";
import { apiGet } from "@/lib/api";

const FALLBACK_RATES = {
  gbp: 45.2,
  usd: 35.1,
  eur: 38.5,
};

const REFRESH_MS = 15 * 60 * 1000; // 15 dk

export interface ExchangeRates {
  gbp: number;
  usd: number;
  eur: number;
}

export interface UseExchangeRateResult {
  rates: ExchangeRates;
  rate: number; // backward compatibility (GBP)
  source: "live" | "fallback" | "loading";
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/* ────────────────────────────────────────────────────────────
   Modül seviyesinde paylaşılan durum.

   Hook birden fazla yerden çağrılıyor (sayfa başlığı + kur widget'ı).
   Önceden her mount kendi fetch'ini ve kendi setInterval'ını başlatıyordu;
   bu hem gereksiz istek hem de iki tüketicinin farklı kur göstermesi
   demekti. Artık tek kaynak var, herkes ona abone.
   ──────────────────────────────────────────────────────────── */

interface Snapshot {
  rates: ExchangeRates;
  source: "live" | "fallback" | "loading";
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

let snapshot: Snapshot = {
  rates: FALLBACK_RATES,
  source: "loading",
  fetchedAt: null,
  isLoading: true,
  error: null,
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
    if (snapshot.fetchedAt === null) queueMicrotask(() => void fetchRates());
    timer = setInterval(() => void fetchRates(), REFRESH_MS);
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

async function fetchRates(): Promise<void> {
  // Zaten uçuşta bir istek varsa ona bağlan
  if (inflight) return inflight;

  inflight = (async () => {
    publish({ isLoading: true, error: null });

    // Provider 0: kendi backend'imiz — önbellekli, proxy'siz.
    const backend = await apiGet<{
      rates: ExchangeRates;
      source: "live" | "fallback" | "cached" | "stale";
      fetchedAt: string;
    }>("/api/rates", 6000);
    if (backend?.rates?.gbp) {
      publish({
        rates: backend.rates,
        source: backend.source === "live" ? "live" : "fallback",
        fetchedAt: backend.fetchedAt,
        isLoading: false,
      });
      return;
    }

    // Provider 1: open.er-api.com
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        const tryRate = data?.rates?.TRY;
        const gbpRate = data?.rates?.GBP;
        const eurRate = data?.rates?.EUR;

        if (tryRate && gbpRate && eurRate) {
          publish({
            rates: {
              usd: Number(tryRate.toFixed(4)),
              gbp: Number((tryRate / gbpRate).toFixed(4)),
              eur: Number((tryRate / eurRate).toFixed(4)),
            },
            source: "live",
            fetchedAt: new Date().toISOString(),
            isLoading: false,
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Primary exchange rate provider failed:", e);
    }

    // Provider 2: Fawazahmed0 currency API
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        const tryRate = data?.usd?.try;
        const gbpRate = data?.usd?.gbp;
        const eurRate = data?.usd?.eur;

        if (tryRate && gbpRate && eurRate) {
          publish({
            rates: {
              usd: Number(tryRate.toFixed(4)),
              gbp: Number((tryRate / gbpRate).toFixed(4)),
              eur: Number((tryRate / eurRate).toFixed(4)),
            },
            source: "live",
            fetchedAt: new Date().toISOString(),
            isLoading: false,
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Secondary exchange rate provider failed:", e);
    }

    // Fallback
    publish({
      rates: FALLBACK_RATES,
      source: "fallback",
      isLoading: false,
      error: "Canlı kur verisi çekilemedi, KKTC güncel yedek kur kullanılıyor.",
    });
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function useExchangeRate(): UseExchangeRateResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const refresh = useCallback(() => void fetchRates(), []);

  return {
    rates: state.rates,
    rate: state.rates.gbp,
    source: state.source,
    fetchedAt: state.fetchedAt,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  };
}

/** GBP değerini verilen kurla TL'ye çevirir */
export function gbpToTL(gbp: number, rate: number): number {
  return Math.round(gbp * rate);
}
