"use client";

import { Car } from "@/types";
import {
  calculateRoadTax,
  calculateInsurance,
  formatTL,
  formatGBP,
  getBaremColors,
  BAREMS,
} from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, ShieldCheck, X, PoundSterling } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaxDisplayProps {
  cars: Car[];
  gbpRate: number;
  onRemove: (id: string) => void;
}

export function TaxDisplay({ cars, gbpRate, onRemove }: TaxDisplayProps) {
  if (cars.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <Scale className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium text-slate-500">Henüz araç seçilmedi</p>
          <p className="text-sm mt-1">
            Sol panelden araç seçin veya özel araç bilgisi girin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {cars.map((car) => {
        const tax = calculateRoadTax(car.weightKg);
        const colors = getBaremColors(tax.barem);
        const baremEntry = BAREMS[tax.barem - 1];
        const priceTL = Math.round(car.priceGBP * gbpRate);

        return (
          <Card
            key={car.id}
            className={`border-l-4 ${colors.border} overflow-hidden`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800">
                    {car.year} {car.brand} {car.model}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {car.fuelType}
                    {car.engineCC ? ` · ${car.engineCC}cc` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      `barem${tax.barem}` as
                        | "barem1"
                        | "barem2"
                        | "barem3"
                        | "barem4"
                    }
                    className="text-sm px-3 py-1"
                  >
                    {tax.baremLabel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(car.id)}
                    className="h-7 w-7 text-slate-300 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Price GBP */}
                <div className="rounded-lg p-3 bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-1 mb-1">
                    <PoundSterling className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-500">
                      Fiyat (£)
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    {formatGBP(car.priceGBP)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ≈ {formatTL(priceTL)}
                  </p>
                </div>

                {/* Weight */}
                <div
                  className={`rounded-lg p-3 ${colors.bg} border ${colors.border}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Scale className={`h-3.5 w-3.5 ${colors.text}`} />
                    <span className="text-xs font-semibold text-slate-500">
                      Ağırlık
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${colors.text}`}>
                    {car.weightKg.toLocaleString("tr-TR")}
                    <span className="text-sm font-normal ml-1">kg</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tax.baremRange}
                  </p>
                </div>

                {/* Annual Tax (TL) */}
                <div
                  className={`rounded-lg p-3 ${colors.bg} border ${colors.border}`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <ShieldCheck className={`h-3.5 w-3.5 ${colors.text}`} />
                    <span className="text-xs font-semibold text-slate-500">
                      Yıllık Vergi
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${colors.text}`}>
                    {tax.annualTax.toLocaleString("tr-TR")}
                    <span className="text-sm font-normal ml-1">TL</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {baremEntry.ratePerKg} TL/kg + 500 TL
                  </p>
                </div>

                {/* Estimated Annual Insurance */}
                <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-1 mb-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-500">
                      Tahm. Yıllık Sigorta
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">
                    {calculateInsurance(car.priceGBP, gbpRate, car.engineCC).totalAnnualInsurance.toLocaleString("tr-TR")}
                    <span className="text-sm font-normal ml-1">TL</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trafik ({calculateInsurance(car.priceGBP, gbpRate, car.engineCC).trafficInsurance.toLocaleString("tr-TR")} ₺) + Kasko (~%{1.5})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
