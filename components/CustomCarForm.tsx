"use client";

import { useState } from "react";
import { Car, CustomCarInput } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  calculateRoadTax,
  calculateTCO,
  formatTL,
  formatGBP,
  getBaremColors,
  DEFAULT_FUEL_PRICE_TL,
  DEFAULT_ANNUAL_KM,
} from "@/utils/taxCalculator";
import { Calculator, Fuel, Scale, PoundSterling, Plus } from "lucide-react";

interface CustomCarFormProps {
  gbpRate: number;
  onAddToComparison: (car: Car) => void;
  canAdd: boolean;
}

const defaultForm: CustomCarInput = {
  name: "",
  weightKg: 1200,
  priceGBP: 20_000,
  avgFuelConsumption: 6.0,
  fuelType: "Benzin",
};

export function CustomCarForm({ gbpRate, onAddToComparison, canAdd }: CustomCarFormProps) {
  const [form, setForm] = useState<CustomCarInput>(defaultForm);

  const weightNum = Number(form.weightKg) || 0;
  const priceGBP = Number(form.priceGBP) || 0;
  const priceTL = Math.round(priceGBP * gbpRate);

  const tax = weightNum > 0 ? calculateRoadTax(weightNum) : null;
  const colors = tax ? getBaremColors(tax.barem) : null;

  const tco =
    tax && priceGBP > 0
      ? calculateTCO(
          {
            priceGBP,
            weightKg: weightNum,
            avgFuelConsumption: form.avgFuelConsumption,
            fuelType: form.fuelType,
          },
          gbpRate,
          DEFAULT_FUEL_PRICE_TL,
          DEFAULT_ANNUAL_KM,
          5
        )
      : null;

  const handleAdd = () => {
    if (!form.name.trim() || weightNum <= 0 || priceGBP <= 0) return;
    const customCar: Car = {
      id: `custom-${Date.now()}`,
      brand: "Özel",
      model: form.name,
      year: new Date().getFullYear(),
      weightKg: weightNum,
      priceGBP,
      avgFuelConsumption: form.avgFuelConsumption,
      fuelType: form.fuelType,
    };
    onAddToComparison(customCar);
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider">
          Araç Adı & Model
        </label>
        <Input
          placeholder="örn. 2024 Tesla Model 3"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      {/* Weight */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider flex items-center gap-1">
          <Scale className="h-3.5 w-3.5 text-[#063b28]" /> Boş Ağırlık (kg)
        </label>
        <Input
          type="number"
          min={100}
          max={5000}
          placeholder="örn. 1350"
          value={form.weightKg}
          onChange={(e) =>
            setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))
          }
        />
        {tax && colors && (
          <div
            className="flex items-center justify-between p-3 rounded-xl border border-[#e5e2d8] bg-[#f0eee6] text-xs mt-1"
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
            <span className="font-serif font-bold text-[#063b28] text-sm">
              {tax.annualTax.toLocaleString("tr-TR")} ₺/yıl
            </span>
          </div>
        )}
      </div>

      {/* Price GBP */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider flex items-center gap-1">
          <PoundSterling className="h-3.5 w-3.5 text-[#063b28]" /> Fiyat (£ Sterlin)
        </label>
        <Input
          type="number"
          min={0}
          placeholder="örn. 25000"
          value={form.priceGBP}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceGBP: Number(e.target.value) }))
          }
        />
        {priceGBP > 0 && (
          <p className="text-xs text-[#68706b] mt-1">
            ≈ <span className="font-semibold text-[#111814]">{formatTL(priceTL)}</span> (1 £ = {gbpRate.toFixed(2)} ₺)
          </p>
        )}
      </div>

      {/* Fuel Consumption & Type */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5 text-[#063b28]" /> Tüketim
          </label>
          <Input
            type="number"
            min={0}
            max={30}
            step={0.1}
            placeholder="L/100km"
            value={form.avgFuelConsumption}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                avgFuelConsumption: Number(e.target.value),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#68706b] uppercase tracking-wider">
            Yakıt Türü
          </label>
          <Select
            value={form.fuelType}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                fuelType: v as CustomCarInput["fuelType"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Benzin">Benzin</SelectItem>
              <SelectItem value="Dizel">Dizel</SelectItem>
              <SelectItem value="Hibrit">Hibrit</SelectItem>
              <SelectItem value="Elektrik">Elektrik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TCO Preview */}
      {tco && (
        <div className="rounded-2xl border border-[#e5e2d8] bg-[#f0eee6] p-3.5 space-y-1.5">
          <p className="text-xs font-bold text-[#063b28] uppercase tracking-wider flex items-center gap-1">
            <Calculator className="h-3.5 w-3.5" /> 5 Yıllık Tahmini Maliyet
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#68706b]">Toplam TCO:</span>
            <span className="font-serif font-bold text-[#063b28] text-base">
              {formatTL(tco.total)}
            </span>
          </div>
        </div>
      )}

      {/* Add Button */}
      <Button
        className="w-full"
        onClick={handleAdd}
        disabled={
          !form.name.trim() || weightNum <= 0 || priceGBP <= 0 || !canAdd
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        Karşılaştırmaya Ekle
      </Button>
      {!canAdd && (
        <p className="text-xs text-center text-[#68706b]">
          En fazla 3 araç eklenebilir. Önce bir aracı çıkarın.
        </p>
      )}
    </div>
  );
}
