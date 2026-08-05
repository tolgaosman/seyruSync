"use client";

import { useState, useEffect, useCallback } from "react";

const FALLBACK_RATE = 45.2;

export interface UseExchangeRateResult {
  rate: number;          // 1 GBP = ? TL
  source: "live" | "fallback" | "loading";
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useExchangeRate(): UseExchangeRateResult {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [source, setSource] = useState<"live" | "fallback" | "loading">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Provider 1: open.er-api.com
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/GBP");
      if (res.ok) {
        const data = await res.json();
        const tryRate: number = data?.rates?.TRY;
        if (tryRate && typeof tryRate === "number") {
          setRate(Number(tryRate.toFixed(4)));
          setSource("live");
          setFetchedAt(new Date().toISOString());
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Primary exchange rate provider failed, trying secondary:", e);
    }

    // Provider 2: Fawazahmed0 currency API
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.json"
      );
      if (res.ok) {
        const data = await res.json();
        const tryRate: number = data?.gbp?.try;
        if (tryRate && typeof tryRate === "number") {
          setRate(Number(tryRate.toFixed(4)));
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
    setRate(FALLBACK_RATE);
    setSource("fallback");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 15 * 60 * 1000); // 15 dk bir canlı yenile
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rate, source, fetchedAt, isLoading, error, refresh: fetchRate };
}

/** GBP değerini verilen kurla TL'ye çevirir */
export function gbpToTL(gbp: number, rate: number): number {
  return Math.round(gbp * rate);
}
