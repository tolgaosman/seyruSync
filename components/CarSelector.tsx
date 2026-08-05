"use client";

import { useState, useEffect, useCallback } from "react";
import { Car } from "@/types";
import {
  fetchMakesOnline,
  fetchModelsOnline,
  fetchYearsOnline,
  fetchEnginesOnline,
  buildCar,
  EngineOption,
  POPULAR_MAKES,
} from "@/services/vehicleApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Calculator, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateRoadTax } from "@/utils/taxCalculator";

interface CarSelectorProps {
  selectedCars: Car[];
  onSelect: (car: Car | null, index: number) => void;
  maxSlots?: number;
}

interface SlotState {
  make: string;
  model: string;
  year: number | null;
  engine: EngineOption | null;

  models: string[];
  years: number[];
  engines: EngineOption[];

  loadingModels: boolean;
  loadingYears: boolean;
  loadingEngines: boolean;

  errors: { make?: string; model?: string; year?: string; engine?: string };
}

const emptySlot = (): SlotState => ({
  make: "",
  model: "",
  year: null,
  engine: null,
  models: [],
  years: [],
  engines: [],
  loadingModels: false,
  loadingYears: false,
  loadingEngines: false,
  errors: {},
});

export function CarSelector({
  selectedCars,
  onSelect,
  maxSlots = 3,
}: CarSelectorProps) {
  const [makes, setMakes] = useState<string[]>(POPULAR_MAKES);
  const [slots, setSlots] = useState<SlotState[]>(
    Array.from({ length: maxSlots }, emptySlot)
  );

  useEffect(() => {
    fetchMakesOnline().then((m) => {
      if (m.length > 0) setMakes(m);
    });
  }, []);

  const updateSlot = useCallback(
    (idx: number, patch: Partial<SlotState>) =>
      setSlots((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      }),
    []
  );

  /* ── 1. Marka Seçildi ── */
  const onMakeChange = async (make: string, idx: number) => {
    updateSlot(idx, {
      make,
      model: "",
      year: null,
      engine: null,
      models: [],
      years: [],
      engines: [],
      loadingModels: true,
      errors: {},
    });

    const models = await fetchModelsOnline(make);
    updateSlot(idx, { models, loadingModels: false });
  };

  /* ── 2. Model Seçildi ── */
  const onModelChange = async (model: string, idx: number) => {
    const make = slots[idx].make;
    updateSlot(idx, {
      model,
      year: null,
      engine: null,
      years: [],
      engines: [],
      loadingYears: true,
      errors: {},
    });

    const years = await fetchYearsOnline(make, model);
    updateSlot(idx, { years, loadingYears: false });
  };

  /* ── 3. Yıl Seçildi ── */
  const onYearChange = async (yearStr: string, idx: number) => {
    const year = parseInt(yearStr);
    const { make, model } = slots[idx];
    updateSlot(idx, {
      year,
      engine: null,
      engines: [],
      loadingEngines: true,
      errors: {},
    });

    const engines = await fetchEnginesOnline(make, model, year);
    updateSlot(idx, { engines, loadingEngines: false });
  };

  /* ── 4. Motor Hacmi Seçildi ── */
  const onEngineChange = (engineLabel: string, idx: number) => {
    const engine = slots[idx].engines.find((e) => e.label === engineLabel) ?? null;
    updateSlot(idx, { engine, errors: {} });
  };

  /* ── 5. Hesapla ── */
  const onCalculate = (idx: number) => {
    const s = slots[idx];
    const errors: SlotState["errors"] = {};
    if (!s.make) errors.make = "Marka seçilmedi";
    if (!s.model) errors.model = "Model seçilmedi";
    if (!s.year) errors.year = "Yeni kasa yılı seçilmedi";
    if (!s.engine) errors.engine = "Motor seçilmedi";

    if (Object.keys(errors).length > 0) {
      updateSlot(idx, { errors });
      return;
    }

    const car = buildCar(s.make, s.model, s.year!, s.engine!);
    onSelect(car, idx);
  };

  /* ── 6. Temizle ── */
  const onClear = (idx: number) => {
    onSelect(null, idx);
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = emptySlot();
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const selected = selectedCars[idx] ?? null;
        const s = slots[idx];
        const tax = selected
          ? calculateRoadTax(selected.weightKg, selected.year, selected.fuelType)
          : null;

        return (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Araç {idx + 1}
              </span>
              {selected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClear(idx)}
                  className="h-6 text-xs text-slate-400 hover:text-red-500 px-2 gap-1"
                >
                  <X className="h-3 w-3" /> Temizle
                </Button>
              )}
            </div>

            {/* Body */}
            <div className="p-3.5">
              {!selected ? (
                <div className="space-y-2.5">
                  {/* Row 1: Marka + Model */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Marka */}
                    <div>
                      <Select
                        value={s.make}
                        onValueChange={(v) => onMakeChange(v, idx)}
                      >
                        <SelectTrigger
                          className={`w-full text-xs h-9 ${s.errors.make ? "border-red-400" : ""}`}
                        >
                          <SelectValue placeholder="Marka seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {makes.map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {s.errors.make && (
                        <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> {s.errors.make}
                        </p>
                      )}
                    </div>

                    {/* Model */}
                    <div>
                      <Select
                        value={s.model}
                        onValueChange={(v) => onModelChange(v, idx)}
                        disabled={!s.make || s.loadingModels}
                      >
                        <SelectTrigger
                          className={`w-full text-xs h-9 ${s.errors.model ? "border-red-400" : ""}`}
                        >
                          <SelectValue
                            placeholder={
                              s.loadingModels
                                ? "Yükleniyor..."
                                : !s.make
                                ? "Önce marka"
                                : "Model seçin..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {s.models.map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {s.errors.model && (
                        <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> {s.errors.model}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Yıl + Motor Hacmi */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Yıl */}
                    <div>
                      <Select
                        value={s.year?.toString() ?? ""}
                        onValueChange={(v) => onYearChange(v, idx)}
                        disabled={!s.model || s.loadingYears}
                      >
                        <SelectTrigger
                          className={`w-full text-xs h-9 ${s.errors.year ? "border-red-400" : ""}`}
                        >
                          <SelectValue
                            placeholder={
                              s.loadingYears
                                ? "Yükleniyor..."
                                : !s.model
                                ? "Önce model"
                                : "Yeni kasa yılı seçin..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {s.years.map((y) => (
                            <SelectItem
                              key={y}
                              value={y.toString()}
                              className="text-xs"
                            >
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {s.errors.year && (
                        <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> {s.errors.year}
                        </p>
                      )}
                    </div>

                    {/* Motor Hacmi */}
                    <div>
                      <Select
                        value={s.engine?.label ?? ""}
                        onValueChange={(v) => onEngineChange(v, idx)}
                        disabled={!s.year || s.loadingEngines}
                      >
                        <SelectTrigger
                          className={`w-full text-xs h-9 ${s.errors.engine ? "border-red-400" : ""}`}
                        >
                          <SelectValue
                            placeholder={
                              s.loadingEngines
                                ? "Yükleniyor..."
                                : !s.year
                                ? "Önce yıl"
                                : "Motor seçin..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {s.engines.map((e) => (
                            <SelectItem
                              key={e.label}
                              value={e.label}
                              className="text-xs"
                            >
                              {e.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {s.errors.engine && (
                        <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-0.5">
                          <AlertCircle className="h-3 w-3" /> {s.errors.engine}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hesapla Butonu */}
                  <Button
                    className="w-full h-9 text-xs font-semibold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onCalculate(idx)}
                    disabled={
                      s.loadingModels ||
                      s.loadingYears ||
                      s.loadingEngines
                    }
                  >
                    {s.loadingModels || s.loadingYears || s.loadingEngines ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-3.5 w-3.5" />
                        Hesapla
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* ── Seçilen Araç Özeti ── */
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">
                        {selected.brand} {selected.model}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selected.year} &middot;{" "}
                        {selected.engineCC
                          ? `${selected.engineCC} cc`
                          : "—"}{" "}
                        &middot; {selected.fuelType} &middot;{" "}
                        {selected.weightKg} kg
                      </p>
                    </div>
                    {tax && (
                      <div className="shrink-0 text-right">
                        <Badge
                          variant={
                            (`barem${tax.barem}` as
                              | "barem1"
                              | "barem2"
                              | "barem3"
                              | "barem4")
                          }
                          className="text-xs px-2 py-0.5"
                        >
                          {tax.baremLabel}
                        </Badge>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-semibold">
                          {tax.annualTax.toLocaleString("tr-TR")} TL/yıl
                        </p>
                        {tax.ageDiscountApplied && (
                          <p className="text-[10px] text-emerald-600 font-medium">
                            %30 yaş indirimi uygulandı
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
