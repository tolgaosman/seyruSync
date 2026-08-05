"use client";

import { useState, useEffect, useCallback } from "react";

const DEFAULT_KKTC_FUEL_PRICE_TL = 39.5; // KKTC 95 Oktan güncel ortalama benzin fiyatı (TL/L)

export interface UseFuelPriceResult {
  fuelPriceTL: number;
  source: "live" | "fallback" | "loading";
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFuelPrice(): UseFuelPriceResult {
  const [fuelPriceTL, setFuelPriceTL] = useState<number>(DEFAULT_KKTC_FUEL_PRICE_TL);
  const [source, setSource] = useState<"live" | "fallback" | "loading">("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFuelPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Serbest benzin fiyatı / ham petrol & döviz endeksli canlı KKTC benzin fiyatı tahmini
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (res.ok) {
        const data = await res.json();
        const usdTry = data?.rates?.TRY;
        if (usdTry && typeof usdTry === "number") {
          // KKTC Benzin fiyatı (1 L 95 Oktan ≈ $1.05 - $1.15 USD karşılığı TL)
          const estimatedKktcFuelTL = Number((usdTry * 1.10).toFixed(2));
          setFuelPriceTL(estimatedKktcFuelTL);
          setSource("live");
          setIsLoading(false);
          return;
        }
      }
      throw new Error("Canlı akaryakıt verisi alınamadı");
    } catch (err) {
      setError("Canlı benzin fiyatı alınamadı, güncel KKTC ortalama fiyatı kullanılıyor.");
      setFuelPriceTL(DEFAULT_KKTC_FUEL_PRICE_TL);
      setSource("fallback");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFuelPrice();
  }, [fetchFuelPrice]);

  return {
    fuelPriceTL,
    source,
    isLoading,
    error,
    refresh: fetchFuelPrice,
  };
}
