"use client";

import { useState, useEffect, useCallback } from "react";
import { Car } from "@/types";
import { CarSelector } from "@/components/CarSelector";
import { TaxDisplay } from "@/components/TaxDisplay";
import { ComparisonTable } from "@/components/ComparisonTable";
import { TCOChart } from "@/components/TCOChart";
import { BaremReference } from "@/components/BaremReference";
import { FuelPricesTable } from "@/components/FuelPricesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_FUEL_PRICE_TL,
  DEFAULT_ANNUAL_KM,
} from "@/utils/taxCalculator";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useFuelPrice } from "@/hooks/useFuelPrice";
import {
  Car as CarIcon,
  Fuel,
  Route,
  BarChart3,
  TableIcon,
  ShieldCheck,
  PoundSterling,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Wifi,
} from "lucide-react";

const MAX_CARS = 3;

export default function Home() {
  const [selectedCars, setSelectedCars] = useState<(Car | null)[]>([
    null,
    null,
    null,
  ]);
  const [annualKm, setAnnualKm] = useState<number>(DEFAULT_ANNUAL_KM);

  // Canlı GBP → TL kuru
  const {
    rate: gbpRate,
    source: rateSource,
    fetchedAt,
    isLoading: rateLoading,
    error: rateError,
    refresh: refreshRate,
  } = useExchangeRate();

  // Canlı & Günlük Otomatik KKTC Benzin TL/L Fiyatı
  const {
    prices,
    lastUpdated: fuelLastUpdated,
    refresh: refreshFuelPrice,
  } = useFuelPrice();

  const liveFuelPriceTL = prices?.oktan95 || DEFAULT_FUEL_PRICE_TL;

  const [fuelPriceTL, setFuelPriceTL] = useState<number>(DEFAULT_FUEL_PRICE_TL);

  // Canlı benzin fiyatı geldiğinde state'i güncelle
  useEffect(() => {
    if (liveFuelPriceTL && liveFuelPriceTL > 0) {
      setFuelPriceTL(liveFuelPriceTL);
    }
  }, [liveFuelPriceTL]);

  // Seçilen tüm araçlar
  const allCars: Car[] = selectedCars.filter((c): c is Car => c !== null).slice(0, MAX_CARS);

  const handleSelectCar = useCallback((car: Car | null, index: number) => {
    setSelectedCars((prev) => {
      const next = [...prev];
      next[index] = car;
      return next;
    });
  }, []);

  const handleRemoveCar = useCallback((id: string) => {
    setSelectedCars((prev) => prev.map((c) => (c?.id === id ? null : c)));
  }, []);

  // Kur gösterim metni
  const rateDisplay = rateLoading
    ? "Kur yükleniyor…"
    : `1 £ = ${gbpRate.toFixed(2)} ₺`;

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* ─── HEADER ─── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm">
              <CarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                AutoCalc
                <span className="ml-2 text-blue-600">KKTC</span>
              </h1>
              <p className="text-xs text-slate-400 leading-none">
                Seyrüsefer Vergisi & TCO Karşılaştırıcı
              </p>
            </div>
          </div>

          {/* Canlı Kur Göstergesi */}
          <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-1.5 whitespace-nowrap shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <PoundSterling className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-sm font-bold text-blue-800 whitespace-nowrap">
                {rateDisplay}
              </span>
            </div>
            <div className="h-4 w-px bg-blue-200 shrink-0" />
            <div className="flex items-center gap-1 shrink-0">
              {rateSource === "live" ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : rateSource === "fallback" ? (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 text-slate-400 animate-spin shrink-0" />
              )}
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {rateSource === "live"
                  ? `Canlı ${fetchedDate ?? ""}`
                  : rateSource === "fallback"
                    ? "Yedek kur"
                    : "Yükleniyor"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-blue-400 hover:text-blue-600 shrink-0"
              onClick={refreshRate}
              title="Kuru yenile"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* TCO Parametreleri (masaüstü) */}
          <div className="hidden lg:flex items-center gap-4 text-sm text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <Route className="h-4 w-4 text-slate-400" />
              <span className="text-xs">Yıllık:</span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                <Input
                  type="number"
                  className="border-0 h-7 w-20 text-sm shadow-none focus-visible:ring-0 text-slate-700 font-medium"
                  value={annualKm}
                  onChange={(e) => setAnnualKm(Number(e.target.value))}
                  step={1000}
                  min={1000}
                />
                <span className="text-xs text-slate-400 pr-2">km</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              KKTC Vergi Sistemi
            </span>
          </div>
        </div>

        {/* Kur uyarısı (fallback modunda) */}
        {rateSource === "fallback" && !rateLoading && (
          <div className="bg-amber-50 border-t border-amber-200 px-6 py-2 flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Canlı kur alınamadı. Yedek sabit kur (1 £ = {gbpRate.toFixed(2)} TL) kullanılıyor.
              Gerçek fiyatlar farklı olabilir.
            </span>
          </div>
        )}
      </header>

      {/* ─── MAIN ─── */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">

          {/* ══════════════════════════════════════════════════
              SOL SÜTUN — Giriş Paneli
          ══════════════════════════════════════════════════ */}
          <aside className="space-y-6 lg:sticky lg:top-24">

            {/* Araç Seçimi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-slate-700 flex items-center gap-2">
                  <CarIcon className="h-4 w-4 text-blue-500" />
                  Araç Seçimi (en fazla 3)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CarSelector
                  selectedCars={selectedCars.filter(
                    (c): c is Car => c !== null
                  )}
                  onSelect={handleSelectCar}
                  maxSlots={MAX_CARS}
                />
              </CardContent>
            </Card>

            {/* Mobil: TCO Parametreleri */}
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle className="text-sm text-slate-700">
                  TCO Parametreleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mobil kur göstergesi */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-1.5">
                    <PoundSterling className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-800">
                      {rateDisplay}
                    </span>
                  </div>
                  {rateSource === "fallback" && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">
                    Yıllık Kullanım (km)
                  </label>
                  <Input
                    type="number"
                    value={annualKm}
                    onChange={(e) => setAnnualKm(Number(e.target.value))}
                    step={1000}
                    min={1000}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Barem Referans Tablosu */}
            <BaremReference />
          </aside>

          {/* ══════════════════════════════════════════════════
              SAĞ SÜTUN — Sonuçlar Paneli
          ══════════════════════════════════════════════════ */}
          <section className="space-y-8">
            
            {/* Akaryakıt Fiyatları Tablosu */}
            <FuelPricesTable />

            {/* Boş Durum */}
            {allCars.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                <CarIcon className="h-14 w-14 mb-4 opacity-30" />
                <h2 className="text-lg font-semibold text-slate-500 mb-1">
                  Karşılaştırma başlatılmadı
                </h2>
                <p className="text-sm max-w-xs">
                  Sol panelden araç veritabanından seçim yapın ya da kendi araç
                  bilgilerinizi girin.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full">
                  <PoundSterling className="h-3.5 w-3.5" />
                  <span>
                    Araç fiyatları Sterlin (£) · Seyrüsefer vergisi TL cinsindendir
                  </span>
                </div>
              </div>
            )}

            {/* Vergi Gösterimi */}
            {allCars.length > 0 && (
              <div>
                <SectionHeader
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Seyrüsefer Vergisi — Barem & Detay"
                  subtitle="KKTC ağırlık baremlerine göre yıllık vergi hesabı (TL)"
                />
                <TaxDisplay
                  cars={allCars}
                  gbpRate={gbpRate}
                  onRemove={handleRemoveCar}
                />
              </div>
            )}

            {/* Karşılaştırma Tablosu */}
            {allCars.length > 0 && (
              <div>
                <SectionHeader
                  icon={<TableIcon className="h-5 w-5" />}
                  title="Karşılaştırma Tablosu"
                  subtitle={`Fiyat £ (TL karşılığı) · Barem · Yıllık vergi (TL) · Yakıt tüketimi — 1 £ = ${gbpRate.toFixed(2)} TL`}
                />
                <ComparisonTable
                  cars={allCars}
                  gbpRate={gbpRate}
                  fuelPriceTL={fuelPriceTL}
                />
              </div>
            )}

            {/* TCO Grafiği */}
            {allCars.length > 0 && (
              <div>
                <SectionHeader
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="5 Yıllık Toplam Sahip Olma Maliyeti (TCO)"
                  subtitle={`${annualKm.toLocaleString("tr-TR")} km/yıl · ${fuelPriceTL} TL/litre · 5 yıl · Araç fiyatı 1 £ = ${gbpRate.toFixed(2)} TL üzerinden TL'ye çevrildi`}
                />
                <Card>
                  <CardContent className="pt-5">
                    <TCOChart
                      cars={allCars}
                      gbpRate={gbpRate}
                      fuelPriceTL={fuelPriceTL}
                      annualKm={annualKm}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          <span>
            Döviz kuru:{" "}
            <span className="font-semibold text-slate-600">
              1 £ = {gbpRate.toFixed(4)} TL
            </span>{" "}
            ·{" "}
            {rateSource === "live"
              ? "Canlı veriler (exchangerate-api.com)"
              : "Yedek sabit kur"}
          </span>
        </div>
        <p>
          AutoBarem KKTC — Seyrüsefer vergisi hesaplamaları bilgi amaçlıdır.
          Resmi vergi tutarları için{" "}
          <span className="text-blue-500 font-medium">
            KKTC Maliye Bakanlığı
          </span>
          'na başvurunuz.
        </p>
        <p className="mt-1 text-slate-300">
          Araç fiyatları KKTC piyasa değerlerini yansıtır ve piyasa koşullarına
          göre değişebilir.
        </p>
      </footer>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mt-0.5 shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
