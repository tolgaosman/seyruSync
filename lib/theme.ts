/**
 * Renk sisteminin tek kaynağı.
 *
 * Barem renkleri daha önce üç ayrı yerde tekrarlanıyordu
 * (utils/taxCalculator.ts, components/ui/badge.tsx, components/TCOChart.tsx)
 * ve birbirinden bağımsız kayıyordu. Hepsi artık buradan okur.
 *
 * Bu dosya hiçbir şey import etmez — taxCalculator saf kalsın diye.
 */

export type BaremLevel = 1 | 2 | 3 | 4;
export type ThemeName = "light" | "dark";

export interface BaremPaletteEntry {
  /** Recharts gibi ham hex isteyen yerler için */
  fill: string;
  /** Rozet: yarı saydam zemin + renkli metin + ince kenarlık */
  badge: string;
  /** Kenarlık rengi */
  border: string;
  /** Metin rengi */
  text: string;
  /** Yarı saydam zemin */
  bg: string;
  /** Yumuşak ışıma gölgesi */
  glow: string;
}

export const BAREM_PALETTE: Record<BaremLevel, BaremPaletteEntry> = {
  1: {
    fill: "#79b394",
    badge: "bg-barem1/14 text-barem1 border-barem1/28",
    border: "border-barem1/30",
    text: "text-barem1",
    bg: "bg-barem1/8",
    glow: "shadow-[0_0_32px_-16px_#79b394]",
  },
  2: {
    fill: "#d3b075",
    badge: "bg-barem2/14 text-barem2 border-barem2/28",
    border: "border-barem2/30",
    text: "text-barem2",
    bg: "bg-barem2/8",
    glow: "shadow-[0_0_32px_-16px_#d3b075]",
  },
  3: {
    fill: "#cc9573",
    badge: "bg-barem3/14 text-barem3 border-barem3/28",
    border: "border-barem3/30",
    text: "text-barem3",
    bg: "bg-barem3/8",
    glow: "shadow-[0_0_32px_-16px_#cc9573]",
  },
  4: {
    fill: "#cc8585",
    badge: "bg-barem4/14 text-barem4 border-barem4/28",
    border: "border-barem4/30",
    text: "text-barem4",
    bg: "bg-barem4/8",
    glow: "shadow-[0_0_32px_-16px_#cc8585]",
  },
};

/**
 * Barem renklerinin ham hex karşılıkları.
 * `BAREM_PALETTE[n].fill` koyu temanın değeridir; aydınlıkta beyaz zemin
 * üstünde okunması için biraz daha derin tonlar kullanılır.
 * (Tailwind sınıfları temayı CSS değişkeniyle zaten kendisi çeviriyor —
 * bu tablo yalnızca hex isteyen yerler için: Recharts, inline style.)
 */
export const BAREM_HEX: Record<ThemeName, Record<BaremLevel, string>> = {
  dark: {
    1: "#79b394",
    2: "#d3b075",
    3: "#cc9573",
    4: "#cc8585",
  },
  light: {
    1: "#4f9b78",
    2: "#b5893c",
    3: "#b3714c",
    4: "#bb6a6a",
  },
};

/**
 * TCO grafiğindeki yığın segmentleri — pastel ama birbirinden ayrışan tonlar.
 * Yığın sırası araç → vergi → sigorta → yakıt; sıra değişirse renkler
 * yeniden gözden geçirilmeli (komşu segmentler benzer tona düşmesin).
 */
export const TCO_SEGMENT_COLORS_BY_THEME = {
  dark: {
    vehiclePriceTL: "#7ba4c8",
    periodTax: "#d3b075",
    periodInsurance: "#9b91c4",
    periodFuel: "#79b394",
  },
  light: {
    vehiclePriceTL: "#5f8fbb",
    periodTax: "#b5893c",
    periodInsurance: "#7d72ab",
    periodFuel: "#4f9b78",
  },
} as const;

/** Geriye dönük uyumluluk — koyu tema seti */
export const TCO_SEGMENT_COLORS = TCO_SEGMENT_COLORS_BY_THEME.dark;

/** Grafik kromu (eksen, ızgara, imleç, yığın ayırıcı) tema başına */
export const CHART_CHROME: Record<
  ThemeName,
  { surface: string; axis: string; grid: string; cursor: string }
> = {
  dark: {
    surface: "#1d222d",
    axis: "#6f7889",
    grid: "rgba(255,255,255,0.06)",
    cursor: "rgba(255,255,255,0.04)",
  },
  light: {
    surface: "#ffffff",
    axis: "#858e9e",
    grid: "rgba(38,46,70,0.09)",
    cursor: "rgba(38,46,70,0.045)",
  },
};

export const TCO_SEGMENT_LABELS = {
  vehiclePriceTL: "Araç Fiyatı",
  periodTax: "Seyrüsefer",
  periodInsurance: "Sigorta",
  periodFuel: "Yakıt",
} as const;

/** Yakıt türü çipleri */
export const FUEL_TYPE_STYLE: Record<string, string> = {
  Elektrik: "bg-fuel-electric/12 text-fuel-electric border-fuel-electric/30",
  Hibrit: "bg-fuel-hybrid/12 text-fuel-hybrid border-fuel-hybrid/30",
  Dizel: "bg-fuel-diesel/12 text-fuel-diesel border-fuel-diesel/30",
  Benzin: "bg-fuel-petrol/12 text-fuel-petrol border-fuel-petrol/30",
};

export function getFuelTypeStyle(fuelType: string): string {
  return FUEL_TYPE_STYLE[fuelType] ?? FUEL_TYPE_STYLE.Benzin;
}
