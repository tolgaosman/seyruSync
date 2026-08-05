"use client";

/**
 * KKTC Resmi Akaryakıt Fiyatları
 * Kaynak: https://www.triprentacar.com.tr/kibris-ta-petrol-fiyatlari.html
 * 
 * - Kurşunsuz 95 Oktan Benzin: 61.12 TL/L
 * - Kurşunsuz 98 Oktan Benzin: 62.12 TL/L
 * - Euro Diesel: 60.00 TL/L
 */

export const KKTC_FUEL_PRICES = {
  gasoline95: 61.12, // TL/Litre
  gasoline98: 62.12, // TL/Litre
  diesel: 60.00,     // TL/Litre
};

export function useFuelPrice() {
  return {
    fuelPriceTL: KKTC_FUEL_PRICES.gasoline95,
    prices: KKTC_FUEL_PRICES,
    isFixed: true,
  };
}
