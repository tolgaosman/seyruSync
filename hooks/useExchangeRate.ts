"use client";

import { useState, useEffect, useCallback } from "react";

const FALLBACK_RATES = {
  gbp: 45.2,
  usd: 35.1,
  eur: 38.5,
};

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

export function useExchangeRate(): UseExchangeRateResult {
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [source, setSource] = useState<"live" | "fallback" | "loading">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Provider 1: open.er-api.com
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (res.ok) {
        const data = await res.json();
        const tryRate = data?.rates?.TRY;
        const gbpRate = data?.rates?.GBP;
        const eurRate = data?.rates?.EUR;

        if (tryRate && gbpRate && eurRate) {
          setRates({
            usd: Number(tryRate.toFixed(4)),
            gbp: Number((tryRate / gbpRate).toFixed(4)),
            eur: Number((tryRate / eurRate).toFixed(4)),
          });
          setSource("live");
          setFetchedAt(new Date().toISOString());
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Primary exchange rate provider failed:", e);
    }

    // Provider 2: Fawazahmed0 currency API
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
      );
      if (res.ok) {
        const data = await res.json();
        const tryRate = data?.usd?.try;
        const gbpRate = data?.usd?.gbp;
        const eurRate = data?.usd?.eur;

        if (tryRate && gbpRate && eurRate) {
          setRates({
            usd: Number(tryRate.toFixed(4)),
            gbp: Number((tryRate / gbpRate).toFixed(4)),
            eur: Number((tryRate / eurRate).toFixed(4)),
          });
          setSource("live");
          setFetchedAt(new Date().toISOString());
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Secondary exchange rate provider failed:", e);
    }

    // Fallback
    setError("Canlı kur verisi çekilemedi, KKTC güncel yedek kur kullanılıyor.");
    setRates(FALLBACK_RATES);
    setSource("fallback");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 15 * 60 * 1000); // 15 dk bir canlı yenile
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rates, rate: rates.gbp, source, fetchedAt, isLoading, error, refresh: fetchRate };
}

/** GBP değerini verilen kurla TL'ye çevirir */
export function gbpToTL(gbp: number, rate: number): number {
  return Math.round(gbp * rate);
}
