"use client";

import { Car } from "@/types";
import { calculateRoadTax, formatTL } from "@/utils/taxCalculator";
import { TrendingDown, TrendingUp, Minus, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BaselineSummaryProps {
  cars: Car[];
}

export function BaselineSummary({ cars }: BaselineSummaryProps) {
  // En az 2 araç varsa (1 mevcut, en az 1 hedef) gösterilir.
  if (cars.length < 2) return null;

  const baselineCar = cars[0];
  const baselineTax = calculateRoadTax(
    baselineCar.weightKg,
    baselineCar.year
  ).annualTax;

  const targetCars = cars.slice(1);

  return (
    <Card className="animate-fade-up relative overflow-hidden p-5">
      {/* Dekoratif ışıma */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <Lightbulb className="h-4 w-4 text-warn" />
          Karşılaştırma Özeti
        </h3>
        <p className="mt-1.5 text-xs text-ink-3">
          <span className="font-semibold text-ink-2">
            Mevcut Aracınız ({baselineCar.brand}):
          </span>{" "}
          Yıllık <span className="tnum">{formatTL(baselineTax)}</span> seyrüsefer
          vergisi.
        </p>
      </div>

      <div className="relative mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {targetCars.map((target, idx) => {
          const targetTax = calculateRoadTax(
            target.weightKg,
            target.year
          ).annualTax;
          const diff = targetTax - baselineTax;

          let tone = "text-ink-2 bg-fill border-line";
          let Icon = Minus;
          let message = "Seyrüsefer yükünüz değişmeyecek.";
          let amount: string | null = null;

          if (diff > 0) {
            tone = "text-danger bg-danger/10 border-danger/25";
            Icon = TrendingUp;
            message = "Geçiş yaparsanız yıllık seyrüsefer yükünüz artacak.";
            amount = `+${formatTL(diff)}`;
          } else if (diff < 0) {
            tone = "text-success bg-success/10 border-success/25";
            Icon = TrendingDown;
            message = "Geçiş yaparsanız yıllık seyrüsefer yükünüz azalacak.";
            amount = `−${formatTL(Math.abs(diff))}`;
          }

          return (
            <div
              key={target.id || idx}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5",
                tone
              )}
            >
              <div className="shrink-0 rounded-lg border border-current/20 bg-current/10 p-2">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {target.brand} {target.model}
                </p>
                <p className="mt-0.5 text-[11px] opacity-80">{message}</p>
              </div>
              {amount && (
                <span className="tnum shrink-0 text-base font-bold">
                  {amount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
