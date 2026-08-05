"use client";

import { useState, useCallback } from "react";
import { Car } from "@/types";
import { CarSelector } from "@/components/CarSelector";
import { CustomCarForm } from "@/components/CustomCarForm";
import { TaxDisplay } from "@/components/TaxDisplay";
import { ComparisonTable } from "@/components/ComparisonTable";
import { TCOChart } from "@/components/TCOChart";
import { BaremReference } from "@/components/BaremReference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_FUEL_PRICE_TL,
  DEFAULT_ANNUAL_KM,
  calculateRoadTax,
  calculateTCO,
  formatTL,
  formatGBP,
} from "@/utils/taxCalculator";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  Car as CarIcon,
  Fuel,
  Route,
  BarChart3,
  TableIcon,
  ShieldCheck,
  BookOpen,
  PenLine,
  PoundSterling,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Wifi,
  LayoutGrid,
  SlidersHorizontal,
  Plus,
  HelpCircle,
  Settings,
  Sparkles,
} from "lucide-react";

const MAX_CARS = 3;
type LeftTab = "database" | "custom";
type NavItem = "dashboard" | "database" | "custom" | "barem";

export default function Home() {
  const [selectedCars, setSelectedCars] = useState<(Car | null)[]>([
    null,
    null,
    null,
  ]);
  const [customCars, setCustomCars] = useState<Car[]>([]);
  const [fuelPriceTL, setFuelPriceTL] = useState<number>(DEFAULT_FUEL_PRICE_TL);
  const [annualKm, setAnnualKm] = useState<number>(DEFAULT_ANNUAL_KM);
  const [leftTab, setLeftTab] = useState<LeftTab>("database");
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");

  // Canlı GBP → TL kuru
  const {
    rate: gbpRate,
    source: rateSource,
    fetchedAt,
    isLoading: rateLoading,
    error: rateError,
    refresh: refreshRate,
  } = useExchangeRate();

  // Seçilen tüm araçlar (DB + özel)
  const allCars: Car[] = [
    ...selectedCars.filter((c): c is Car => c !== null),
    ...customCars,
  ].slice(0, MAX_CARS);

  const handleSelectCar = useCallback((car: Car | null, index: number) => {
    setSelectedCars((prev) => {
      const next = [...prev];
      next[index] = car;
      return next;
    });
  }, []);

  const handleRemoveCar = useCallback((id: string) => {
    setSelectedCars((prev) => prev.map((c) => (c?.id === id ? null : c)));
    setCustomCars((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleAddCustomCar = useCallback(
    (car: Car) => {
      const currentCount =
        selectedCars.filter(Boolean).length + customCars.length;
      if (currentCount >= MAX_CARS) return;
      setCustomCars((prev) => [...prev, car]);
    },
    [selectedCars, customCars]
  );

  const canAddMore = allCars.length < MAX_CARS;

  // Toplam hesaplamalar (Stat bar için)
  const totalAnnualTax = allCars.reduce(
    (sum, c) => sum + calculateRoadTax(c.weightKg).annualTax,
    0
  );
  const totalTCO = allCars.reduce(
    (sum, c) =>
      sum +
      calculateTCO(c, gbpRate, fuelPriceTL, annualKm, 5).total,
    0
  );

  // Kur gösterim metni
  const rateDisplay = rateLoading
    ? "Kur çekiliyor…"
    : `1 £ = ${gbpRate.toFixed(2)} ₺`;

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f6f5f0] text-[#111814]">
      {/* ══════════════════════════════════════════════════
          DESKTOP SIDEBAR (CurbWeight Style)
      ══════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex w-72 flex-col justify-between p-6 bg-[#f6f5f0] border-r border-[#e5e2d8] sticky top-0 h-screen shrink-0">
        <div className="space-y-8">
          {/* Logo & Subtitle */}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-3xl font-extrabold tracking-tight text-[#063b28]">
                AutoBarem
              </h1>
              <Badge variant="sand" className="text-[10px] px-2 py-0.5 font-bold">
                KKTC
              </Badge>
            </div>
            <p className="text-xs text-[#68706b] font-medium tracking-wide mt-1">
              Seyrüsefer & TCO Intelligence
            </p>
          </div>

          {/* Primary Action Button */}
          <Button
            className="w-full justify-start gap-2.5 bg-[#063b28] hover:bg-[#0a4d35] text-white rounded-2xl py-3 px-4 shadow-sm"
            onClick={() => {
              setLeftTab("custom");
              setActiveNav("custom");
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="font-semibold text-sm">Araç Ekle</span>
          </Button>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
              { id: "database", label: "Araç Veritabanı", icon: BookOpen },
              { id: "custom", label: "Özel Araç Gir", icon: PenLine },
              { id: "barem", label: "Barem Tablosu", icon: TableIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id as NavItem);
                    if (item.id === "database" || item.id === "custom") {
                      setLeftTab(item.id as LeftTab);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#063b28] text-white shadow-sm"
                      : "text-[#555d57] hover:bg-[#f0eee6] hover:text-[#111814]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Widgets (Exchange rate & Help) */}
        <div className="space-y-4 pt-6 border-t border-[#e5e2d8]">
          <div className="p-3.5 rounded-2xl bg-[#f0eee6] border border-[#e5e2d8] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#68706b]">
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Sterlin Kuru
              </span>
              <div className="flex items-center gap-1">
                {rateSource === "live" ? (
                  <Wifi className="h-3 w-3 text-[#063b28]" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-[#b84a32]" />
                )}
                <span className="text-[10px]">
                  {rateSource === "live" ? "Canlı" : "Yedek"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-lg text-[#063b28]">
                {rateDisplay}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#68706b] hover:text-[#063b28]"
                onClick={refreshRate}
                title="Kuru Yenile"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-[#68706b]">
            <span className="flex items-center gap-1.5 hover:text-[#111814] cursor-pointer">
              <HelpCircle className="h-3.5 w-3.5" /> Destek
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#111814] cursor-pointer">
              <Settings className="h-3.5 w-3.5" /> Ayarlar
            </span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MOBILE HEADER (CurbWeight Style)
      ══════════════════════════════════════════════════ */}
      <header className="lg:hidden bg-[#f6f5f0] border-b border-[#e5e2d8] p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-extrabold text-[#063b28]">
              AutoBarem
            </h1>
            <p className="text-[10px] text-[#68706b] font-medium">
              KKTC Seyrüsefer & TCO
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#f0eee6] border border-[#e5e2d8] rounded-xl px-3 py-1 text-xs font-bold text-[#063b28]">
              {rateDisplay}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT WORKSPACE
      ══════════════════════════════════════════════════ */}
      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Top Header & Data Sync Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#063b28]">
              Fleet Intelligence
            </h2>
            <p className="text-sm text-[#68706b] mt-1 max-w-2xl font-normal">
              KKTC araç seyrüsefer vergisi ağırlık baremleri, 5 yıllık toplam sahip olma maliyeti (TCO) ve piyasa karşılaştırması.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-[#f0eee6] border border-[#e5e2d8] px-3.5 py-1.5 rounded-full text-xs font-medium text-[#68706b]">
            <span className="h-2 w-2 rounded-full bg-[#063b28] animate-pulse" />
            <span>Data Sync: Live</span>
          </div>
        </div>

        {/* ─── STAT CARDS ROW (CurbWeight Style) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Annual Tax */}
          <Card className="rounded-3xl border border-[#e5e2d8] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#68706b] mb-2">
              Seçilen Araçlar Yıllık Vergi
            </p>
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#063b28]">
              {allCars.length > 0 ? formatTL(totalAnnualTax) : "₺0"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#68706b] mt-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#063b28]" />
              <span>{allCars.length} araç karşılaştırılıyor</span>
            </div>
          </Card>

          {/* Card 2: 5-Year TCO */}
          <Card className="rounded-3xl border border-[#e5e2d8] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#68706b] mb-2">
              5 Yıllık Toplam TCO
            </p>
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#111814]">
              {allCars.length > 0 ? formatTL(totalTCO) : "₺0"}
            </div>
            <div className="text-xs text-[#68706b] mt-2">
              Araç bedeli + vergi + 5 yıllık yakıt
            </div>
          </Card>

          {/* Card 3: Live Rate */}
          <Card className="rounded-3xl border border-[#e5e2d8] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#68706b] mb-2">
              Sterlin Kuru (GBP/TRY)
            </p>
            <div className="font-serif text-3xl sm:text-4xl font-bold text-[#063b28]">
              {gbpRate.toFixed(2)} ₺
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#68706b] mt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#063b28]" />
              <span>{rateSource === "live" ? "Canlı TCMB / API" : "Sabit Yedek Kur"}</span>
            </div>
          </Card>
        </div>

        {/* ─── MAIN TWO COLUMN WORKSPACE ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-start">
          {/* ══════════════════════════════════════════════════
              LEFT COLUMN — Controls & Parameters
          ══════════════════════════════════════════════════ */}
          <aside className="space-y-6">
            {/* Tab Switcher (Veritabanı / Özel Araç) */}
            <Card className="rounded-3xl p-2 bg-[#f0eee6] border border-[#e5e2d8]">
              <div className="flex gap-1">
                <button
                  onClick={() => setLeftTab("database")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs font-bold transition-all ${
                    leftTab === "database"
                      ? "bg-[#063b28] text-white shadow-sm"
                      : "text-[#68706b] hover:text-[#111814]"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Veritabanı
                </button>
                <button
                  onClick={() => setLeftTab("custom")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-2.5 px-3 text-xs font-bold transition-all ${
                    leftTab === "custom"
                      ? "bg-[#063b28] text-white shadow-sm"
                      : "text-[#68706b] hover:text-[#111814]"
                  }`}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Özel Araç
                </button>
              </div>
            </Card>

            {/* Selector or Form Card */}
            <Card className="rounded-3xl border border-[#e5e2d8] bg-white p-6 shadow-sm">
              {leftTab === "database" ? (
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg text-[#111814]">
                    Araç Seçimi (Max 3)
                  </h3>
                  <CarSelector
                    selectedCars={selectedCars.filter(
                      (c): c is Car => c !== null
                    )}
                    onSelect={handleSelectCar}
                    maxSlots={MAX_CARS}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-serif font-bold text-lg text-[#111814]">
                    Özel Araç Bilgileri
                  </h3>
                  <CustomCarForm
                    gbpRate={gbpRate}
                    onAddToComparison={handleAddCustomCar}
                    canAdd={canAddMore}
                  />
                </div>
              )}
            </Card>

            {/* Simulation Parameters Box (CurbWeight Style) */}
            <Card className="rounded-3xl border border-[#e5e2d8] bg-[#f0eee6]/70 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#111814]">
                  Simülasyon Parametreleri
                </h3>
                <SlidersHorizontal className="h-4 w-4 text-[#063b28]" />
              </div>

              <div className="space-y-4 pt-1">
                {/* Fuel Price */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#68706b] uppercase tracking-wider">
                      Yakıt Fiyatı
                    </span>
                    <span className="font-serif font-bold text-sm text-[#063b28]">
                      {fuelPriceTL} TL/L
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={fuelPriceTL}
                    onChange={(e) => setFuelPriceTL(Number(e.target.value))}
                    min={1}
                    max={200}
                    className="bg-white border-[#e5e2d8]"
                  />
                </div>

                {/* Annual Mileage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#68706b] uppercase tracking-wider">
                      Yıllık Kullanım
                    </span>
                    <span className="font-serif font-bold text-sm text-[#063b28]">
                      {annualKm.toLocaleString("tr-TR")} km
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={annualKm}
                    onChange={(e) => setAnnualKm(Number(e.target.value))}
                    step={1000}
                    min={1000}
                    max={100000}
                    className="bg-white border-[#e5e2d8]"
                  />
                </div>
              </div>

              <Button
                variant="sand"
                className="w-full rounded-2xl font-bold text-xs py-2.5 tracking-wide"
                onClick={() => {
                  /* trigger recalculation */
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Yeniden Hesapla
              </Button>
            </Card>

            {/* Barem Reference Table */}
            <BaremReference />
          </aside>

          {/* ══════════════════════════════════════════════════
              RIGHT COLUMN — Collection Cards & Analysis
          ══════════════════════════════════════════════════ */}
          <section className="space-y-8">
            {/* Empty State */}
            {allCars.length === 0 && (
              <Card className="rounded-3xl border-2 border-dashed border-[#e5e2d8] bg-white/60 p-12 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-[#f0eee6] flex items-center justify-center text-[#063b28]">
                    <CarIcon className="h-8 w-8 opacity-60" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#111814]">
                    Karşılaştırma Başlatılmadı
                  </h3>
                  <p className="text-sm text-[#68706b] max-w-sm">
                    Sol panelden veritabanı araçlarını seçin veya özel araç ekleyerek KKTC seyrüsefer ve 5 yıllık TCO analizi başlatın.
                  </p>
                  <Badge variant="sand" className="mt-2 py-1 px-3">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-[#063b28]" />
                    Sterlin (£) Kuru Canlı Entegre
                  </Badge>
                </div>
              </Card>
            )}

            {/* Selected Cars Collection (Porsche Taycan / DB5 Card style) */}
            {allCars.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl font-bold text-[#063b28]">
                    Seçilen Araç Filosu
                  </h3>
                  <span className="text-xs text-[#68706b] font-medium">
                    {allCars.length} / {MAX_CARS} Araç
                  </span>
                </div>
                <TaxDisplay
                  cars={allCars}
                  gbpRate={gbpRate}
                  onRemove={handleRemoveCar}
                />
              </div>
            )}

            {/* TCO Projected Trajectory Analysis Chart */}
            {allCars.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold text-[#063b28]">
                  5 Yıllık TCO Analizi
                </h3>
                <Card className="rounded-3xl border border-[#e5e2d8] bg-white p-6 shadow-sm">
                  <TCOChart
                    cars={allCars}
                    gbpRate={gbpRate}
                    fuelPriceTL={fuelPriceTL}
                    annualKm={annualKm}
                  />
                </Card>
              </div>
            )}

            {/* Market Comparison Table */}
            {allCars.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold text-[#063b28]">
                  Detaylı Karşılaştırma Tablosu
                </h3>
                <ComparisonTable
                  cars={allCars}
                  gbpRate={gbpRate}
                  fuelPriceTL={fuelPriceTL}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION (CurbWeight Image 2 Style)
      ══════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#e5e2d8] rounded-3xl p-2 shadow-xl z-50 flex items-center justify-around">
        <button
          onClick={() => setActiveNav("dashboard")}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${
            activeNav === "dashboard"
              ? "bg-[#063b28] text-white px-5"
              : "text-[#68706b]"
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setActiveNav("database");
            setLeftTab("database");
          }}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${
            activeNav === "database"
              ? "bg-[#063b28] text-white px-5"
              : "text-[#68706b]"
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] font-bold">Veritabanı</span>
        </button>

        <button
          onClick={() => {
            setActiveNav("custom");
            setLeftTab("custom");
          }}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${
            activeNav === "custom"
              ? "bg-[#063b28] text-white px-5"
              : "text-[#68706b]"
          }`}
        >
          <PenLine className="h-5 w-5" />
          <span className="text-[10px] font-bold">Özel Araç</span>
        </button>

        <button
          onClick={() => setActiveNav("barem")}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all ${
            activeNav === "barem"
              ? "bg-[#063b28] text-white px-5"
              : "text-[#68706b]"
          }`}
        >
          <TableIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold">Barem</span>
        </button>
      </div>
    </div>
  );
}
