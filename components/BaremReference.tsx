"use client";

import {
  BAREMS,
  BASE_EMISSION_FEE,
  getBaremColors,
} from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

export function BaremReference() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Info className="h-4 w-4 text-accent-2" />
        <h3 className="text-sm font-bold text-ink">Barem Tablosu</h3>
      </div>

      <div className="flex-1 divide-y divide-line">
        {BAREMS.map((b) => {
          const colors = getBaremColors(b.barem);
          return (
            <div
              key={b.barem}
              className="relative flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-fill"
            >
              {/* Barem renginde sol ray */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-0.5"
                style={{ backgroundColor: colors.fill }}
              />
              <div className="flex min-w-0 items-center gap-2.5">
                <Badge
                  variant={
                    `barem${b.barem}` as
                      | "barem1"
                      | "barem2"
                      | "barem3"
                      | "barem4"
                  }
                >
                  {b.label}
                </Badge>
                <span className="tnum truncate text-xs text-ink-2">
                  {b.range}
                </span>
              </div>
              <span className="tnum shrink-0 text-sm font-semibold text-ink">
                {b.ratePerKg}
                <span className="ml-1 text-xs font-normal text-ink-3">
                  TL/kg
                </span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-accent/25 bg-accent/10 px-4 py-3">
        <span className="text-[11px] font-medium text-accent-2">
          + Sabit Çevre Katkı Payı (tüm baremlere eklenir)
        </span>
        <span className="tnum shrink-0 text-xs font-bold text-accent-2">
          {BASE_EMISSION_FEE} TL
        </span>
      </div>
    </Card>
  );
}
