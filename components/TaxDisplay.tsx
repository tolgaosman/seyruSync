"use client";

import { Car } from "@/types";
import {
  calculateRoadTax,
  formatTL,
  formatGBP,
  getBaremColors,
  BAREMS,
} from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, ShieldCheck, TrendingUp, X, PoundSterling, Car as CarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaxDisplayProps {
  cars: Car[];
  gbpRate: number;
  onRemove: (id: string) => void;
}

export function TaxDisplay({ cars, gbpRate, onRemove }: TaxDisplayProps) {
  if (cars.length === 0) {
    return (
      <Card className="border-dashed border-[#e5e2d8] bg-white/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-[#68706b]">
          <Scale className="h-10 w-10 mb-3 opacity-30 text-[#063b28]" />
          <p className="font-serif text-lg font-bold text-[#111814]">Henüz araç seçilmedi</p>
          <p className="text-xs mt-1 max-w-xs">
            Sol panelden veritabanı araçlarını seçin veya kendi aracınızın detaylarını girin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cars.map((car) => {
        const tax = calculateRoadTax(car.weightKg);
        const baremEntry = BAREMS[tax.barem - 1];
        const priceTL = Math.round(car.priceGBP * gbpRate);

        return (
          <Card
            key={car.id}
            className="overflow-hidden border border-[#e5e2d8] bg-[#f0eee6]/60 hover:shadow-md transition-all rounded-3xl"
          >
            {/* Header banner / car avatar */}
            <div className="relative bg-gradient-to-br from-[#063b28]/10 via-[#063b28]/5 to-transparent p-5 pb-4 border-b border-[#e5e2d8]/70">
              <div className="flex items-start justify-between">
                <div>
                  <Badge
                    variant={
                      `barem${tax.barem}` as
                        | "barem1"
                        | "barem2"
                        | "barem3"
                        | "barem4"
                    }
                    className="mb-2"
                  >
                    {tax.baremLabel} · {tax.baremRange}
                  </Badge>
                  <h3 className="font-serif text-2xl font-bold text-[#111814] tracking-tight">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-xs text-[#68706b] font-medium mt-0.5">
                    {car.year} • {car.fuelType}
                    {car.engineCC ? ` • ${car.engineCC}cc` : ""} • {car.weightKg} kg
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(car.id)}
                  className="h-8 w-8 text-[#68706b] hover:text-[#b84a32] hover:bg-[#e5e2d8]"
                  title="Kaldır"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Metrics cards grid inside */}
            <CardContent className="p-4 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Price GBP */}
                <div className="rounded-2xl p-3.5 bg-white border border-[#e5e2d8]">
                  <div className="flex items-center gap-1.5 mb-1 text-[#68706b]">
                    <PoundSterling className="h-3.5 w-3.5 text-[#063b28]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Piyasa Fiyatı
                    </span>
                  </div>
                  <p className="font-serif text-xl font-bold text-[#063b28]">
                    {formatGBP(car.priceGBP)}
                  </p>
                  <p className="text-xs text-[#68706b] mt-0.5">
                    ≈ {formatTL(priceTL)}
                  </p>
                </div>

                {/* Annual Road Tax */}
                <div className="rounded-2xl p-3.5 bg-white border border-[#e5e2d8]">
                  <div className="flex items-center gap-1.5 mb-1 text-[#68706b]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#063b28]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Yıllık Vergi
                    </span>
                  </div>
                  <p className="font-serif text-xl font-bold text-[#111814]">
                    {formatTL(tax.annualTax)}
                  </p>
                  <p className="text-xs text-[#68706b] mt-0.5">
                    {baremEntry.ratePerKg} ₺/kg + 500 ₺
                  </p>
                </div>
              </div>

              {/* Bottom detail pill bar */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/70 border border-[#e5e2d8] text-xs text-[#68706b]">
                <span className="flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5 text-[#063b28]" />
                  Ağırlık: <strong className="text-[#111814]">{car.weightKg} kg</strong>
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-[#063b28]" />
                  Barem Katsayısı: <strong className="text-[#111814]">{baremEntry.ratePerKg} ₺/kg</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
