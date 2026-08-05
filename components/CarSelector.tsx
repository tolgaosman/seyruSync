"use client";

import { useState, useEffect } from "react";
import { Car } from "@/types";
import {
  fetchMakesOnline,
  fetchModelsOnline,
  fetchVehicleSpecsOnline,
  POPULAR_MAKES,
} from "@/services/vehicleApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Globe, RefreshCw, Sparkles, Search } from "lucide-react";
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
  const [makes, setMakes] = useState<string[]>(POPULAR_MAKES);
  const [selectedMakes, setSelectedMakes] = useState<{ [key: number]: string }>({});
  const [modelsMap, setModelsMap] = useState<{ [key: number]: string[] }>({});
  const [loadingMap, setLoadingMap] = useState<{ [key: number]: boolean }>({});
  const [customQueries, setCustomQueries] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Canlı marka listesini internetten güncelle
    fetchMakesOnline().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setMakes(fetched);
      }
    });
  }, []);

  const handleMakeChange = async (make: string, slotIdx: number) => {
    setSelectedMakes((prev) => ({ ...prev, [slotIdx]: make }));
    setLoadingMap((prev) => ({ ...prev, [slotIdx]: true }));

    // İnternetten markanın modellerini dinamik çek
    const fetchedModels = await fetchModelsOnline(make);
    setModelsMap((prev) => ({ ...prev, [slotIdx]: fetchedModels }));
    setLoadingMap((prev) => ({ ...prev, [slotIdx]: false }));
  };

  const handleModelChange = async (model: string, slotIdx: number) => {
    const make = selectedMakes[slotIdx];
    if (!make || !model) return;

    setLoadingMap((prev) => ({ ...prev, [slotIdx]: true }));

    // İnternetten seçilen marka ve modelin canlı özelliklerini çek
    const liveCar = await fetchVehicleSpecsOnline(make, model);
    onSelect(liveCar, slotIdx);

    setLoadingMap((prev) => ({ ...prev, [slotIdx]: false }));
  };

  const handleDirectSearch = async (slotIdx: number) => {
    const query = customQueries[slotIdx]?.trim();
    if (!query) return;

    setLoadingMap((prev) => ({ ...prev, [slotIdx]: true }));

    const parts = query.split(" ");
    const make = parts[0] || "Özel";
    const model = parts.slice(1).join(" ") || "Model";

    const liveCar = await fetchVehicleSpecsOnline(make, model);
    onSelect(liveCar, slotIdx);

    setLoadingMap((prev) => ({ ...prev, [slotIdx]: false }));
  };

  return (
    <div className="space-y-5">

      {Array.from({ length: maxSlots }).map((_, idx) => {
        const selected = selectedCars[idx] ?? null;
        const tax = selected ? calculateRoadTax(selected.weightKg) : null;
        const colors = tax ? getBaremColors(tax.barem) : null;
        const isLoading = loadingMap[idx] || false;
        const currentMake = selectedMakes[idx] || "";
        const availableModels = modelsMap[idx] || [];

        return (
          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Araç Slot {idx + 1}
              </label>
              {selected && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSelect(null, idx);
                    setSelectedMakes((prev) => ({ ...prev, [idx]: "" }));
                  }}
                  className="h-6 text-xs text-slate-400 hover:text-red-500 px-2"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Temizle
                </Button>
              )}
            </div>

            {/* Step 1: Select Make online or type directly */}
            {!selected ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={currentMake}
                    onValueChange={(val) => handleMakeChange(val, idx)}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Marka Seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    disabled={!currentMake || isLoading}
                    onValueChange={(val) => handleModelChange(val, idx)}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue
                        placeholder={
                          isLoading
                            ? "Yükleniyor…"
                            : availableModels.length > 0
                            ? "Model Seçin..."
                            : currentMake
                            ? "Model Yazın..."
                            : "Önce Marka"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Direkt İnternet Arama Kutusu */}
                <div className="flex items-center gap-1.5 pt-1">
                  <Input
                    placeholder="veya direkt yazın: örn. Toyota RAV4 2024"
                    className="text-xs h-8"
                    value={customQueries[idx] || ""}
                    onChange={(e) =>
                      setCustomQueries((prev) => ({ ...prev, [idx]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDirectSearch(idx);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs shrink-0 px-3"
                    onClick={() => handleDirectSearch(idx)}
                    disabled={isLoading || !customQueries[idx]?.trim()}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Selected Car Summary Card */
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {selected.brand} {selected.model}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {selected.year} · {selected.fuelType} · {selected.weightKg} kg · £{selected.priceGBP.toLocaleString("en-GB")}
                    </p>
                  </div>
                  {tax && colors && (
                    <Badge
                      variant={
                        `barem${tax.barem}` as
                          | "barem1"
                          | "barem2"
                          | "barem3"
                          | "barem4"
                      }
                      className="text-xs px-2.5 py-1 shrink-0"
                    >
                      {tax.baremLabel} ({tax.annualTax.toLocaleString("tr-TR")} TL/yıl)
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
