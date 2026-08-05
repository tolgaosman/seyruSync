"use client";

import { useState, useEffect, useCallback } from "react";

const TARGET_URL = "https://www.triprentacar.com.tr/kibris-ta-petrol-fiyatlari.html";

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
  oktan98: 62.50,
  euroDiesel: 58.20,
  gazyagi: 58.00,
};

export function useFuelPrice(): UseFuelPriceResult {
  const [prices, setPrices] = useState<FuelPrices>(FALLBACK_PRICES);
  const [source, setSource] = useState<"live" | "cached">("cached");
  const [lastUpdated, setLastUpdated] = useState<string>("05.08.2026");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveFuelPrice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const formatDate = () => {
      const now = new Date();
      return now.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const parseHtml = (html: string) => {
      const extract = (regex1: RegExp, regex2?: RegExp): number | null => {
        let m = html.match(regex1);
        if (!m && regex2) m = html.match(regex2);
        if (m && m[1]) {
          const p = parseFloat(m[1].replace(",", "."));
          if (!isNaN(p) && p > 20 && p < 200) return p;
        }
        return null;
      };

      const p95 = extract(/Kurşunsuz\s*95.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i, /95\s*oktan.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i);
      const p98 = extract(/Kurşunsuz\s*98.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i, /98\s*oktan.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i);
      const diesel = extract(/Euro\s*Diesel.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i, /Euro\s*Dizel.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i);
      const gaz = extract(/Gazyağı.*?(?:<strong>|<b>|<td>)\s*([\d.,]+)/i);

      if (p95) {
        setPrices({
          oktan95: p95,
          oktan98: p98 ?? p95 + 1.38, // guess based on fallback offset
          euroDiesel: diesel ?? p95 - 2.92,
          gazyagi: gaz ?? p95 - 3.12,
        });
        setSource("live");
        setLastUpdated(formatDate());
        setIsLoading(false);
        return true;
      }
      return false;
    };

    // Proxy 1: api.allorigins.win
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL)}`);
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
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(TARGET_URL)}`);
      if (res.ok) {
        const html = await res.text();
        if (parseHtml(html)) return;
      }
    } catch (e) {
      console.warn("Corsproxy fetch failed:", e);
    }

    // Fallback
    setPrices(FALLBACK_PRICES);
    setSource("cached");
    setLastUpdated("05.08.2026");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLiveFuelPrice();
    const interval = setInterval(fetchLiveFuelPrice, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveFuelPrice]);

  return { prices, source, lastUpdated, isLoading, error, refresh: fetchLiveFuelPrice };
}
