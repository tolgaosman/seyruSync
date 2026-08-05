"use client";

import { Car } from "@/types";
import { cars, brands } from "@/data/cars";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateRoadTax, getBaremColors } from "@/utils/taxCalculator";

interface CarSelectorProps {
  selectedCars: Car[];
  onSelect: (car: Car | null, index: number) => void;
  maxSlots?: number;
}

export function CarSelector({
  selectedCars,
  onSelect,
  maxSlots = 3,
}: CarSelectorProps) {
  const slots = Array.from({ length: maxSlots });

  const handleSelect = (carId: string, index: number) => {
    if (carId === "__none__") {
      onSelect(null, index);
      return;
    }
    const car = cars.find((c) => c.id === carId) ?? null;
    onSelect(car, index);
  };

  return (
    <div className="space-y-4">
      {slots.map((_, idx) => {
        const selected = selectedCars[idx] ?? null;
        const tax = selected ? calculateRoadTax(selected.weightKg) : null;
        const colors = tax ? getBaremColors(tax.barem) : null;

        return (
          <div key={idx} className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Araç {idx + 1}
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={selected?.id ?? "__none__"}
                onValueChange={(val) => handleSelect(val, idx)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Araç seçin…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Seçilmedi —</SelectItem>
                  {brands.map((brand) => {
                    const brandCars = cars.filter((c) => c.brand === brand);
                    return (
                      <SelectGroup key={brand}>
                        <SelectLabel>{brand}</SelectLabel>
                        {brandCars.map((car) => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.year} {car.brand} {car.model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
              {selected && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelect(null, idx)}
                  className="text-slate-400 hover:text-red-500 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selected && tax && colors && (
              <div
                className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${colors.border} ${colors.bg} text-sm`}
              >
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
                <span className={`font-medium ${colors.text}`}>
                  {selected.weightKg} kg
                </span>
                <span className="text-slate-400">·</span>
                <span className={`font-semibold ${colors.text}`}>
                  {tax.annualTax.toLocaleString("tr-TR")} TL/yıl
                </span>
                <span className="text-slate-400 text-xs">
                  ({tax.baremRange})
                </span>
              </div>
            )}
          </div>
        );
      })}

      {selectedCars.filter(Boolean).length === 0 && (
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
          <PlusCircle className="h-3.5 w-3.5" />
          En fazla {maxSlots} araç seçip karşılaştırabilirsiniz.
        </p>
      )}
    </div>
  );
}
