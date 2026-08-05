"use client";

import { BAREMS, BASE_EMISSION_FEE } from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export function BaremReference() {
  return (
    <div className="rounded-2xl border border-[#e5e2d8] bg-white overflow-hidden shadow-sm">
      <div className="bg-[#f0eee6] border-b border-[#e5e2d8] px-4 py-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-[#063b28]" />
        <span className="text-xs font-bold text-[#063b28] uppercase tracking-wider">
          KKTC Seyrüsefer Vergisi Barem Tablosu
        </span>
      </div>
      <div className="divide-y divide-[#e5e2d8]/60">
        {BAREMS.map((b) => (
          <div
            key={b.barem}
            className="flex items-center justify-between px-4 py-3 hover:bg-[#f6f5f0] transition-colors"
          >
            <div className="flex items-center gap-2.5">
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
              <span className="text-xs text-[#68706b]">{b.range}</span>
            </div>
            <span className="font-serif text-sm font-bold text-[#111814]">
              {b.ratePerKg} ₺/kg
            </span>
          </div>
        ))}
        <div className="px-4 py-3 bg-[#f0eee6]/70 flex items-center justify-between">
          <span className="text-xs text-[#68706b] font-medium">
            + Sabit Çevre Katkı Payı (tüm araçlara)
          </span>
          <span className="font-serif text-sm font-bold text-[#063b28]">
            {BASE_EMISSION_FEE} ₺
          </span>
        </div>
      </div>
    </div>
  );
}
