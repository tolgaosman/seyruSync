import { useFuelPrice } from "@/hooks/useFuelPrice";
import { Fuel, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FuelPricesTable() {
  const { prices, source, lastUpdated, isLoading, refresh } = useFuelPrice();

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Fuel className="h-4 w-4 text-emerald-500" />
          KKTC Güncel Akaryakıt
        </CardTitle>
        <button
          onClick={refresh}
          className="text-slate-400 hover:text-emerald-600 transition-colors"
          title="Fiyatları Yenile"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm text-left">
          <tbody>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700">95 Oktan</td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{prices.oktan95.toFixed(2)} ₺</td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700">98 Oktan</td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{prices.oktan98.toFixed(2)} ₺</td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700">Euro Diesel</td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{prices.euroDiesel.toFixed(2)} ₺</td>
            </tr>
            <tr className="hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700">Gazyağı</td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{prices.gazyagi.toFixed(2)} ₺</td>
            </tr>
          </tbody>
        </table>
        
        <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 rounded-b-xl">
          <div className="flex items-center gap-1.5">
            {source === "live" ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">Canlı Veri</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 flex items-center gap-1">
                <AlertTriangle className="h-2 w-2" /> Yedek
              </Badge>
            )}
          </div>
          <span className="font-medium">Son Güncelleme: {lastUpdated}</span>
        </div>
      </CardContent>
    </Card>
  );
}
