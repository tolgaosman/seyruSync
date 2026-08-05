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
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Araç Adı / Markası
        </label>
        <Input
          placeholder="örn. 2020 Honda Civic"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      {/* Weight */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <Scale className="h-3.5 w-3.5" /> Boş Ağırlık (kg)
        </label>
        <Input
          type="number"
          min={100}
          max={5000}
          placeholder="örn. 1250"
          value={form.weightKg}
          onChange={(e) =>
            setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))
          }
        />
        {tax && colors && (
          <div
            className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border ${colors.border} ${colors.bg} text-sm mt-1`}
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
              {tax.baremRange}
            </span>
            <span className="text-slate-400">·</span>
            <span className={`font-bold ${colors.text}`}>
              {tax.annualTax.toLocaleString("tr-TR")} TL/yıl
            </span>
          </div>
        )}
      </div>

      {/* Price GBP */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <PoundSterling className="h-3.5 w-3.5" /> Araç Fiyatı (£ Sterlin)
        </label>
        <Input
          type="number"
          min={0}
          placeholder="örn. 20000"
          value={form.priceGBP}
          onChange={(e) =>
            setForm((f) => ({ ...f, priceGBP: Number(e.target.value) }))
          }
        />
        {priceGBP > 0 && (
          <p className="text-xs text-slate-500 mt-1">
            ≈{" "}
            <span className="font-semibold text-slate-700">
              {formatTL(priceTL)}
            </span>{" "}
            (1 £ = {gbpRate.toFixed(2)} TL kuru ile)
          </p>
        )}
      </div>

      {/* Fuel Consumption */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
          <Fuel className="h-3.5 w-3.5" /> Yakıt Tüketimi (L/100km)
        </label>
        <Input
          type="number"
          min={0}
          max={30}
          step={0.1}
          placeholder="örn. 6.5"
          value={form.avgFuelConsumption}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              avgFuelConsumption: Number(e.target.value),
            }))
          }
        />
      </div>

      {/* Fuel Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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

      {/* TCO Preview */}
      {tco && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
            <Calculator className="h-3.5 w-3.5" /> 5 Yıllık Tahmini Maliyet
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Araç Fiyatı (£)</p>
              <p className="font-semibold text-slate-700">
                {formatGBP(tco.vehiclePriceGBP)}
              </p>
              <p className="text-xs text-slate-400">≈ {formatTL(tco.vehiclePriceTL)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">5 Yıl Seyrüsefer Vergisi</p>
              <p className="font-semibold text-slate-700">
                {formatTL(tco.fiveYearTax)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">5 Yıl Yakıt</p>
              <p className="font-semibold text-slate-700">
                {form.fuelType === "Elektrik"
                  ? "Hesaplanmıyor (EV)"
                  : formatTL(tco.fiveYearFuel)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium">Toplam TCO</p>
              <p className="font-bold text-blue-700">{formatTL(tco.total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add to Comparison */}
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
        <p className="text-xs text-center text-slate-400">
          Maksimum 3 araç seçildi. Önce bir aracı kaldırın.
        </p>
      )}
    </div>
  );
}
