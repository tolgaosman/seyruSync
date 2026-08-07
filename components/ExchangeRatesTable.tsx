"use client";

import { useState } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  PoundSterling,
  DollarSign,
  Euro,
  ArrowRightLeft,
} from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Currency = "GBP" | "USD" | "EUR" | "TRY";

export function ExchangeRatesTable() {
  const { rates, source, fetchedAt, isLoading, error, refresh } =
    useExchangeRate();
  const [amount, setAmount] = useState<string>("100");
  const [baseCurrency, setBaseCurrency] = useState<Currency>("GBP");

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Bilinmiyor";

  // Çeviri hesaplama — matematik değişmedi
  const numAmount = parseFloat(amount) || 0;
  let inTRY = 0;
  if (baseCurrency === "TRY") inTRY = numAmount;
  else if (baseCurrency === "GBP") inTRY = numAmount * rates.gbp;
  else if (baseCurrency === "USD") inTRY = numAmount * rates.usd;
  else if (baseCurrency === "EUR") inTRY = numAmount * rates.eur;

  const outGBP = baseCurrency === "GBP" ? numAmount : inTRY / rates.gbp;
  const outUSD = baseCurrency === "USD" ? numAmount : inTRY / rates.usd;
  const outEUR = baseCurrency === "EUR" ? numAmount : inTRY / rates.eur;
  const outTRY = inTRY;

  const rows = [
    { code: "GBP", icon: <PoundSterling className="h-3.5 w-3.5" />, rate: rates.gbp },
    { code: "USD", icon: <DollarSign className="h-3.5 w-3.5" />, rate: rates.usd },
    { code: "EUR", icon: <Euro className="h-3.5 w-3.5" />, rate: rates.eur },
  ];

  const results: Array<[Currency, string, string]> = [
    ["GBP", "£", outGBP.toLocaleString("tr-TR", { maximumFractionDigits: 2 })],
    ["USD", "$", outUSD.toLocaleString("tr-TR", { maximumFractionDigits: 2 })],
    ["EUR", "€", outEUR.toLocaleString("tr-TR", { maximumFractionDigits: 2 })],
    ["TRY", "₺", outTRY.toLocaleString("tr-TR", { maximumFractionDigits: 2 })],
  ];

  return (
    <WidgetCard
      title="Canlı Döviz Kurları"
      icon={<PoundSterling className="h-4 w-4" />}
      source={source === "loading" ? "loading" : source}
      lastUpdated={fetchedDate}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Döviz</TableHead>
            <TableHead className="text-right">Alış</TableHead>
            <TableHead className="text-right">Satış</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ code, icon, rate }) => (
            <TableRow key={code}>
              <TableCell className="font-medium text-ink-2">
                <span className="flex items-center gap-2">
                  <span className="text-ink-3">{icon}</span> {code}
                </span>
              </TableCell>
              <TableCell className="tnum text-right font-medium text-success">
                {(rate * 0.995).toFixed(4)} ₺
              </TableCell>
              <TableCell className="tnum text-right font-bold text-danger">
                {(rate * 1.005).toFixed(4)} ₺
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ── Hızlı Çevirici ── */}
      <div className="border-t border-line bg-fill p-4">
        <div className="mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-3.5 w-3.5 text-accent-2" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
            Kur Çevirici
          </span>
        </div>

        <div className="mb-3 flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 flex-1 text-base sm:text-sm"
            placeholder="Miktar"
            aria-label="Çevrilecek miktar"
          />
          <Select
            value={baseCurrency}
            onValueChange={(val: Currency) => setBaseCurrency(val)}
          >
            <SelectTrigger className="h-10 w-28 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="TRY">TL (₺)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {results
            .filter(([code]) => code !== baseCurrency)
            .map(([code, symbol, value]) => (
              <div
                key={code}
                className="rounded-xl border border-line bg-fill p-2 text-center"
              >
                <span className="block text-[10px] uppercase tracking-wide text-ink-3">
                  {code}
                </span>
                <span
                  className={`tnum text-sm font-bold ${
                    code === "TRY" ? "text-accent-2" : "text-ink"
                  }`}
                >
                  {symbol}
                  {value}
                </span>
              </div>
            ))}
        </div>
      </div>
    </WidgetCard>
  );
}
