"use client";

import { useState } from "react";
import { Car } from "@/types";
import {
  calculateTCO,
  formatTL,
  formatGBP,
  getBaremColors,
  calculateRoadTax,
  calculateInsurance,
} from "@/utils/taxCalculator";
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

const SEGMENT_COLORS = {
  vehiclePriceTL: "#3b82f6",
  periodTax: "#f97316",
  periodFuel: "#10b981",
  periodInsurance: "#a855f7",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
  years?: number;
}

function CustomTooltip({ active, payload, label, years }: CustomTooltipProps) {
  if (!active || !payload) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-52">
      <p className="font-bold text-slate-800 text-sm mb-3">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 mb-1.5"
        >
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            {entry.name === "vehiclePriceTL"
              ? "Araç Fiyatı (TL)"
              : entry.name === "periodTax"
              ? `${years} Yıl Vergi`
              : entry.name === "periodInsurance"
              ? `${years} Yıl Sigorta`
              : `${years} Yıl Yakıt`}
          </span>
          <span className="font-semibold text-slate-800 text-xs">
            {formatTL(entry.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
        <span className="text-xs font-bold text-slate-700">Toplam TCO</span>
        <span className="text-xs font-bold text-blue-700">
          {formatTL(total)}
        </span>
      </div>
    </div>
  );
}

export function TCOChart({ cars, gbpRate, fuelPriceTL, annualKm }: TCOChartProps) {
  const [years, setYears] = useState<number>(5);

  if (cars.length === 0) return null;

  const data = cars.map((car) => {
    const tco = calculateTCO(car, gbpRate, fuelPriceTL, annualKm, years);
    const tax = calculateRoadTax(car.weightKg);
    const insurance = calculateInsurance(car.priceGBP, gbpRate, car.engineCC).totalAnnualInsurance;
    const colors = getBaremColors(tax.barem);
    
    const periodInsurance = insurance * years;
    const periodTax = tco.fiveYearTax;
    const periodFuel = tco.fiveYearFuel;
    const total = tco.vehiclePriceTL + periodTax + periodFuel + periodInsurance;

    return {
      name: `${car.brand} ${car.model}`.substring(0, 22),
      fullName: `${car.year} ${car.brand} ${car.model}`,
      gbpLabel: formatGBP(car.priceGBP),
      vehiclePriceTL: tco.vehiclePriceTL,
      periodTax: periodTax,
      periodFuel: periodFuel,
      periodInsurance: periodInsurance,
      total: total,
      baremColor: colors.fill,
    };
  });

  const maxVal = Math.max(...data.map((d) => d.total));
  const yAxisMax = Math.ceil(maxVal / 500_000) * 500_000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 mb-2">
        {[1, 3, 5].map((y) => (
          <button
            key={y}
            onClick={() => setYears(y)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              years === y
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {y} Yıllık Kırılım
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
          barSize={cars.length === 1 ? 80 : cars.length === 2 ? 90 : 70}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M ₺`
                : v >= 1_000
                ? `${(v / 1_000).toFixed(0)}K ₺`
                : String(v)
            }
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            domain={[0, yAxisMax]}
            width={65}
          />
          <Tooltip content={<CustomTooltip years={years} />} cursor={{ fill: "#f8fafc" }} />
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
            wrapperStyle={{ fontSize: 12, color: "#64748b" }}
          />
          <Bar dataKey="vehiclePriceTL" stackId="tco" fill={SEGMENT_COLORS.vehiclePriceTL} name="vehiclePriceTL" />
          <Bar dataKey="periodTax" stackId="tco" fill={SEGMENT_COLORS.periodTax} name="periodTax" />
          <Bar dataKey="periodInsurance" stackId="tco" fill={SEGMENT_COLORS.periodInsurance} name="periodInsurance" />
          <Bar dataKey="periodFuel" stackId="tco" fill={SEGMENT_COLORS.periodFuel} name="periodFuel" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div
        className={`grid gap-3 ${
          cars.length === 1
            ? "grid-cols-1"
            : cars.length === 2
            ? "grid-cols-2"
            : "grid-cols-3"
        }`}
      >
        {data.map((d) => (
          <div key={d.fullName} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
            <p className="text-xs font-semibold text-slate-500 truncate mb-1">{d.fullName}</p>
            <p className="text-xs text-blue-600 font-medium mb-2">{d.gbpLabel} sterlin</p>
            <p className="text-xl font-bold text-slate-800">{formatTL(d.total)}</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">{years} yıllık toplam (TL)</p>
            <div className="space-y-1.5">
              {[
                { label: "Araç", val: d.vehiclePriceTL, color: SEGMENT_COLORS.vehiclePriceTL },
                { label: "Vergi", val: d.periodTax, color: SEGMENT_COLORS.periodTax },
                { label: "Sigorta", val: d.periodInsurance, color: SEGMENT_COLORS.periodInsurance },
                { label: "Yakıt", val: d.periodFuel, color: SEGMENT_COLORS.periodFuel },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-500 w-12">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(val / d.total) * 100}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 w-14 text-right">
                    {((val / d.total) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
