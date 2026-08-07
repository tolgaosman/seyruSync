"use client";

import { useState, useCallback } from "react";
import { Car } from "@/types";
import { CarSelector } from "@/components/CarSelector";
import { TaxDisplay } from "@/components/TaxDisplay";
import { ComparisonTable } from "@/components/ComparisonTable";
import { TCOChart } from "@/components/TCOChart";
import { BaselineSummary } from "@/components/BaselineSummary";
import { BaremReference } from "@/components/BaremReference";
import { FuelPricesTable } from "@/components/FuelPricesTable";
import { ExchangeRatesTable } from "@/components/ExchangeRatesTable";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_FUEL_PRICE_TL,
  DEFAULT_ANNUAL_KM,
} from "@/utils/taxCalculator";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useFuelPrice } from "@/hooks/useFuelPrice";
import {
  Car as CarIcon,
  Route,
  BarChart3,
  TableIcon,
  ShieldCheck,
  PoundSterling,
  Fuel,
  AlertTriangle,
  Layers,
  MousePointerClick,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

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
    isLoading: rateLoading,
  } = useExchangeRate();

  const { prices, source: fuelSource, isLoading: fuelLoading } = useFuelPrice();
  const liveFuelPriceTL = prices?.oktan95 || DEFAULT_FUEL_PRICE_TL;

  // Seçilen tüm araçlar
  const allCars: Car[] = selectedCars
    .filter((c): c is Car => c !== null)
    .slice(0, MAX_CARS);

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

  const hasCars = allCars.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* ══════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════ */}
      <header className="glass sticky top-0 z-50 rounded-none border-x-0 border-t-0 shadow-none">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
          {/* Logo */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="rounded-xl border border-accent/30 bg-accent/20 p-2 text-accent">
              <CarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
                AutoCalc
                <span className="ml-1.5 text-accent-2">KKTC</span>
              </h1>
              <p className="hidden text-[11px] leading-none text-ink-3 sm:block">
                Seyrüsefer Vergisi &amp; TCO Karşılaştırıcı
              </p>
            </div>
          </div>

          {/* Canlı metrik pill'leri — mobilde yatay kaydırılır, ikinci kopya yok */}
          <div className="ml-auto flex min-w-0 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MetricPill
              icon={<PoundSterling className="h-3.5 w-3.5" />}
              label="GBP"
              value={rateLoading ? null : `${gbpRate.toFixed(2)} ₺`}
              status={rateSource === "live" ? "live" : "fallback"}
            />
            <MetricPill
              icon={<Fuel className="h-3.5 w-3.5" />}
              label="95 Oktan"
              value={fuelLoading ? null : `${liveFuelPriceTL.toFixed(2)} ₺`}
              status={fuelSource === "live" ? "live" : "fallback"}
            />

            {/* Yıllık km — uygulamadaki TEK örnek */}
            <label className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-fill py-1 pl-3 pr-1.5 text-xs">
              <Route className="h-3.5 w-3.5 text-ink-3" />
              <span className="text-ink-3">Yıllık</span>
              <Input
                type="number"
                aria-label="Yıllık kullanım (km)"
                className="h-7 w-[68px] rounded-lg border-0 bg-transparent px-1 text-base font-semibold text-ink shadow-none focus-visible:ring-0 sm:text-sm"
                value={annualKm}
                onChange={(e) => setAnnualKm(Number(e.target.value))}
                step={1000}
                min={1000}
              />
              <span className="pr-1.5 text-ink-3">km</span>
            </label>

            <ThemeToggle />
          </div>
        </div>

        {/* Yedek kur uyarısı */}
        {rateSource === "fallback" && !rateLoading && (
          <div className="flex items-center gap-2 border-t border-warn/25 bg-warn/10 px-4 py-2 text-[11px] text-warn sm:px-6 lg:px-8">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Canlı kur alınamadı. Yedek sabit kur (1 £ = {gbpRate.toFixed(2)} TL)
              kullanılıyor. Gerçek fiyatlar farklı olabilir.
            </span>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════ */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
        {/* ─── GARAJ ─── */}
        <section>
          <SectionHeader
            icon={<CarIcon className="h-5 w-5" />}
            title="Garaj"
            subtitle="Mevcut aracınızı ve karşılaştırmak istediğiniz araçları seçin (en fazla 3)"
          />
          {/* Filtrelenmemiş dizi geçiliyor: slot indeksleri hizalı kalsın diye.
              Filtrelenmiş hâlinde 1. slot boşken 2. aracın verisi 1. slota kayıyordu. */}
          <CarSelector
            selectedCars={selectedCars}
            onSelect={handleSelectCar}
            maxSlots={MAX_CARS}
          />
        </section>

        {/* ─── BOŞ DURUM ─── */}
        {!hasCars && <EmptyState />}

        {/* ─── VERGİ & BAREM ─── */}
        {hasCars && (
          <section>
            <SectionHeader
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Seyrüsefer Vergisi — Barem & Detay"
              subtitle="KKTC ağırlık baremlerine göre yıllık vergi hesabı (TL)"
            />
            <div className="space-y-5">
              <BaselineSummary cars={allCars} />
              <TaxDisplay
                cars={allCars}
                gbpRate={gbpRate}
                onRemove={handleRemoveCar}
              />
            </div>
          </section>
        )}

        {/* ─── KARŞILAŞTIRMA ─── */}
        {hasCars && (
          <section>
            <SectionHeader
              icon={<TableIcon className="h-5 w-5" />}
              title="Karşılaştırma Tablosu"
              subtitle={`Fiyat £ (TL karşılığı) · Barem · Yıllık vergi (TL) · Yakıt tüketimi — 1 £ = ${gbpRate.toFixed(2)} TL`}
            />
            <ComparisonTable
              cars={allCars}
              gbpRate={gbpRate}
              fuelPriceTL={liveFuelPriceTL}
            />
          </section>
        )}

        {/* ─── TCO ─── */}
        {hasCars && (
          <section>
            <SectionHeader
              icon={<BarChart3 className="h-5 w-5" />}
              title="Toplam Sahip Olma Maliyeti (TCO)"
              subtitle={`${annualKm.toLocaleString("tr-TR")} km/yıl · ${liveFuelPriceTL.toFixed(2)} TL/litre · Araç fiyatı 1 £ = ${gbpRate.toFixed(2)} TL üzerinden çevrildi`}
            />
            <Card>
              <CardContent className="pt-5">
                <TCOChart
                  cars={allCars}
                  gbpRate={gbpRate}
                  fuelPriceTL={liveFuelPriceTL}
                  annualKm={annualKm}
                />
              </CardContent>
            </Card>
          </section>
        )}

        {/* ─── PİYASA VERİLERİ (tek örnek) ─── */}
        <section>
          <SectionHeader
            icon={<Layers className="h-5 w-5" />}
            title="Piyasa Verileri & Referans"
            subtitle="KKTC güncel akaryakıt fiyatları, canlı döviz kurları ve resmî ağırlık baremleri"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            <FuelPricesTable />
            <ExchangeRatesTable />
            <BaremReference />
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="mt-12 border-t border-line px-4 py-8 text-center text-xs text-ink-3 sm:px-6 lg:px-8 [padding-bottom:calc(2rem+env(safe-area-inset-bottom))]">
        <p className="tnum">
          Döviz kuru:{" "}
          <span className="font-semibold text-ink-2">
            1 £ = {gbpRate.toFixed(4)} TL
          </span>{" "}
          ·{" "}
          {rateSource === "live"
            ? "Canlı veriler (open.er-api.com)"
            : "Yedek sabit kur"}
        </p>
        <p className="mx-auto mt-3 max-w-2xl">
          AutoBarem KKTC — Seyrüsefer vergisi hesaplamaları bilgi amaçlıdır.
          Resmî vergi tutarları için{" "}
          <span className="font-medium text-accent-2">
            KKTC Maliye Bakanlığı
          </span>
          &apos;na başvurunuz.
        </p>
        <p className="mt-1 text-ink-3/60">
          Araç fiyatları KKTC piyasa değerlerini yansıtır ve piyasa koşullarına
          göre değişebilir.
        </p>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aydınlık temaya geç" : "Koyu temaya geç"}
      title={isDark ? "Aydınlık tema" : "Koyu tema"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-fill text-ink-3 transition-colors duration-200 hover:bg-fill-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

function MetricPill({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  status: "live" | "fallback";
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-fill px-3 py-1.5 text-xs">
      <span className="text-accent-2">{icon}</span>
      <span className="hidden text-ink-3 sm:inline">{label}</span>
      {value === null ? (
        <span className="skeleton inline-block h-3.5 w-14" />
      ) : (
        <span className="tnum font-semibold text-ink">{value}</span>
      )}
      {status === "live" ? (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse-dot rounded-full bg-success" />
      ) : (
        <AlertTriangle className="h-3 w-3 shrink-0 text-warn" />
      )}
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
    <div className="mb-4 flex items-start gap-3 sm:mb-5">
      <div className="mt-0.5 shrink-0 rounded-xl border border-accent/25 bg-accent/12 p-2 text-accent-2">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>
      </div>
    </div>
  );
}

/** Hiç araç seçilmemişken gösterilen temiz ekran */
function EmptyState() {
  const steps = [
    { n: 1, label: "Marka ve model seçin" },
    { n: 2, label: "Kasa yılı ve motoru belirleyin" },
    { n: 3, label: "Hesapla'ya basın" },
  ];

  return (
    <Card className="w-full animate-fade-up border border-line bg-card/60 px-6 py-14 text-center backdrop-blur-md sm:py-20">
      <div className="mx-auto mb-5 w-fit rounded-2xl border border-accent/25 bg-accent/12 p-4 text-accent-2 shadow-lg shadow-accent/5">
        <CarIcon className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-bold text-ink sm:text-xl">
        Karşılaştırma Başlatılmadı
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-3">
        Yukarıdaki <strong className="font-semibold text-ink-2">Garaj</strong> bölümünden en az bir araç seçerek başlayın.
      </p>

      <ol className="mx-auto mt-7 flex max-w-xl flex-col gap-2.5 sm:flex-row sm:gap-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex flex-1 items-center gap-2.5 rounded-xl border border-line/60 bg-fill px-3.5 py-3 text-left"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent-2">
              {s.n}
            </span>
            <span className="text-xs font-medium text-ink-2">{s.label}</span>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-medium text-accent-2">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
        <span>Araç fiyatları Sterlin (£) · Seyrüsefer vergisi TL cinsindendir</span>
      </div>
    </Card>
  );
}
