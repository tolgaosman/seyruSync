"use client";

import { Car } from "@/types";
import {
  calculateTCO,
  formatTL,
  formatGBP,
  calculateRoadTax,
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
import { Sparkles } from "lucide-react";

interface TCOChartProps {
  cars: Car[];
  gbpRate: number;
  fuelPriceTL: number;
  annualKm: number;
}

const SEGMENT_COLORS = {
  vehiclePriceTL: "#063b28", // Forest Green
  fiveYearTax: "#b84a32",    // Terracotta
  fiveYearFuel: "#8ca797",   // Sage Green
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div className="bg-white border border-[#e5e2d8] rounded-2xl shadow-xl p-4 min-w-56">
      <p className="font-serif font-bold text-[#111814] text-base mb-3">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 mb-2"
        >
          <span className="flex items-center gap-2 text-xs text-[#68706b]">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.fill }}
            />
            {entry.name === "vehiclePriceTL"
              ? "Araç Fiyatı (TL)"
              : entry.name === "fiveYearTax"
              ? "5 Yıl Seyrüsefer Vergisi"
              : "5 Yıl Yakıt Gideri"}
          </span>
          <span className="font-semibold text-[#111814] text-xs">
            {formatTL(entry.value)}
          </span>
        </div>
      ))}
      <div className="border-t border-[#e5e2d8] mt-3 pt-2.5 flex justify-between items-center">
        <span className="text-xs font-bold text-[#68706b]">Toplam 5 Yıllık TCO</span>
        <span className="font-serif font-bold text-[#063b28] text-base">
          {formatTL(total)}
        </span>
      </div>
    </div>
  );
}

export function TCOChart({ cars, gbpRate, fuelPriceTL, annualKm }: TCOChartProps) {
  if (cars.length === 0) return null;

  const data = cars.map((car) => {
    const tco = calculateTCO(car, gbpRate, fuelPriceTL, annualKm, 5);
    const tax = calculateRoadTax(car.weightKg);
    return {
      name: `${car.brand} ${car.model}`.substring(0, 22),
      fullName: `${car.year} ${car.brand} ${car.model}`,
      gbpLabel: formatGBP(car.priceGBP),
      vehiclePriceTL: tco.vehiclePriceTL,
      fiveYearTax: tco.fiveYearTax,
      fiveYearFuel: tco.fiveYearFuel,
      total: tco.total,
    };
  });

  // Find lowest TCO car for insight tag
  const lowestTCOCar = [...data].sort((a, b) => a.total - b.total)[0];

  const maxVal = Math.max(...data.map((d) => d.total));
  const yAxisMax = Math.ceil(maxVal / 500_000) * 500_000;

  return (
    <div className="space-y-6">
      {/* Top Insight Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#f0eee6] border border-[#e5e2d8]">
        <div>
          <h4 className="font-serif font-bold text-[#063b28] text-lg">
            5 Yıllık TCO Projeksiyon Analizi
          </h4>
          <p className="text-xs text-[#68706b] mt-0.5">
            {annualKm.toLocaleString("tr-TR")} km/yıl ve {fuelPriceTL} TL/L yakıt fiyatı baz alınmıştır.
          </p>
        </div>
        {lowestTCOCar && (
          <div className="flex items-center gap-2 bg-white/90 border border-[#e5e2d8] px-3.5 py-2 rounded-xl text-xs shrink-0">
            <Sparkles className="h-4 w-4 text-[#063b28]" />
            <span>
              En Uygun TCO: <strong className="text-[#063b28] font-bold">{lowestTCOCar.name}</strong>
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
          barSize={cars.length === 1 ? 80 : cars.length === 2 ? 90 : 70}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e2d8"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#111814", fontFamily: "Playfair Display", fontWeight: 700 }}
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
            tick={{ fontSize: 11, fill: "#68706b" }}
            axisLine={false}
            tickLine={false}
            domain={[0, yAxisMax]}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0eee6" }} />
          <Legend
            formatter={(value) =>
              value === "vehiclePriceTL"
                ? "Araç Fiyatı (TL)"
                : value === "fiveYearTax"
                ? "5 Yıl Seyrüsefer Vergisi"
                : "5 Yıl Yakıt Gideri"
            }
            wrapperStyle={{ fontSize: 12, color: "#68706b", paddingTop: "12px" }}
          />
          <Bar
            dataKey="vehiclePriceTL"
            stackId="tco"
            fill={SEGMENT_COLORS.vehiclePriceTL}
            name="vehiclePriceTL"
          />
          <Bar
            dataKey="fiveYearTax"
            stackId="tco"
            fill={SEGMENT_COLORS.fiveYearTax}
            name="fiveYearTax"
          />
          <Bar
            dataKey="fiveYearFuel"
            stackId="tco"
            fill={SEGMENT_COLORS.fiveYearFuel}
            radius={[8, 8, 0, 0]}
            name="fiveYearFuel"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* TCO Breakdown Cards */}
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
          <div
            key={d.fullName}
            className="rounded-2xl border border-[#e5e2d8] bg-[#f0eee6]/50 p-4 space-y-2"
          >
            <p className="font-serif font-bold text-[#111814] text-base truncate">
              {d.fullName}
            </p>
            <p className="text-xs text-[#063b28] font-semibold">
              {d.gbpLabel} sterlin
            </p>
            <p className="font-serif text-2xl font-bold text-[#111814]">
              {formatTL(d.total)}
            </p>
            <p className="text-[11px] text-[#68706b]">
              5 yıllık toplam maliyet
            </p>
            <div className="space-y-2 pt-1">
              {[
                {
                  label: "Araç Fiyatı",
                  val: d.vehiclePriceTL,
                  color: SEGMENT_COLORS.vehiclePriceTL,
                },
                {
                  label: "Vergi",
                  val: d.fiveYearTax,
                  color: SEGMENT_COLORS.fiveYearTax,
                },
                {
                  label: "Yakıt",
                  val: d.fiveYearFuel,
                  color: SEGMENT_COLORS.fiveYearFuel,
                },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-[#68706b] w-16">{label}</span>
                  <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-[#e5e2d8]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(val / d.total) * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#111814] w-12 text-right">
                    %{((val / d.total) * 100).toFixed(0)}
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
