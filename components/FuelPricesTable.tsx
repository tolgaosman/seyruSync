"use client";

import { useFuelPrice } from "@/hooks/useFuelPrice";
import { Fuel } from "lucide-react";
import { WidgetCard } from "@/components/ui/widget-card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const ROWS: Array<{ label: string; key: keyof ReturnType<typeof useFuelPrice>["prices"] }> = [
  { label: "95 Oktan", key: "oktan95" },
  { label: "98 Oktan", key: "oktan98" },
  { label: "Euro Diesel", key: "euroDiesel" },
  { label: "Gazyağı", key: "gazyagi" },
];

export function FuelPricesTable() {
  const { prices, source, lastUpdated, isLoading, error, refresh } =
    useFuelPrice();

  return (
    <WidgetCard
      title="KKTC Güncel Akaryakıt"
      icon={<Fuel className="h-4 w-4" />}
      source={isLoading && source === "cached" ? "loading" : source}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
    >
      <Table>
        <TableBody>
          {ROWS.map(({ label, key }) => (
            <TableRow key={key}>
              <TableCell className="font-medium text-ink-2">{label}</TableCell>
              <TableCell className="tnum text-right font-bold text-ink">
                {isLoading ? (
                  <span className="skeleton ml-auto inline-block h-4 w-16" />
                ) : (
                  `${prices[key].toFixed(2)} ₺`
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </WidgetCard>
  );
}
