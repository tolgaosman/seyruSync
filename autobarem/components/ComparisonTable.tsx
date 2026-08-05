"use client";

import { Car } from "@/types";
import {
  calculateRoadTax,
  formatTL,
  formatGBP,
  getBaremColors,
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
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-48">Araç</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <PoundSterling className="h-3.5 w-3.5" /> Fiyat (GBP)
              </span>
            </TableHead>
            <TableHead>TL Karşılığı</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <Scale className="h-3.5 w-3.5" /> Ağırlık
              </span>
            </TableHead>
            <TableHead>Barem</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Yıllık Vergi (TL)
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5" /> Tüketim
              </span>
            </TableHead>
            <TableHead>Yakıt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.map((car) => {
            const tax = calculateRoadTax(car.weightKg);
            const colors = getBaremColors(tax.barem);
            const priceTL = Math.round(car.priceGBP * gbpRate);
            const annualFuelCostTL =
              car.fuelType === "Elektrik"
                ? null
                : Math.round((car.avgFuelConsumption / 100) * 15_000 * fuelPriceTL);

            return (
              <TableRow key={car.id}>
                <TableCell>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-slate-400">{car.year}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-blue-700">
                  {formatGBP(car.priceGBP)}
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {formatTL(priceTL)}
                </TableCell>
                <TableCell className="text-slate-700">
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
                  <span className={`font-bold ${colors.text}`}>
                    {formatTL(tax.annualTax)}
                  </span>
                </TableCell>
                <TableCell className="text-slate-700">
                  {car.fuelType === "Elektrik" ? (
                    <span className="text-slate-400 text-xs">Elektrik</span>
                  ) : (
                    <span>
                      {car.avgFuelConsumption} L/100km
                      {annualFuelCostTL && (
                        <span className="block text-xs text-slate-400">
                          ≈ {formatTL(annualFuelCostTL)}/yıl
                        </span>
                      )}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      car.fuelType === "Elektrik"
                        ? "bg-teal-100 text-teal-700"
                        : car.fuelType === "Hibrit"
                        ? "bg-blue-100 text-blue-700"
                        : car.fuelType === "Dizel"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {car.fuelType}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
