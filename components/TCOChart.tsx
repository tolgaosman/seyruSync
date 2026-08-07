"use client";

import { useState } from "react";
import { Car } from "@/types";
import {
  calculateTCO,
  formatTL,
  formatGBP,
  calculateRoadTax,
  calculateInsurance,
} from "@/utils/taxCalculator";
import {
  TCO_SEGMENT_COLORS_BY_THEME,
  CHART_CHROME,
  BAREM_HEX,
  type BaremLevel,
  type ThemeName,
} from "@/lib/theme";
import { useCountUp } from "@/hooks/useCountUp";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TCOChartProps {
  cars: Car[];
  gbpRate: number;
  fuelPriceTL: number;
  annualKm: number;
}

/**
 * Recharts renkleri CSS değişkeni kabul etmiyor (SVG sunum attribute'unda
 * `var()` çözülmüyor), bu yüzden ham hex'ler temaya göre seçiliyor.
 *
 * Yığın sırası: araç → vergi → sigorta → yakıt.
 * `<Bar>` sırası değiştirilirse renkler de gözden geçirilmeli — komşu
 * segmentler benzer tona düşmemeli.
 */

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
  years?: number;
}

function segmentLabel(name: string, years?: number): string {
  if (name === "vehiclePriceTL") return "Araç Fiyatı (TL)";
  if (name === "periodTax") return `${years} Yıl Vergi`;
  if (name === "periodInsurance") return `${years} Yıl Sigorta`;
  return `${years} Yıl Yakıt`;
}

function CustomTooltip({ active, payload, label, years }: CustomTooltipProps) {
  if (!active || !payload) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="glass min-w-56 rounded-xl p-3.5">
      <p className="mb-3 text-sm font-bold text-ink">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="mb-1.5 flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-2 text-xs text-ink-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.fill }}
            />
            {segmentLabel(entry.name, years)}
          </span>
          <span className="tnum text-xs font-semibold text-ink">
            {formatTL(entry.value)}
          </span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t border-line pt-2">
        <span className="text-xs font-bold text-ink-2">Toplam TCO</span>
        <span className="tnum text-xs font-bold text-accent-2">
          {formatTL(total)}
        </span>
      </div>
    </div>
  );
}

export function TCOChart({
  cars,
  gbpRate,
  fuelPriceTL,
  annualKm,
}: TCOChartProps) {
  const [years, setYears] = useState<number>(5);
  const { theme } = useTheme();

  const SEGMENT_COLORS = TCO_SEGMENT_COLORS_BY_THEME[theme];
  const chrome = CHART_CHROME[theme];

  if (cars.length === 0) return null;

  const data = cars.map((car) => {
    const tco = calculateTCO(car, gbpRate, fuelPriceTL, annualKm, years);
    const tax = calculateRoadTax(car.weightKg);
    const insurance = calculateInsurance(
      car.priceGBP,
      gbpRate,
      car.engineCC
    ).totalAnnualInsurance;
    const periodInsurance = insurance * years;
    const periodTax = tco.fiveYearTax;
    const periodFuel = tco.fiveYearFuel;
    const total =
      tco.vehiclePriceTL + periodTax + periodFuel + periodInsurance;

    return {
      name: `${car.brand} ${car.model}`.substring(0, 22),
      fullName: `${car.year} ${car.brand} ${car.model}`,
      gbpLabel: formatGBP(car.priceGBP),
      vehiclePriceTL: tco.vehiclePriceTL,
      periodTax: periodTax,
      periodFuel: periodFuel,
      periodInsurance: periodInsurance,
      total: total,
      baremColor: BAREM_HEX[theme][tax.barem as BaremLevel],
      baremLabel: tax.baremLabel,
    };
  });

  const maxVal = Math.max(...data.map((d) => d.total));
  const yAxisMax = Math.ceil(maxVal / 500_000) * 500_000;

  return (
    <div className="space-y-5">
      {/* ── Yıl seçici ── */}
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="TCO hesap süresi"
          className="inline-flex rounded-full border border-line bg-fill p-1"
        >
          {[1, 3, 5].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYears(y)}
              aria-pressed={years === y}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
                years === y
                  ? "bg-accent/80 text-white"
                  : "text-ink-3 hover:text-ink"
              )}
            >
              {y} Yıllık
            </button>
          ))}
        </div>
      </div>

      {/* ── Grafik ── */}
      <div className="h-[280px] sm:h-[340px] lg:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 12, left: 4, bottom: 5 }}
            barSize={cars.length === 1 ? 80 : cars.length === 2 ? 90 : 70}
          >
            <defs>
              {Object.entries(SEGMENT_COLORS).map(([key, color]) => (
                <linearGradient
                  key={key}
                  id={`tco-grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  {/* Mat: hafif bir derinlik, belirgin parlama yok */}
                  <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.78} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke={chrome.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: chrome.axis }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M ₺`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K ₺`
                  : String(v)
              }
              tick={{ fontSize: 11, fill: chrome.axis }}
              axisLine={false}
              tickLine={false}
              domain={[0, yAxisMax]}
              width={62}
            />
            <Tooltip
              content={<CustomTooltip years={years} />}
              cursor={{ fill: chrome.cursor }}
            />
            <Legend
              formatter={(value) =>
                value === "vehiclePriceTL"
                  ? "Araç Fiyatı"
                  : value === "periodTax"
                  ? "Seyrüsefer"
                  : value === "periodInsurance"
                  ? "Sigorta"
                  : "Yakıt"
              }
              wrapperStyle={{ fontSize: 12, color: chrome.axis, paddingTop: 12 }}
            />
            <Bar
              dataKey="vehiclePriceTL"
              stackId="tco"
              fill="url(#tco-grad-vehiclePriceTL)"
              name="vehiclePriceTL"
              stroke={chrome.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="periodTax"
              stackId="tco"
              fill="url(#tco-grad-periodTax)"
              name="periodTax"
              stroke={chrome.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="periodInsurance"
              stackId="tco"
              fill="url(#tco-grad-periodInsurance)"
              name="periodInsurance"
              stroke={chrome.surface}
              strokeWidth={2}
            />
            <Bar
              dataKey="periodFuel"
              stackId="tco"
              fill="url(#tco-grad-periodFuel)"
              name="periodFuel"
              stroke={chrome.surface}
              strokeWidth={2}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Araç bazlı kırılım ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d, idx) => (
          <BreakdownCard
            key={d.fullName}
            data={d}
            years={years}
            index={idx}
            segmentColors={SEGMENT_COLORS}
          />
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({
  data: d,
  years,
  index,
  segmentColors,
}: {
  data: {
    fullName: string;
    gbpLabel: string;
    vehiclePriceTL: number;
    periodTax: number;
    periodFuel: number;
    periodInsurance: number;
    total: number;
    baremColor: string;
    baremLabel: string;
  };
  years: number;
  index: number;
  segmentColors: (typeof TCO_SEGMENT_COLORS_BY_THEME)[ThemeName];
}) {
  const animatedTotal = useCountUp(d.total);

  const segments = [
    { label: "Araç", val: d.vehiclePriceTL, color: segmentColors.vehiclePriceTL },
    { label: "Vergi", val: d.periodTax, color: segmentColors.periodTax },
    { label: "Sigorta", val: d.periodInsurance, color: segmentColors.periodInsurance },
    { label: "Yakıt", val: d.periodFuel, color: segmentColors.periodFuel },
  ];

  return (
    <div
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-line bg-fill p-4"
      style={{ "--d": `${index * 70}ms` } as React.CSSProperties}
    >
      {/* Barem rayı — rengin yanında etiketi de var, tek başına renge güvenilmiyor */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ backgroundColor: d.baremColor }}
      />

      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="truncate text-xs font-semibold text-ink-2">
          {d.fullName}
        </p>
        <span
          className="tnum shrink-0 text-[10px] font-bold"
          style={{ color: d.baremColor }}
        >
          {d.baremLabel}
        </span>
      </div>

      <p className="tnum text-xs font-medium text-info">
        {d.gbpLabel} sterlin
      </p>

      <p className="tnum mt-2 text-2xl font-bold tracking-tight text-ink">
        {formatTL(animatedTotal)}
      </p>
      <p className="mb-3 mt-0.5 text-[11px] text-ink-3">
        {years} yıllık toplam (TL)
      </p>

      <div className="space-y-2">
        {segments.map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="w-12 shrink-0 text-[11px] text-ink-3">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill-2">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${(val / d.total) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className="tnum w-10 shrink-0 text-right text-[11px] font-medium text-ink-2">
              {((val / d.total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
