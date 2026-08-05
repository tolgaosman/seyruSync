"use client";

import { Car } from "@/types";
import { calculateRoadTax, formatTL } from "@/utils/taxCalculator";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface BaselineSummaryProps {
  cars: Car[];
}

export function BaselineSummary({ cars }: BaselineSummaryProps) {
  // En az 2 araç varsa (1 mevcut, en az 1 hedef) gösterilir.
  if (cars.length < 2) return null;

  const baselineCar = cars[0];
  const baselineTax = calculateRoadTax(baselineCar.weightKg, baselineCar.year).annualTax;

  const targetCars = cars.slice(1);

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden">
      {/* Dekoratif arka plan */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div>
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          💡 Karşılaştırma Özeti
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          <span className="font-semibold text-slate-700">Mevcut Aracınız ({baselineCar.brand}):</span> Yıllık {formatTL(baselineTax)} seyrüsefer vergisi.
        </p>
      </div>

      <div className="space-y-2">
        {targetCars.map((target, idx) => {
          const targetTax = calculateRoadTax(target.weightKg, target.year).annualTax;
          const diff = targetTax - baselineTax;
          
          let colorClass = "text-slate-600 bg-slate-50 border-slate-200";
          let Icon = Minus;
          let message = "Seyrüsefer yükünüz değişmeyecek.";

          if (diff > 0) {
            colorClass = "text-red-700 bg-red-50 border-red-200";
            Icon = TrendingUp;
            message = `Geçiş yaparsanız yıllık seyrüsefer yükünüz ${formatTL(diff)} artacak.`;
          } else if (diff < 0) {
            colorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
            Icon = TrendingDown;
            message = `Geçiş yaparsanız yıllık seyrüsefer yükünüz ${formatTL(Math.abs(diff))} azalacak.`;
          }

          return (
            <div key={target.id || idx} className={`flex items-center gap-3 p-3 rounded-lg border ${colorClass}`}>
              <div className="shrink-0 p-1.5 rounded-md bg-white shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">
                  {target.brand} {target.model} Hedefi
                </p>
                <p className="text-[11px] font-medium opacity-90 mt-0.5">
                  {message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
