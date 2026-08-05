"use client";

import { useState, useEffect, useCallback } from "react";

const TARGET_URL = "https://www.triprentacar.com.tr/kibris-ta-petrol-fiyatlari.html";

export interface UseFuelPriceResult {
  fuelPriceTL: number;
  source: "live" | "cached";
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFuelPrice(): UseFuelPriceResult {
  const [fuelPriceTL, setFuelPriceTL] = useState<number>(61.12);
  const [source, setSource] = useState<"live" | "cached">("cached");
  const [lastUpdated, setLastUpdated] = useState<string>("05.08.2026 13:28");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveFuelPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const formatTimestamp = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${dateStr} ${timeStr}`;
    };

    // Proxy 1: api.allorigins.win
    try {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL)}`
      );
      if (res.ok) {
        const data = await res.json();
        const html: string = data?.contents || "";
        const match =
          html.match(/Kurşunsuz 95.*?(?:<strong>|<b>)\s*([\d.]+)/i) ||
          html.match(/95\s*oktan.*?(?:<strong>|<b>)\s*([\d.]+)/i);
        if (match && match[1]) {
          const parsedPrice = parseFloat(match[1]);
          if (!isNaN(parsedPrice) && parsedPrice > 20 && parsedPrice < 200) {
            setFuelPriceTL(parsedPrice);
            setSource("live");
            setLastUpdated(formatTimestamp());
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("AllOrigins proxy fetch failed:", e);
    }

    // Proxy 2: corsproxy.io
    try {
      const res = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(TARGET_URL)}`
      );
      if (res.ok) {
        const html = await res.text();
        const match =
          html.match(/Kurşunsuz 95.*?(?:<strong>|<b>)\s*([\d.]+)/i) ||
          html.match(/95\s*oktan.*?(?:<strong>|<b>)\s*([\d.]+)/i);
        if (match && match[1]) {
          const parsedPrice = parseFloat(match[1]);
          if (!isNaN(parsedPrice) && parsedPrice > 20 && parsedPrice < 200) {
            setFuelPriceTL(parsedPrice);
            setSource("live");
            setLastUpdated(formatTimestamp());
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Corsproxy fetch failed:", e);
    }

    // Fallback: Latest verified triprentacar.com.tr price
    setFuelPriceTL(61.12);
    setSource("cached");
    setLastUpdated("05.08.2026 13:28 (Resmi Güncel)");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLiveFuelPrice();
    // Her 24 saatte bir otomatik günlük kontrol
    const interval = setInterval(fetchLiveFuelPrice, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveFuelPrice]);

  return {
    fuelPriceTL,
    source,
    lastUpdated,
    isLoading,
    error,
    refresh: fetchLiveFuelPrice,
  };
}
