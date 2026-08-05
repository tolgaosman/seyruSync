"use client";

import { Car } from "@/types";
import {
  calculateRoadTax,
  formatTL,
  formatGBP,
} from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fuel, Scale, PoundSterling, ShieldCheck } from "lucide-react";

interface ComparisonTableProps {
  cars: Car[];
  gbpRate: number;
  fuelPriceTL: number;
}

export function ComparisonTable({ cars, gbpRate, fuelPriceTL }: ComparisonTableProps) {
  if (cars.length === 0) return null;

  return (
    <div className="rounded-3xl border border-[#e5e2d8] overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#f0eee6]/60 border-b border-[#e5e2d8]">
            <TableHead className="w-52">Araç & Model</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <PoundSterling className="h-3.5 w-3.5 text-[#063b28]" /> Fiyat (GBP)
              </span>
            </TableHead>
            <TableHead>TL Karşılığı</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <Scale className="h-3.5 w-3.5 text-[#063b28]" /> Ağırlık
              </span>
            </TableHead>
            <TableHead>Barem</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#063b28]" /> Yıllık Vergi
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-[#063b28]" /> Tüketim
              </span>
            </TableHead>
            <TableHead>Değerlendirme</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => {
            const tax = calculateRoadTax(car.weightKg);
            const priceTL = Math.round(car.priceGBP * gbpRate);
            const annualFuelCostTL =
              car.fuelType === "Elektrik"
                ? null
                : Math.round((car.avgFuelConsumption / 100) * 15_000 * fuelPriceTL);

            // Barem rating status
            let ratingBadge = <Badge variant="optimal">Optimal</Badge>;
            if (tax.barem === 1) {
              ratingBadge = <Badge variant="optimal">En Düşük Barem</Badge>;
            } else if (tax.barem === 4) {
              ratingBadge = <Badge variant="barem4">Yüksek Barem</Badge>;
            } else if (car.fuelType === "Elektrik") {
              ratingBadge = <Badge variant="sand">Sıfır Emisyon</Badge>;
            }

            return (
              <TableRow key={car.id} className="hover:bg-[#f6f5f0]/80 transition-colors">
                <TableCell>
                  <div>
                    <p className="font-serif font-bold text-[#111814] text-base">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-[#68706b]">
                      {car.year} • {car.fuelType}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-serif font-bold text-[#063b28] text-base">
                  {formatGBP(car.priceGBP)}
                </TableCell>
                <TableCell className="text-[#68706b] text-sm">
                  {formatTL(priceTL)}
                </TableCell>
                <TableCell className="text-[#111814] font-medium">
                  {car.weightKg.toLocaleString("tr-TR")} kg
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      `barem${tax.barem}` as
                        | "barem1"
                        | "barem2"
                        | "barem3"
                        | "barem4"
                    }
                  >
                    {tax.baremLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-serif font-bold text-[#111814] text-base">
                    {formatTL(tax.annualTax)}
                  </span>
                </TableCell>
                <TableCell className="text-[#111814]">
                  {car.fuelType === "Elektrik" ? (
                    <span className="text-[#68706b] text-xs">Elektrikli</span>
                  ) : (
                    <div>
                      <span className="font-medium">{car.avgFuelConsumption} L/100km</span>
                      {annualFuelCostTL && (
                        <span className="block text-[11px] text-[#68706b]">
                          ≈ {formatTL(annualFuelCostTL)}/yıl
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>{ratingBadge}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
