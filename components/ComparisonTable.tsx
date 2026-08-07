"use client";

import { Car } from "@/types";
import {
  calculateRoadTax,
  formatTL,
  formatGBP,
  getBaremColors,
} from "@/utils/taxCalculator";
import { getFuelTypeStyle } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fuel, Scale, PoundSterling, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  cars: Car[];
  gbpRate: number;
  fuelPriceTL: number;
}

/** Bir aracın tablo/kart için türetilmiş değerleri — iki gösterim de bunu kullanır */
function deriveRow(car: Car, gbpRate: number, fuelPriceTL: number) {
  const tax = calculateRoadTax(car.weightKg);
  const colors = getBaremColors(tax.barem);
  const priceTL = Math.round(car.priceGBP * gbpRate);
  const annualFuelCostTL =
    car.fuelType === "Elektrik"
      ? null
      : Math.round((car.avgFuelConsumption / 100) * 15_000 * fuelPriceTL);

  return { tax, colors, priceTL, annualFuelCostTL };
}

function FuelChip({ fuelType }: { fuelType: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        getFuelTypeStyle(fuelType)
      )}
    >
      {fuelType}
    </span>
  );
}

export function ComparisonTable({
  cars,
  gbpRate,
  fuelPriceTL,
}: ComparisonTableProps) {
  if (cars.length === 0) return null;

  return (
    <>
      {/* ── Mobil: kart listesi ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
        {cars.map((car, idx) => (
          <MobileCard
            key={car.id}
            car={car}
            gbpRate={gbpRate}
            fuelPriceTL={fuelPriceTL}
            isBaseline={idx === 0}
          />
        ))}
      </div>

      {/* ── Masaüstü: gerçek tablo ── */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-52">Araç</TableHead>
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
                  <ShieldCheck className="h-3.5 w-3.5" /> Yıllık Vergi
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
            {cars.map((car, idx) => (
              <DesktopRow
                key={car.id}
                car={car}
                gbpRate={gbpRate}
                fuelPriceTL={fuelPriceTL}
                isBaseline={idx === 0}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function DesktopRow({
  car,
  gbpRate,
  fuelPriceTL,
  isBaseline,
}: {
  car: Car;
  gbpRate: number;
  fuelPriceTL: number;
  isBaseline: boolean;
}) {
  const { tax, colors, priceTL, annualFuelCostTL } = deriveRow(
    car,
    gbpRate,
    fuelPriceTL
  );

  return (
    <TableRow className={cn(isBaseline && "bg-accent/[0.06]")}>
      <TableCell>
        <div className="flex items-center gap-2">
          {isBaseline && (
            <Star className="h-3 w-3 shrink-0 fill-current text-accent-2" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {car.brand} {car.model}
            </p>
            <p className="tnum text-xs text-ink-3">{car.year}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="tnum font-semibold text-info">
        {formatGBP(car.priceGBP)}
      </TableCell>
      <TableCell className="tnum text-sm">{formatTL(priceTL)}</TableCell>
      <TableCell className="tnum">
        {car.weightKg.toLocaleString("tr-TR")} kg
      </TableCell>
      <TableCell>
        <Badge
          variant={
            `barem${tax.barem}` as "barem1" | "barem2" | "barem3" | "barem4"
          }
        >
          {tax.baremLabel}
        </Badge>
      </TableCell>
      <TableCell>
        <span className={cn("tnum font-bold", colors.text)}>
          {formatTL(tax.annualTax)}
        </span>
      </TableCell>
      <TableCell>
        {car.fuelType === "Elektrik" ? (
          <span className="text-xs text-ink-3">Elektrik</span>
        ) : (
          <span className="tnum">
            {car.avgFuelConsumption} L/100km
            {annualFuelCostTL && (
              <span className="block text-xs text-ink-3">
                ≈ {formatTL(annualFuelCostTL)}/yıl
              </span>
            )}
          </span>
        )}
      </TableCell>
      <TableCell>
        <FuelChip fuelType={car.fuelType} />
      </TableCell>
    </TableRow>
  );
}

function MobileCard({
  car,
  gbpRate,
  fuelPriceTL,
  isBaseline,
}: {
  car: Car;
  gbpRate: number;
  fuelPriceTL: number;
  isBaseline: boolean;
}) {
  const { tax, colors, priceTL, annualFuelCostTL } = deriveRow(
    car,
    gbpRate,
    fuelPriceTL
  );

  const rows: Array<{ label: string; value: string; className?: string }> = [
    {
      label: "Fiyat (GBP)",
      value: formatGBP(car.priceGBP),
      className: "text-info",
    },
    { label: "TL Karşılığı", value: formatTL(priceTL) },
    {
      label: "Ağırlık",
      value: `${car.weightKg.toLocaleString("tr-TR")} kg`,
    },
    {
      label: "Yıllık Vergi",
      value: formatTL(tax.annualTax),
      className: colors.text,
    },
    {
      label: "Tüketim",
      value:
        car.fuelType === "Elektrik"
          ? "—"
          : `${car.avgFuelConsumption} L/100km${
              annualFuelCostTL ? ` · ≈ ${formatTL(annualFuelCostTL)}/yıl` : ""
            }`,
    },
  ];

  return (
    <Card className={cn(isBaseline && "ring-1 ring-accent/40")}>
      <div className="flex items-start justify-between gap-2 border-b border-line p-4">
        <div className="flex min-w-0 items-center gap-2">
          {isBaseline && (
            <Star className="h-3 w-3 shrink-0 fill-current text-accent-2" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {car.brand} {car.model}
            </p>
            <p className="tnum text-xs text-ink-3">{car.year}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge
            variant={
              `barem${tax.barem}` as "barem1" | "barem2" | "barem3" | "barem4"
            }
          >
            {tax.baremLabel}
          </Badge>
          <FuelChip fuelType={car.fuelType} />
        </div>
      </div>

      <dl className="divide-y divide-line">
        {rows.map(({ label, value, className }) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <dt className="text-xs text-ink-3">{label}</dt>
            <dd
              className={cn(
                "tnum text-right text-sm font-semibold text-ink",
                className
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
