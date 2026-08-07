"""Fiyat tahmini — services/vehicleApi.ts::estimatePriceGBP()'nin birebir portu.
Bu bir gerçek piyasa fiyatı DEĞİL; `confidence:"baseline"` ile işaretlenir.
DB'de `manual`/`listing` kaydı varsa bu fonksiyon hiç çağrılmaz (bkz. pricing_lookup)."""

from __future__ import annotations

from datetime import datetime

_LUXURY_TOP = {"tesla", "porsche", "ferrari", "lamborghini", "bentley", "aston martin"}
_LUXURY_MID = {"bmw", "mercedes", "audi", "lexus", "land rover", "volvo"}


def estimate_price_gbp(
    make: str, model: str, year: int, cc: int, fuel_type: str
) -> int:
    full = f"{make} {model}".lower()
    age = datetime.now().year - year
    base = 18000

    if any(b in full for b in _LUXURY_TOP):
        base = 60000 if fuel_type == "Elektrik" else 85000
    elif any(b in full for b in _LUXURY_MID):
        base = 40000
    elif cc > 2000:
        base = 30000
    elif cc > 1600:
        base = 23000

    if fuel_type == "Elektrik":
        base = max(base, 32000)
    elif fuel_type == "Hibrit":
        base = max(base, 22000)

    depreciation = 0.92**age
    return round(base * depreciation)
