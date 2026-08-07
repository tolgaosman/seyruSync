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
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Scale,
  ShieldCheck,
  X,
  PoundSterling,
  Sparkles,
  Zap,
  Leaf,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaxDisplayProps {
  cars: Car[];
  gbpRate: number;
  onRemove: (id: string) => void;
}

export function TaxDisplay({ cars, gbpRate, onRemove }: TaxDisplayProps) {
  if (cars.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {cars.map((car, idx) => (
        <TaxCard
          key={car.id}
          car={car}
          gbpRate={gbpRate}
          onRemove={onRemove}
          index={idx}
        />
      ))}
    </div>
  );
}

function TaxCard({
  car,
  gbpRate,
  onRemove,
  index,
}: {
  car: Car;
  gbpRate: number;
  onRemove: (id: string) => void;
  index: number;
}) {
  const tax = calculateRoadTax(car.weightKg);
  const colors = getBaremColors(tax.barem);
  const baremEntry = BAREMS[tax.barem - 1];
  const priceTL = Math.round(car.priceGBP * gbpRate);
  const insurance = calculateInsurance(car.priceGBP, gbpRate, car.engineCC);

  // Animasyonlu sayaçlar (sadece görüntü — hesaplanan değer değişmez)
  const animatedTax = useCountUp(tax.annualTax);
  const animatedInsurance = useCountUp(insurance.totalAnnualInsurance);

  const isBaseline = index === 0;

  return (
    <Card
      className="animate-fade-up relative flex flex-col"
      style={{ "--d": `${index * 70}ms` } as React.CSSProperties}
    >
      {/* Barem renginde üst şerit */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${colors.fill}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-2 p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5">
            {isBaseline && (
              <Star className="h-3 w-3 shrink-0 fill-current text-accent-2" />
            )}
            <h3 className="truncate text-base font-bold text-ink">
              {car.year} {car.brand} {car.model}
            </h3>
          </div>
          <p className="text-xs text-ink-3">
            {car.fuelType}
            {car.engineCC ? ` · ${car.engineCC} cc` : ""}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {tax.ageDiscountApplied && (
              <Chip icon={<Sparkles className="h-3 w-3" />} tone="success">
                %{tax.ageDiscountPct} Yaş İndirimi
              </Chip>
            )}
            {car.fuelType === "Elektrik" && (
              <Chip icon={<Zap className="h-3 w-3" />} tone="info">
                Genişletilmiş Barem
              </Chip>
            )}
            {car.fuelType?.toLowerCase().includes("hibrit") && (
              <Chip icon={<Leaf className="h-3 w-3" />} tone="hybrid">
                Düşük Tüketim Avantajı
              </Chip>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            variant={
              `barem${tax.barem}` as "barem1" | "barem2" | "barem3" | "barem4"
            }
          >
            {tax.baremLabel}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(car.id)}
            aria-label={`${car.brand} ${car.model} aracını kaldır`}
            className="h-7 w-7 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ana rakam — vergi, barem renginde */}
      <div className="px-4 pb-4 sm:px-5">
        <div
          className={cn(
            "rounded-xl border p-4",
            colors.bg,
            colors.border
          )}
        >
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-3">
            <ShieldCheck className={cn("h-3.5 w-3.5", colors.text)} />
            Yıllık Seyrüsefer Vergisi
          </span>
          <p
            className={cn(
              "tnum mt-1 text-3xl font-bold tracking-tight",
              colors.text
            )}
          >
            {formatTL(animatedTax)}
          </p>
          <p className="tnum mt-1 text-[11px] text-ink-3">
            {baremEntry.ratePerKg} TL/kg × {car.weightKg.toLocaleString("tr-TR")} kg
            + 500 TL
          </p>
        </div>
      </div>

      {/* Yardımcı istatistikler — hepsi aynı nötr desende, renk taşımaz */}
      <div className="mt-auto grid grid-cols-3 gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
        <Stat
          icon={<PoundSterling className="h-3.5 w-3.5" />}
          label="Fiyat"
          value={formatGBP(car.priceGBP)}
          hint={`≈ ${formatTL(priceTL)}`}
        />
        <Stat
          icon={<Scale className="h-3.5 w-3.5" />}
          label="Ağırlık"
          value={car.weightKg.toLocaleString("tr-TR")}
          unit="kg"
          hint={tax.baremRange}
        />
        <Stat
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Sigorta"
          value={formatTL(animatedInsurance)}
          hint={`Trafik ${insurance.trafficInsurance.toLocaleString("tr-TR")} ₺ + Kasko ~%1,5`}
        />
      </div>
    </Card>
  );
}

function Chip({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "success" | "info" | "hybrid";
  children: React.ReactNode;
}) {
  const tones = {
    success: "bg-success/12 text-success border-success/30",
    info: "bg-info/12 text-info border-info/30",
    hybrid: "bg-fuel-hybrid/12 text-fuel-hybrid border-fuel-hybrid/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
        tones[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
}
