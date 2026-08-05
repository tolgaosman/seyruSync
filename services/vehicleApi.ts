import { Car } from "@/types";

/**
 * Dinamik İnternet Araç Arama Servisi (CarQuery API)
 * Marka → Model → Yıl → Motor Hacmi (cc) sırayla sorgulanır.
 */

export interface CarQueryMake {
  make_id: string;
  make_display: string;
}

export interface CarQueryModel {
  model_name: string;
  model_make_id: string;
}

export interface CarQueryTrim {
  model_id: string;
  model_make_id: string;
  model_name: string;
  model_trim: string;
  model_year: string;
  model_weight_kg: string | null;
  model_engine_cc: string | null;
  model_engine_power_ps: string | null;
  model_lkm_mixed: string | null;
  model_fuel_type: string | null;
}

/** Popüler markalar (CarQuery'den çekilemediyse fallback) */
export const POPULAR_MAKES = [
  "Toyota",
  "Volkswagen",
  "BMW",
  "Mercedes-Benz",
  "Honda",
  "Ford",
  "Nissan",
  "Hyundai",
  "Kia",
  "Audi",
  "Peugeot",
  "Renault",
  "Suzuki",
  "Mazda",
  "Volvo",
  "Tesla",
  "Skoda",
  "Fiat",
  "Land Rover",
  "Porsche",
  "Opel",
  "Seat",
  "Citroën",
  "Dacia",
  "Mitsubishi",
  "Subaru",
  "Lexus",
  "Infiniti",
  "Alfa Romeo",
  "Jeep",
];

/** JSONP / JSON temizleyici */
function parseCarQuery(text: string): unknown {
  const clean = text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, "");
  return JSON.parse(clean);
}

/** Markaları çek */
export async function fetchMakesOnline(): Promise<string[]> {
  try {
    const res = await fetch("https://www.carqueryapi.com/api/0.3/?cmd=getMakes");
    if (!res.ok) throw new Error("getMakes failed");
    const data = parseCarQuery(await res.text()) as { Makes?: CarQueryMake[] };
    if (data.Makes?.length) {
      return data.Makes.map((m) => m.make_display);
    }
  } catch (err) {
    console.warn("Marka listesi çekilemedi:", err);
  }
  return POPULAR_MAKES;
}

/** Marka seçilince modelleri çek */
export async function fetchModelsOnline(make: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${encodeURIComponent(make.toLowerCase())}`
    );
    if (!res.ok) throw new Error("getModels failed");
    const data = parseCarQuery(await res.text()) as { Models?: CarQueryModel[] };
    if (data.Models?.length) {
      return data.Models.map((m) => m.model_name);
    }
  } catch (err) {
    console.warn("Model listesi çekilemedi:", err);
  }
  return [];
}

/** Model seçilince üretim yıllarını çek (benzersiz, sıralı) */
export async function fetchYearsOnline(make: string, model: string): Promise<number[]> {
  try {
    const res = await fetch(
      `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(
        make.toLowerCase()
      )}&model=${encodeURIComponent(model.toLowerCase())}`
    );
    if (!res.ok) throw new Error("getTrims (years) failed");
    const data = parseCarQuery(await res.text()) as { Trims?: CarQueryTrim[] };
    if (data.Trims?.length) {
      const years = [
        ...new Set(
          data.Trims.map((t) => parseInt(t.model_year)).filter((y) => !isNaN(y))
        ),
      ].sort((a, b) => b - a);
      return years;
    }
  } catch (err) {
    console.warn("Yıllar çekilemedi:", err);
  }
  return [];
}

export interface EngineOption {
  cc: number;
  fuelType: "Benzin" | "Dizel" | "Hibrit" | "Elektrik";
  trim: string;
  weightKg: number;
  fuelConsumption: number;
  label: string;
}

/** Yıl seçilince motor hacmi seçeneklerini çek */
export async function fetchEnginesOnline(
  make: string,
  model: string,
  year: number
): Promise<EngineOption[]> {
  try {
    const res = await fetch(
      `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(
        make.toLowerCase()
      )}&model=${encodeURIComponent(model.toLowerCase())}&year=${year}`
    );
    if (!res.ok) throw new Error("getTrims (engines) failed");
    const data = parseCarQuery(await res.text()) as { Trims?: CarQueryTrim[] };
    if (data.Trims?.length) {
      const seen = new Set<string>();
      const engines: EngineOption[] = [];
      for (const t of data.Trims) {
        const cc = parseInt(t.model_engine_cc ?? "0") || 0;
        const ft = normalizeFuelType(t.model_fuel_type ?? "");
        const key = `${cc}-${ft}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const weight = parseFloat(t.model_weight_kg ?? "0") || 1350;
        const consumption = parseFloat(t.model_lkm_mixed ?? "0") || (ft === "Elektrik" ? 0 : 7.0);
        const ccLabel = cc > 0 ? `${cc} cc` : "Bilinmiyor";
        engines.push({
          cc,
          fuelType: ft,
          trim: t.model_trim || "",
          weightKg: Math.round(weight),
          fuelConsumption: Number(consumption.toFixed(1)),
          label: `${ccLabel} – ${ft}${t.model_trim ? ` (${t.model_trim})` : ""}`,
        });
      }
      // Sort by cc desc
      return engines.sort((a, b) => b.cc - a.cc);
    }
  } catch (err) {
    console.warn("Motor seçenekleri çekilemedi:", err);
  }
  return [];
}

function normalizeFuelType(
  raw: string
): "Benzin" | "Dizel" | "Hibrit" | "Elektrik" {
  const l = raw.toLowerCase();
  if (l.includes("electric")) return "Elektrik";
  if (l.includes("hybrid")) return "Hibrit";
  if (l.includes("diesel")) return "Dizel";
  return "Benzin";
}

/**
 * Seçimler tamamlanınca Car nesnesini oluştur.
 * Veriler CarQuery'den gelir; eksikse akıllı tahminler kullanılır.
 */
export function buildCar(
  make: string,
  model: string,
  year: number,
  engine: EngineOption
): Car {
  return {
    id: `online-${make}-${model}-${year}-${engine.cc}-${Date.now()}`,
    brand: make,
    model,
    year,
    weightKg: engine.weightKg,
    priceGBP: estimatePriceGBP(make, model, year, engine.cc, engine.fuelType),
    avgFuelConsumption: engine.fuelConsumption,
    fuelType: engine.fuelType,
    engineCC: engine.cc,
  };
}

function estimatePriceGBP(
  make: string,
  model: string,
  year: number,
  cc: number,
  fuelType: string
): number {
  const full = `${make} ${model}`.toLowerCase();
  const age = new Date().getFullYear() - year;
  let base = 18000;

  if (["tesla", "porsche", "ferrari", "lamborghini", "bentley", "aston martin"].some((b) => full.includes(b))) {
    base = fuelType === "Elektrik" ? 60000 : 85000;
  } else if (["bmw", "mercedes", "audi", "lexus", "land rover", "volvo", "jaguar"].some((b) => full.includes(b))) {
    base = 40000;
  } else if (cc > 2000) {
    base = 30000;
  } else if (cc > 1600) {
    base = 23000;
  }

  if (fuelType === "Elektrik") base = Math.max(base, 32000);
  else if (fuelType === "Hibrit") base = Math.max(base, 22000);

  // Yaş ile değer kaybı (~%8/yıl)
  const depreciation = Math.pow(0.92, age);
  return Math.round(base * depreciation);
}

/** Eski API uyumluluğu için */
export async function fetchVehicleSpecsOnline(
  make: string,
  model: string,
  year: number = new Date().getFullYear()
): Promise<Car> {
  const engines = await fetchEnginesOnline(make, model, year);
  const engine = engines[0] ?? {
    cc: 1400,
    fuelType: "Benzin" as const,
    trim: "",
    weightKg: 1350,
    fuelConsumption: 7.0,
    label: "1400 cc – Benzin",
  };
  return buildCar(make, model, year, engine);
}
