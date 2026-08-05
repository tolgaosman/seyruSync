export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  weightKg: number;
  priceGBP: number; // Sterlin (£) cinsinden araç fiyatı
  avgFuelConsumption: number; // L/100km (elektrikli araçlarda 0)
  fuelType: "Benzin" | "Dizel" | "Hibrit" | "Elektrik";
  engineCC?: number; // cc
}

export interface TaxResult {
  barem: 1 | 2 | 3 | 4;
  baremLabel: string;
  baremRange: string;
  annualTax: number; // TL
  ratePerKg: number;
}

export interface TCOBreakdown {
  vehiclePriceGBP: number; // Araç fiyatı (£)
  vehiclePriceTL: number;  // Araç fiyatı (TL) — o günün kuru ile
  fiveYearTax: number;     // TL
  fiveYearFuel: number;    // TL
  total: number;           // TL (araç TL + 5 yıl vergi + 5 yıl yakıt)
}

export interface CustomCarInput {
  name: string;
  weightKg: number;
  priceGBP: number; // GBP olarak girilir
  avgFuelConsumption: number;
  fuelType: "Benzin" | "Dizel" | "Hibrit" | "Elektrik";
}

export interface ExchangeRateData {
  rate: number;       // 1 GBP = X TL
  source: "live" | "fallback";
  fetchedAt: string;  // ISO timestamp
}
