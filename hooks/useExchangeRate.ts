"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExchangeRateData } from "@/types";

const FALLBACK_RATE = 45;

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
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/GBP");
      if (!res.ok) throw new Error("API yanıt vermedi");
      const data = await res.json();
      const tryRate: number = data?.rates?.TRY;
      if (!tryRate || typeof tryRate !== "number") {
        throw new Error("Kur verisi bulunamadı");
      }
      setRate(tryRate);
      setSource("live");
      setFetchedAt(new Date().toISOString());
    } catch (err) {
      setError("Kur verisi alınamadı, yedek kur kullanılıyor.");
      setRate(FALLBACK_RATE);
      setSource("fallback");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    // Her 30 dakikada otomatik yenile
    const interval = setInterval(fetchRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRate]);

  return { rate, source, fetchedAt, isLoading, error, refresh: fetchRate };
}

/** GBP değerini verilen kurla TL'ye çevirir */
export function gbpToTL(gbp: number, rate: number): number {
  return Math.round(gbp * rate);
}
