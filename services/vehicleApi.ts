import { Car } from "@/types";

/**
 * Dinamik İnternet Araç Arama Servisi
 * CarQuery API – CORS proxy üzerinden çekilir, hata durumunda fallback listeler kullanılır.
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

/** Popüler markalar fallback listesi */
export const POPULAR_MAKES = [
  "Alfa Romeo", "Audi", "BMW", "Citroën", "Dacia", "Fiat",
  "Ford", "Honda", "Hyundai", "Jeep", "Kia", "Land Rover",
  "Lexus", "Mazda", "Mercedes-Benz", "Mitsubishi", "Nissan",
  "Opel", "Peugeot", "Porsche", "Renault", "Seat", "Skoda",
  "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

/** Popüler marka modelleri – CarQuery başarısız olursa kullanılır */
const FALLBACK_MODELS: Record<string, string[]> = {
  "Toyota":         ["Corolla", "Camry", "RAV4", "Yaris", "C-HR", "Land Cruiser", "Prius", "Hilux", "Auris", "Avensis"],
  "Volkswagen":     ["Golf", "Polo", "Passat", "Tiguan", "T-Roc", "Touareg", "Arteon", "ID.3", "ID.4", "Caddy"],
  "BMW":            ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X6", "iX"],
  "Mercedes-Benz":  ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "EQA", "EQC"],
  "Honda":          ["Civic", "CR-V", "HR-V", "Jazz", "Accord", "e:Ny1", "ZR-V"],
  "Ford":           ["Fiesta", "Focus", "Kuga", "Puma", "Mustang Mach-E", "Explorer", "EcoSport", "Mondeo", "Transit"],
  "Nissan":         ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Navara", "Note"],
  "Hyundai":        ["i10", "i20", "i30", "Tucson", "Santa Fe", "Kona", "IONIQ 5", "IONIQ 6"],
  "Kia":            ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "EV6", "Stonic", "Niro"],
  "Audi":           ["A1", "A3", "A4", "A5", "A6", "Q3", "Q5", "Q7", "e-tron", "e-tron GT"],
  "Peugeot":        ["108", "208", "308", "508", "2008", "3008", "5008", "e-208", "e-2008"],
  "Renault":        ["Clio", "Megane", "Kadjar", "Captur", "Zoe", "Arkana", "Austral", "Scenic"],
  "Suzuki":         ["Swift", "Vitara", "SX4 S-Cross", "Ignis", "Jimny", "Swace"],
  "Mazda":          ["Mazda2", "Demio", "Mazda3", "Mazda6", "CX-3", "CX-5", "CX-30", "MX-5", "CX-60"],
  "Volvo":          ["XC40", "XC60", "XC90", "S60", "S90", "V60", "V90", "C40"],
  "Tesla":          ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Skoda":          ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"],
  "Fiat":           ["500", "Panda", "Tipo", "500X", "500L", "500e"],
  "Land Rover":     ["Discovery Sport", "Discovery", "Defender", "Range Rover Sport", "Range Rover Evoque", "Range Rover"],
  "Porsche":        ["Cayenne", "Macan", "Panamera", "911", "Taycan", "Cayman", "Boxster"],
  "Opel":           ["Corsa", "Astra", "Mokka", "Grandland", "Crossland", "Insignia"],
  "Seat":           ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
  "Citroën":        ["C1", "C3", "C4", "C5 X", "Berlingo", "ë-C4"],
  "Dacia":          ["Sandero", "Duster", "Logan", "Jogger", "Spring"],
  "Mitsubishi":     ["ASX", "Eclipse Cross", "Outlander", "L200"],
  "Subaru":         ["Impreza", "Forester", "Outback", "XV", "BRZ", "Levorg"],
  "Jeep":           ["Renegade", "Compass", "Wrangler", "Grand Cherokee", "Avenger"],
  "Lexus":          ["IS", "ES", "NX", "RX", "UX", "LX", "GX"],
  "Alfa Romeo":     ["Giulia", "Stelvio", "Tonale", "Giulietta"],
};

/** Fallback yıl listesi (son 15 yıl) */
function fallbackYears(): number[] {
  const cur = new Date().getFullYear();
  return Array.from({ length: 16 }, (_, i) => cur - i);
}

/** JSONP/JSON temizleyici */
function parseCarQuery(text: string): unknown {
  // JSONP: callback({...}); — veya düz JSON: {...}
  const clean = text.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, "");
  return JSON.parse(clean);
}

/** CORS proxy üzerinden CarQuery isteği yapar */
async function carQueryFetch(url: string): Promise<string | null> {
  // Önce doğrudan dene
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.text();
  } catch {
    /* CORS veya timeout */
  }

  // Proxy 1: allorigins
  try {
    const res = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      return data?.contents ?? null;
    }
  } catch {
    /* proxy 1 başarısız */
  }

  // Proxy 2: corsproxy.io
  try {
    const res = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) return await res.text();
  } catch {
    /* proxy 2 başarısız */
  }

  return null;
}

const BASE = "https://www.carqueryapi.com/api/0.3/";

/** Markaları çek */
export async function fetchMakesOnline(): Promise<string[]> {
  try {
    const text = await carQueryFetch(`${BASE}?cmd=getMakes`);
    if (text) {
      const data = parseCarQuery(text) as { Makes?: CarQueryMake[] };
      if (data.Makes?.length) {
        return data.Makes.map((m) => m.make_display).sort();
      }
    }
  } catch (err) {
    console.warn("Marka listesi çekilemedi:", err);
  }
  return POPULAR_MAKES;
}

/** Marka seçilince modelleri çek */
export async function fetchModelsOnline(make: string): Promise<string[]> {
  try {
    const url = `${BASE}?cmd=getModels&make=${encodeURIComponent(make.toLowerCase())}`;
    const text = await carQueryFetch(url);
    if (text) {
      const data = parseCarQuery(text) as { Models?: CarQueryModel[] };
      if (data.Models?.length) {
        return data.Models.map((m) => m.model_name).sort();
      }
    }
  } catch (err) {
    console.warn("Model listesi çekilemedi:", err);
  }
  // Fallback
  return FALLBACK_MODELS[make] ?? [];
}

/** Model seçilince üretim yıllarını çek */
export async function fetchYearsOnline(make: string, model: string): Promise<number[]> {
  try {
    const url =
      `${BASE}?cmd=getTrims&make=${encodeURIComponent(make.toLowerCase())}&model=${encodeURIComponent(model.toLowerCase())}`;
    const text = await carQueryFetch(url);
    if (text) {
      const data = parseCarQuery(text) as { Trims?: CarQueryTrim[] };
      if (data.Trims?.length) {
        const allYears = [
          ...new Set(
            data.Trims.map((t) => parseInt(t.model_year)).filter((y) => !isNaN(y))
          ),
        ].sort((a, b) => a - b); // Küçükten büyüğe sırala

        if (allYears.length === 0) return fallbackYears();

        // Yeni kasa (Generation) tespiti
        const generationYears: number[] = [];
        let lastGenYear = -1;
        let prevYear = -1;

        for (const y of allYears) {
          if (lastGenYear === -1) {
            generationYears.push(y);
            lastGenYear = y;
          } else {
            // Eğer üretimde boşluk varsa (y > prevYear + 1) veya son kasadan bu yana 4 yıl geçtiyse
            if (y > prevYear + 1 || y - lastGenYear >= 4) {
              generationYears.push(y);
              lastGenYear = y;
            }
          }
          prevYear = y;
        }

        return generationYears.sort((a, b) => b - a); // Büyükten küçüğe sıralayarak döndür
      }
    }
  } catch (err) {
    console.warn("Yıl listesi çekilemedi:", err);
  }
  return fallbackYears();
}

export interface EngineOption {
  cc: number;
  fuelType: "Benzin" | "Dizel" | "Hibrit" | "Elektrik";
  trim: string;
  weightKg: number;
  fuelConsumption: number;
  label: string;
}

/** Yıl seçilince motor seçeneklerini çek */
export async function fetchEnginesOnline(
  make: string,
  model: string,
  year: number
): Promise<EngineOption[]> {
  try {
    const url =
      `${BASE}?cmd=getTrims&make=${encodeURIComponent(make.toLowerCase())}&model=${encodeURIComponent(model.toLowerCase())}&year=${year}`;
    const text = await carQueryFetch(url);
    if (text) {
      const data = parseCarQuery(text) as { Trims?: CarQueryTrim[] };
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
          const cons = parseFloat(t.model_lkm_mixed ?? "0") || (ft === "Elektrik" ? 0 : 7.0);
          const ccLabel = cc > 0 ? `${cc} cc` : "Bilinmiyor";
          const label = ft === "Elektrik" ? "Full Elektrik" : `${ccLabel} ${ft}`;
          engines.push({
            cc,
            fuelType: ft,
            trim: t.model_trim || "",
            weightKg: Math.round(weight),
            fuelConsumption: Number(cons.toFixed(1)),
            label,
          });
        }
        if (engines.length > 0) return engines.sort((a, b) => b.cc - a.cc);
      }
    }
  } catch (err) {
    console.warn("Motor seçenekleri çekilemedi:", err);
  }

  // Fallback: akıllı varsayılan seçenekler
  return buildFallbackEngines(make, model);
}

function buildFallbackEngines(make: string, model: string): EngineOption[] {
  const full = `${make} ${model}`.toLowerCase();
  
  // Elektrikli ve Hibrit Özel Durumları
  const isElectric = ["tesla", "ioniq 5", "ioniq 6", "ev6", "id.3", "id.4", "e-tron", "ariya", "leaf", "model", "taycan", "eq"].some(k => full.includes(k));
  const isHybrid   = ["prius", "yaris hybrid", "yaris cross", "jazz", "zoe", "niro hybrid", "tucson hybrid", "e:hev", "phev"].some(k => full.includes(k));

  if (isElectric) return [
    { cc: 0, fuelType: "Elektrik", trim: "", weightKg: 1950, fuelConsumption: 0, label: "Full Elektrik" },
  ];
  if (isHybrid) return [
    { cc: 1500, fuelType: "Hibrit", trim: "", weightKg: 1380, fuelConsumption: 4.8, label: "1500 cc Hibrit" },
    { cc: 1800, fuelType: "Hibrit", trim: "", weightKg: 1450, fuelConsumption: 5.2, label: "1800 cc Hibrit" },
    { cc: 2000, fuelType: "Hibrit", trim: "", weightKg: 1600, fuelConsumption: 5.5, label: "2000 cc Hibrit" },
  ];

  // Lüks / Spor / Büyük SUV
  const isLargeLuxury = ["bmw", "mercedes", "audi", "lexus", "land rover", "porsche", "volvo", "jaguar", "ferrari", "bentley", "maserati"].some(k => full.includes(k));
  // Çok Hafif / A Segmenti
  const isUltraLight = ["swift", "picanto", "i10", "aygo", "c1", "108"].some(k => full.includes(k));
  // Kompakt / Küçük
  const isSmall = ["i20", "fiesta", "corsa", "clio", "polo", "yaris", "micra", "500", "sandero", "demio"].some(k => full.includes(k));

  if (isLargeLuxury) {
    return [
      { cc: 1600, fuelType: "Benzin", trim: "", weightKg: 1550, fuelConsumption: 7.5, label: "1600 cc Benzin" },
      { cc: 2000, fuelType: "Benzin", trim: "", weightKg: 1650, fuelConsumption: 8.5, label: "2000 cc Benzin" },
      { cc: 3000, fuelType: "Benzin", trim: "", weightKg: 1850, fuelConsumption: 10.5, label: "3000 cc Benzin" },
      { cc: 2000, fuelType: "Dizel",  trim: "", weightKg: 1700, fuelConsumption: 6.5, label: "2000 cc Dizel" },
      { cc: 3000, fuelType: "Dizel",  trim: "", weightKg: 1900, fuelConsumption: 7.5, label: "3000 cc Dizel" },
      { cc: 2000, fuelType: "Hibrit", trim: "", weightKg: 1800, fuelConsumption: 5.5, label: "2000 cc Hibrit" },
    ];
  }

  if (isUltraLight) {
    return [
      { cc: 1000, fuelType: "Benzin", trim: "", weightKg: 920, fuelConsumption: 4.5, label: "1000 cc Benzin" },
      { cc: 1200, fuelType: "Benzin", trim: "", weightKg: 960, fuelConsumption: 4.8, label: "1200 cc Benzin" },
      { cc: 1200, fuelType: "Hibrit", trim: "", weightKg: 990, fuelConsumption: 4.3, label: "1200 cc Hibrit" },
    ];
  }

  if (isSmall) {
    return [
      { cc: 1000, fuelType: "Benzin", trim: "", weightKg: 1050, fuelConsumption: 5.0, label: "1000 cc Benzin" },
      { cc: 1200, fuelType: "Benzin", trim: "", weightKg: 1100, fuelConsumption: 5.5, label: "1200 cc Benzin" },
      { cc: 1400, fuelType: "Benzin", trim: "", weightKg: 1150, fuelConsumption: 6.0, label: "1400 cc Benzin" },
      { cc: 1500, fuelType: "Dizel",  trim: "", weightKg: 1200, fuelConsumption: 4.5, label: "1500 cc Dizel" },
    ];
  }

  // Standart Araçlar (Toyota Corolla, VW Golf, Ford Focus vb.)
  return [
    { cc: 1200, fuelType: "Benzin", trim: "", weightKg: 1250, fuelConsumption: 6.0, label: "1200 cc Benzin" },
    { cc: 1400, fuelType: "Benzin", trim: "", weightKg: 1300, fuelConsumption: 6.5, label: "1400 cc Benzin" },
    { cc: 1500, fuelType: "Benzin", trim: "", weightKg: 1350, fuelConsumption: 6.8, label: "1500 cc Benzin" },
    { cc: 1600, fuelType: "Benzin", trim: "", weightKg: 1350, fuelConsumption: 7.0, label: "1600 cc Benzin" },
    { cc: 2000, fuelType: "Benzin", trim: "", weightKg: 1450, fuelConsumption: 8.0, label: "2000 cc Benzin" },
    { cc: 1500, fuelType: "Dizel",  trim: "", weightKg: 1350, fuelConsumption: 5.0, label: "1500 cc Dizel" },
    { cc: 1600, fuelType: "Dizel",  trim: "", weightKg: 1400, fuelConsumption: 5.2, label: "1600 cc Dizel" },
    { cc: 2000, fuelType: "Dizel",  trim: "", weightKg: 1500, fuelConsumption: 5.8, label: "2000 cc Dizel" },
    { cc: 1800, fuelType: "Hibrit", trim: "", weightKg: 1400, fuelConsumption: 5.0, label: "1800 cc Hibrit" },
  ];
}

function normalizeFuelType(raw: string): "Benzin" | "Dizel" | "Hibrit" | "Elektrik" {
  const l = raw.toLowerCase();
  if (l.includes("electric")) return "Elektrik";
  if (l.includes("hybrid"))   return "Hibrit";
  if (l.includes("diesel"))   return "Dizel";
  return "Benzin";
}

export function buildCar(make: string, model: string, year: number, engine: EngineOption): Car {
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

function estimatePriceGBP(make: string, model: string, year: number, cc: number, fuelType: string): number {
  const full = `${make} ${model}`.toLowerCase();
  const age = new Date().getFullYear() - year;
  let base = 18000;

  if (["tesla", "porsche", "ferrari", "lamborghini", "bentley", "aston martin"].some(b => full.includes(b))) {
    base = fuelType === "Elektrik" ? 60000 : 85000;
  } else if (["bmw", "mercedes", "audi", "lexus", "land rover", "volvo"].some(b => full.includes(b))) {
    base = 40000;
  } else if (cc > 2000) {
    base = 30000;
  } else if (cc > 1600) {
    base = 23000;
  }

  if (fuelType === "Elektrik") base = Math.max(base, 32000);
  else if (fuelType === "Hibrit") base = Math.max(base, 22000);

  const depreciation = Math.pow(0.92, age);
  return Math.round(base * depreciation);
}

/** Eski API uyumluluğu */
export async function fetchVehicleSpecsOnline(make: string, model: string, year: number = new Date().getFullYear()): Promise<Car> {
  const engines = await fetchEnginesOnline(make, model, year);
  const engine = engines[0] ?? buildFallbackEngines(make, model)[0];
  return buildCar(make, model, year, engine);
}
