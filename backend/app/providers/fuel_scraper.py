"""KKTC akaryakıt fiyatı — hooks/useFuelPrice.ts'in sunucu tarafı portu.

Ayrıştırma saf bir fonksiyon (`parse_fuel_html`) olarak tutuluyor ki ağ
olmadan test edilebilsin — bu dosyanın en kırılgan kısmı regex'ler.

JS'teki `.*?` satır sonunda durur (JS'te `.` yeni satırı kapsamaz);
Python'da aynı davranış için `re.DOTALL` KULLANILMIYOR — bilerek.
"""

from __future__ import annotations

import re
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

TARGET_URL = "https://www.triprentacar.com.tr/kibris-ta-petrol-fiyatlari.html"

FALLBACK_PRICES = {
    "oktan95": 61.12,
    "oktan98": 62.50,
    "euroDiesel": 58.20,
    "gazyagi": 58.00,
}

_TAG = r"(?:<strong>|<b>|<td>)"

_PATTERNS: dict[str, list[str]] = {
    "oktan95": [rf"Kurşunsuz\s*95.*?{_TAG}\s*([\d.,]+)", rf"95\s*oktan.*?{_TAG}\s*([\d.,]+)"],
    "oktan98": [rf"Kurşunsuz\s*98.*?{_TAG}\s*([\d.,]+)", rf"98\s*oktan.*?{_TAG}\s*([\d.,]+)"],
    "euroDiesel": [rf"Euro\s*Diesel.*?{_TAG}\s*([\d.,]+)", rf"Euro\s*Dizel.*?{_TAG}\s*([\d.,]+)"],
    "gazyagi": [rf"Gazyağı.*?{_TAG}\s*([\d.,]+)"],
}


def _extract(html: str, patterns: list[str]) -> float | None:
    for pattern in patterns:
        m = re.search(pattern, html, re.IGNORECASE)
        if not m:
            continue
        raw = m.group(1).replace(",", ".", 1)
        try:
            value = float(raw)
        except ValueError:
            continue
        if 20 < value < 200:
            return value
    return None


def parse_fuel_html(html: str) -> dict | None:
    """HTML'den fiyatları çıkarır. p95 bulunamazsa None döner (JS ile aynı davranış:
    diğer üçü p95'ten türetilir, o yüzden p95 zorunlu)."""

    p95 = _extract(html, _PATTERNS["oktan95"])
    if p95 is None:
        return None

    p98 = _extract(html, _PATTERNS["oktan98"])
    diesel = _extract(html, _PATTERNS["euroDiesel"])
    gaz = _extract(html, _PATTERNS["gazyagi"])

    return {
        "oktan95": p95,
        "oktan98": p98 if p98 is not None else round(p95 + 1.38, 2),
        "euroDiesel": diesel if diesel is not None else round(p95 - 2.92, 2),
        "gazyagi": gaz if gaz is not None else round(p95 - 3.12, 2),
        "partial": p98 is None or diesel is None or gaz is None,
    }


def _format_date() -> str:
    now = datetime.now(ZoneInfo("Europe/Istanbul"))
    return now.strftime("%d.%m.%Y")


async def fetch_fuel_prices() -> tuple[dict, str]:
    """Döner: ({"prices": {...}, "lastUpdated": ..., "partial": bool}, "live").
    Başarısız olursa raise eder — cache.get_or_refresh stale/cached'e çevirir."""

    async with httpx.AsyncClient(
        headers={"User-Agent": "autocalc-backend/0.1"}, timeout=httpx.Timeout(10.0)
    ) as client:
        res = await client.get(TARGET_URL)
        if res.status_code != 200:
            raise RuntimeError(f"Yakıt sayfası {res.status_code} döndü")
        parsed = parse_fuel_html(res.text)
        if parsed is None:
            raise RuntimeError("Yakıt sayfasından 95 oktan fiyatı ayıklanamadı")

    partial = parsed.pop("partial")
    return (
        {"prices": parsed, "lastUpdated": _format_date(), "partial": partial},
        "live",
    )
