import { useState } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { PoundSterling, DollarSign, Euro, RefreshCw, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExchangeRatesTable() {
  const { rates, source, fetchedAt, isLoading, refresh } = useExchangeRate();
  const [amount, setAmount] = useState<string>("100");
  const [baseCurrency, setBaseCurrency] = useState<"GBP" | "USD" | "EUR" | "TRY">("GBP");

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Bilinmiyor";

  // Çeviri hesaplama
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

  return (
    <Card className="shadow-sm border-slate-200 mt-4">
      <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 rounded-t-xl">
        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <PoundSterling className="h-4 w-4 text-blue-500" />
          Canlı Döviz Kurları
        </CardTitle>
        <button
          onClick={refresh}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="Kurları Yenile"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm text-left">
          <tbody>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700 flex items-center gap-2">
                <PoundSterling className="h-3.5 w-3.5 text-slate-400" /> Sterlin (GBP)
              </td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{rates.gbp.toFixed(4)} ₺</td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700 flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Dolar (USD)
              </td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{rates.usd.toFixed(4)} ₺</td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-2.5 px-4 font-medium text-slate-700 flex items-center gap-2">
                <Euro className="h-3.5 w-3.5 text-slate-400" /> Euro (EUR)
              </td>
              <td className="py-2.5 px-4 text-right font-bold text-slate-900">{rates.eur.toFixed(4)} ₺</td>
            </tr>
          </tbody>
        </table>
        
        {/* Hızlı Çevirici */}
        <div className="bg-slate-50 p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-600 uppercase">Kur Çevirici</span>
          </div>
          <div className="flex gap-2 mb-3">
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="h-8 text-sm flex-1"
              placeholder="Miktar"
            />
            <Select value={baseCurrency} onValueChange={(val: any) => setBaseCurrency(val)}>
              <SelectTrigger className="w-24 h-8 text-xs font-semibold">
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
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {baseCurrency !== "GBP" && <div className="bg-white p-2 rounded border border-slate-200 text-center"><span className="text-slate-400 text-[10px] block mb-0.5">GBP</span><span className="font-bold">£{outGBP.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span></div>}
            {baseCurrency !== "USD" && <div className="bg-white p-2 rounded border border-slate-200 text-center"><span className="text-slate-400 text-[10px] block mb-0.5">USD</span><span className="font-bold">${outUSD.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span></div>}
            {baseCurrency !== "EUR" && <div className="bg-white p-2 rounded border border-slate-200 text-center"><span className="text-slate-400 text-[10px] block mb-0.5">EUR</span><span className="font-bold">€{outEUR.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span></div>}
            {baseCurrency !== "TRY" && <div className="bg-white p-2 rounded border border-slate-200 text-center"><span className="text-slate-400 text-[10px] block mb-0.5">TRY</span><span className="font-bold text-blue-600">₺{outTRY.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</span></div>}
          </div>
        </div>

        <div className="bg-slate-100 px-4 py-2 flex items-center justify-between text-[10px] text-slate-500 rounded-b-xl border-t border-slate-200">
          <div className="flex items-center gap-1.5">
            {source === "live" ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] px-1.5 py-0">Canlı Veri</Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0 flex items-center gap-1">
                <AlertTriangle className="h-2 w-2" /> Yedek
              </Badge>
            )}
          </div>
          <span className="font-medium">Son Güncelleme: {fetchedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
