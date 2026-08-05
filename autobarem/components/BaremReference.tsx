"use client";

import { BAREMS, BASE_EMISSION_FEE } from "@/utils/taxCalculator";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

export function BaremReference() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-600">
          KKTC Seyrüsefer Vergisi Barem Tablosu
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {BAREMS.map((b) => (
          <div
            key={b.barem}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
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
              <span className="text-sm text-slate-600">{b.range}</span>
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {b.ratePerKg} TL/kg
            </span>
          </div>
        ))}
        <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
          <span className="text-xs text-blue-600 font-medium">
            + Sabit Çevre Katkı Payı (tüm baremlere eklenir)
          </span>
          <span className="text-xs font-bold text-blue-700">
            {BASE_EMISSION_FEE} TL
          </span>
        </div>
      </div>
    </div>
  );
}
