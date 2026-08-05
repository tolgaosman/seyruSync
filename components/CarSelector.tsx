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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider">
                Araç Slot {idx + 1}
              </label>
              {selected && (
                <span className="text-xs text-[#063b28] font-medium">Seçildi</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selected?.id ?? "__none__"}
                onValueChange={(val) => handleSelect(val, idx)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Veritabanından araç seçin…" />
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
                            {car.year} {car.brand} {car.model} ({car.weightKg} kg)
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
                  className="text-[#68706b] hover:text-[#b84a32] shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selected && tax && colors && (
              <div
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-[#e5e2d8] bg-[#f0eee6] text-xs"
              >
                <div className="flex items-center gap-2">
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
                  <span className="font-semibold text-[#111814]">
                    {selected.weightKg} kg
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#063b28] font-serif text-sm">
                    {tax.annualTax.toLocaleString("tr-TR")} ₺
                  </span>
                  <span className="text-[#68706b] text-[11px]">/yıl</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selectedCars.filter(Boolean).length === 0 && (
        <p className="text-xs text-[#68706b] flex items-center gap-1.5 pt-1">
          <PlusCircle className="h-3.5 w-3.5 text-[#063b28]" />
          Karşılaştırmak istediğiniz araçları yukarıdaki menülerden belirleyin.
        </p>
      )}
    </div>
  );
}
