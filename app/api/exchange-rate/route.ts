import { NextResponse } from "next/server";
import type { ExchangeRateData } from "@/types";

/**
 * GET /api/exchange-rate
 *
 * exchangerate-api.com ücretsiz endpoint'ini kullanarak
 * o günün GBP → TRY kurunu çeker.
 *
 * Ücretsiz plan: API anahtarı gerektirmez, günlük güncelleme.
 * Hata durumunda fallback kur (45 TL/£) döner.
 */

const FALLBACK_RATE = 45; // Yedek sabit kur (1 GBP = 45 TL)
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 dakika cache

let cachedData: { rate: number; fetchedAt: number } | null = null;

export async function GET() {
  // Cache kontrolü — 30 dakikada bir yenile
  if (cachedData && Date.now() - cachedData.fetchedAt < CACHE_DURATION_MS) {
    const response: ExchangeRateData = {
      rate: cachedData.rate,
      source: "live",
      fetchedAt: new Date(cachedData.fetchedAt).toISOString(),
    };
    return NextResponse.json(response);
  }

  try {
    // exchangerate-api.com ücretsiz endpoint (API key gerekmez)
    const res = await fetch(
      "https://open.er-api.com/v6/latest/GBP",
      {
        next: { revalidate: 1800 }, // Next.js fetch cache — 30 dk
      }
    );

    if (!res.ok) {
      throw new Error(`Exchange rate API responded with ${res.status}`);
    }

    const data = await res.json();

    // data.rates.TRY = 1 GBP kaç TRY
    const tryRate: number = data?.rates?.TRY;

    if (!tryRate || typeof tryRate !== "number") {
      throw new Error("TRY rate not found in response");
    }

    // Cache'e kaydet
    cachedData = { rate: tryRate, fetchedAt: Date.now() };

    const response: ExchangeRateData = {
      rate: tryRate,
      source: "live",
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[exchange-rate] API fetch failed:", err);

    // Fallback kur ile devam et
    const response: ExchangeRateData = {
      rate: FALLBACK_RATE,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: { "X-Rate-Source": "fallback" },
    });
  }
}
