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
import {
  X,
  RefreshCw,
  Calculator,
  AlertCircle,
  Star,
  Plus,
  Gauge,
  Weight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateRoadTax, formatTL } from "@/utils/taxCalculator";
import { cn } from "@/lib/utils";

interface CarSelectorProps {
  /** Slot sırasıyla hizalı dizi — boş slotlar null */
  selectedCars: (Car | null)[];
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

const SLOT_LABELS = ["Mevcut Aracınız", "Karşılaştırma 1", "Karşılaştırma 2"];

export function CarSelector({
  selectedCars,
  onSelect,
  maxSlots = 3,
}: CarSelectorProps) {
  const [makes, setMakes] = useState<string[]>(POPULAR_MAKES);
  const [slots, setSlots] = useState<SlotState[]>(
    Array.from({ length: maxSlots }, emptySlot)
  );
  /** Mobilde 2. ve 3. slot varsayılan olarak kapalı durur */
  const [expanded, setExpanded] = useState<boolean[]>(
    Array.from({ length: maxSlots }, (_, i) => i === 0)
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
    if (!s.year) errors.year = "Kasa yılı seçilmedi";
    if (!s.engine) errors.engine = "Motor hacmi seçilmedi";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const selected = selectedCars[idx] ?? null;
        const s = slots[idx];
        const tax = selected
          ? calculateRoadTax(selected.weightKg, selected.year, selected.fuelType)
          : null;

        const isBaseline = idx === 0;
        const isBusy = s.loadingModels || s.loadingYears || s.loadingEngines;
        const isOpen = expanded[idx] || !!selected;

        // Kaç adım tamamlandı (ilerleme çubuğu için)
        const steps = [!!s.make, !!s.model, !!s.year, !!s.engine];
        const doneSteps = selected ? 4 : steps.filter(Boolean).length;

        return (
          <div
            key={idx}
            className={cn(
              "glass animate-fade-up flex flex-col rounded-2xl transition-[box-shadow,border-color] duration-300",
              isBaseline && "ring-1 ring-accent/35"
            )}
            style={{ "--d": `${idx * 70}ms` } as React.CSSProperties}
          >
            {/* ── Başlık ── */}
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider",
                  isBaseline ? "text-accent-2" : "text-ink-3"
                )}
              >
                {isBaseline && <Star className="h-3 w-3 fill-current" />}
                {SLOT_LABELS[idx] ?? `Araç ${idx + 1}`}
              </span>

              {selected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClear(idx)}
                  className="h-7 gap-1 px-2 text-xs hover:text-danger"
                >
                  <X className="h-3 w-3" /> Temizle
                </Button>
              ) : (
                <span className="tnum text-[11px] font-medium text-ink-3">
                  {doneSteps}/4
                </span>
              )}
            </div>

            {/* ── İlerleme rayı ── */}
            <div className="flex gap-1 px-4 pt-3">
              {steps.map((done, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-300",
                    i < doneSteps ? "bg-accent/70" : "bg-fill-3"
                  )}
                />
              ))}
            </div>

            {/* ── Gövde ── */}
            <div className="flex-1 p-4">
              {!selected && !isOpen && (
                /* Sadece mobilde katlanır — sm ve üstünde form hep açık */
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = [...prev];
                      next[idx] = true;
                      return next;
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-6 text-sm text-ink-3 transition-colors duration-200 hover:border-accent/40 hover:bg-fill hover:text-ink-2 sm:hidden"
                >
                  <Plus className="h-4 w-4" />
                  Karşılaştırma aracı ekle
                </button>
              )}

              {!selected ? (
                <div className={cn("space-y-3", !isOpen && "hidden sm:block")}>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Marka" error={s.errors.make}>
                      <Select
                        value={s.make}
                        onValueChange={(v) => onMakeChange(v, idx)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full text-xs",
                            s.errors.make && "border-danger/60"
                          )}
                        >
                          <SelectValue placeholder="Marka seçin…" />
                        </SelectTrigger>
                        <SelectContent>
                          {makes.map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field
                      label="Model"
                      error={s.errors.model}
                      loading={s.loadingModels}
                    >
                      <Select
                        value={s.model}
                        onValueChange={(v) => onModelChange(v, idx)}
                        disabled={!s.make || s.loadingModels}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full text-xs",
                            s.errors.model && "border-danger/60"
                          )}
                        >
                          <SelectValue
                            placeholder={!s.make ? "Önce marka" : "Model seçin…"}
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
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field
                      label="Kasa Yılı"
                      error={s.errors.year}
                      loading={s.loadingYears}
                    >
                      <Select
                        value={s.year?.toString() ?? ""}
                        onValueChange={(v) => onYearChange(v, idx)}
                        disabled={!s.model || s.loadingYears}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full text-xs",
                            s.errors.year && "border-danger/60"
                          )}
                        >
                          <SelectValue
                            placeholder={!s.model ? "Önce model" : "Yıl seçin…"}
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
                    </Field>

                    <Field
                      label="Motor"
                      error={s.errors.engine}
                      loading={s.loadingEngines}
                    >
                      <Select
                        value={s.engine?.label ?? ""}
                        onValueChange={(v) => onEngineChange(v, idx)}
                        disabled={!s.year || s.loadingEngines}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-10 w-full text-xs",
                            s.errors.engine && "border-danger/60"
                          )}
                        >
                          <SelectValue
                            placeholder={!s.year ? "Önce yıl" : "Motor seçin…"}
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
                    </Field>
                  </div>

                  <Button
                    className="h-10 w-full gap-2 text-xs font-semibold"
                    onClick={() => onCalculate(idx)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Yükleniyor…
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
                <div className="animate-fade-in space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-bold text-ink">
                        {selected.brand} {selected.model}
                      </h4>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {selected.year} ·{" "}
                        {selected.engineCC ? `${selected.engineCC} cc` : "—"} ·{" "}
                        {selected.fuelType}
                      </p>
                    </div>
                    {tax && (
                      <Badge
                        variant={
                          `barem${tax.barem}` as
                            | "barem1"
                            | "barem2"
                            | "barem3"
                            | "barem4"
                        }
                        className="shrink-0"
                      >
                        {tax.baremLabel}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-line bg-fill p-2.5">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-3">
                        <Weight className="h-3 w-3" /> Ağırlık
                      </span>
                      <p className="tnum mt-0.5 text-sm font-bold text-ink">
                        {selected.weightKg.toLocaleString("tr-TR")}
                        <span className="ml-1 text-xs font-normal opacity-70">
                          kg
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-line bg-fill p-2.5">
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-3">
                        <Gauge className="h-3 w-3" /> Yıllık Vergi
                      </span>
                      <p className="tnum mt-0.5 text-sm font-bold text-ink">
                        {tax ? formatTL(tax.annualTax) : "—"}
                      </p>
                    </div>
                  </div>

                  {tax?.ageDiscountApplied && (
                    <p className="text-[11px] font-medium text-success">
                      %30 yaş indirimi uygulandı
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Etiket + hata mesajı + yükleniyor iskeleti sarmalayıcısı */
function Field({
  label,
  error,
  loading,
  children,
}: {
  label: string;
  error?: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-ink-3">
        {label}
      </label>
      {loading ? (
        <div className="skeleton h-10 w-full" />
      ) : (
        children
      )}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
