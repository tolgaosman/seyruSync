import { TaxResult, TCOBreakdown, Car } from "@/types";

// ============================================================
// KKTC Seyrüsefer Vergisi (Yol Vergisi) Hesaplama
// Ağırlık Baremleri – KKTC Maliye Bakanlığı Tarife Cetveli
// ============================================================

export const BAREMS = [
  {
    barem: 1 as const,
    label: "Barem 1",
    range: "0 – 1.016 kg",
    maxKg: 1016,
    ratePerKg: 2.5,
    color: "green",
  },
  {
    barem: 2 as const,
    label: "Barem 2",
    range: "1.017 – 1.270 kg",
    maxKg: 1270,
    ratePerKg: 4.0,
    color: "yellow",
  },
  {
    barem: 3 as const,
    label: "Barem 3",
    range: "1.271 – 1.524 kg",
    maxKg: 1524,
    ratePerKg: 5.0,
    color: "orange",
  },
  {
    barem: 4 as const,
    label: "Barem 4",
    range: "1.525 kg ve üzeri",
    maxKg: Infinity,
    ratePerKg: 7.0,
    color: "red",
  },
];

/** Sabit çevre katkı payı – KKTC yeşil vergi komponenti */
export const BASE_EMISSION_FEE = 500; // TL

/** KKTC benzin fiyatı (TL/litre) */
export const DEFAULT_FUEL_PRICE_TL = 55;

/** KKTC'de ortalama yıllık araç kullanımı (km) */
export const DEFAULT_ANNUAL_KM = 15_000;

/** Yedek GBP → TL kuru (API çekilemediğinde) */
export const FALLBACK_GBP_RATE = 45;

/**
 * Araç ağırlığına göre KKTC yıllık seyrüsefer vergisini hesaplar.
 * Seyrüsefer vergisi her zaman TL cinsindendir.
 * @param weightKg Araçın boş ağırlığı (kg)
 */
export function calculateRoadTax(weightKg: number): TaxResult {
  const baremEntry =
    BAREMS.find((b) => weightKg <= b.maxKg) ?? BAREMS[BAREMS.length - 1];

  const annualTax = weightKg * baremEntry.ratePerKg + BASE_EMISSION_FEE;

  return {
    barem: baremEntry.barem,
    baremLabel: baremEntry.label,
    baremRange: baremEntry.range,
    annualTax: Math.round(annualTax),
    ratePerKg: baremEntry.ratePerKg,
  };
}

/**
 * 5 Yıllık Toplam Sahip Olma Maliyeti (TCO) hesaplar.
 *
 * - Araç fiyatı GBP → TL çevirisi `gbpRate` ile yapılır
 * - Seyrüsefer vergisi TL olarak hesaplanır
 * - Yakıt maliyeti TL olarak hesaplanır
 * - Elektrikli araçlarda yakıt maliyeti sıfırdır
 *
 * @param car        Araç verisi (priceGBP ve weightKg kullanılır)
 * @param gbpRate    1 GBP = ? TL (canlı kur)
 * @param fuelPriceTL TL/litre yakıt fiyatı
 * @param annualKm   Yıllık km
 * @param years      TCO hesap süresi (yıl)
 */
export function calculateTCO(
  car: Pick<Car, "priceGBP" | "weightKg" | "avgFuelConsumption" | "fuelType">,
  gbpRate: number = FALLBACK_GBP_RATE,
  fuelPriceTL: number = DEFAULT_FUEL_PRICE_TL,
  annualKm: number = DEFAULT_ANNUAL_KM,
  years: number = 5
): TCOBreakdown {
  const { annualTax } = calculateRoadTax(car.weightKg);
  const fiveYearTax = annualTax * years;

  const vehiclePriceTL = Math.round(car.priceGBP * gbpRate);

  const fiveYearFuel =
    car.fuelType === "Elektrik"
      ? 0
      : Math.round(
          (car.avgFuelConsumption / 100) * annualKm * years * fuelPriceTL
        );

  return {
    vehiclePriceGBP: car.priceGBP,
    vehiclePriceTL,
    fiveYearTax,
    fiveYearFuel,
    total: vehiclePriceTL + fiveYearTax + fiveYearFuel,
  };
}

/** Sayıyı TL formatında biçimlendirir */
export function formatTL(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Sayıyı GBP formatında biçimlendirir */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Barem rengini döndürür (Tailwind class'ları).
 */
export function getBaremColors(barem: 1 | 2 | 3 | 4) {
  const map = {
    1: {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      border: "border-emerald-400",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      fill: "#10b981",
    },
    2: {
      badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      border: "border-yellow-400",
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      fill: "#f59e0b",
    },
    3: {
      badge: "bg-orange-100 text-orange-800 border-orange-300",
      border: "border-orange-400",
      text: "text-orange-700",
      bg: "bg-orange-50",
      fill: "#f97316",
    },
    4: {
      badge: "bg-red-100 text-red-800 border-red-300",
      border: "border-red-400",
      text: "text-red-700",
      bg: "bg-red-50",
      fill: "#ef4444",
    },
  };
  return map[barem];
}
