"""CarQuery — services/vehicleApi.ts'in sunucu tarafı portu.
Sunucudan doğrudan çekilir; tarayıcıdaki CORS proxy merdivenine gerek yok."""

from __future__ import annotations

import json
import re

import httpx

BASE = "https://www.carqueryapi.com/api/0.3/"

_JSONP_STRIP_HEAD = re.compile(r"^[^{\[]*")
_JSONP_STRIP_TAIL = re.compile(r"[^}\]]*$")

_TIMEOUT = httpx.Timeout(8.0)


def unwrap_jsonp(text: str) -> dict:
    """CarQuery `callback({...});` sarmalayıcısını temizler. Düz JSON'da da çalışır."""

    cleaned = _JSONP_STRIP_HEAD.sub("", text)
    cleaned = _JSONP_STRIP_TAIL.sub("", cleaned)
    return json.loads(cleaned)


def normalize_fuel_type(raw: str | None) -> str:
    low = (raw or "").lower()
    if "electric" in low:
        return "Elektrik"
    if "hybrid" in low:
        return "Hibrit"
    if "diesel" in low:
        return "Dizel"
    return "Benzin"


def trims_to_engines(trims: list[dict]) -> list[dict]:
    """CarQuery trim listesini EngineOption[]'a çevirir. weight_kg eksikse
    None bırakılır — 1350 varsayılanı sadece sunum katmanında uygulanır,
    burada asla üretilmez (ağırlık = vergi baremi)."""

    seen: set[str] = set()
    engines: list[dict] = []
    for t in trims:
        cc = int(t.get("model_engine_cc") or 0)
        fuel_type = normalize_fuel_type(t.get("model_fuel_type"))
        key = f"{cc}-{fuel_type}"
        if key in seen:
            continue
        seen.add(key)

        weight_raw = t.get("model_weight_kg")
        weight_kg = int(float(weight_raw)) if weight_raw else None

        cons_raw = t.get("model_lkm_mixed")
        fuel_consumption = float(cons_raw) if cons_raw else None

        cc_label = f"{cc} cc" if cc > 0 else "Bilinmiyor"
        label = "Full Elektrik" if fuel_type == "Elektrik" else f"{cc_label} {fuel_type}"

        engines.append(
            {
                "cc": cc,
                "fuelType": fuel_type,
                "trim": t.get("model_trim") or "",
                "weightKg": weight_kg,
                "fuelConsumption": fuel_consumption,
                "label": label,
            }
        )

    engines.sort(key=lambda e: e["cc"], reverse=True)
    return engines


async def _get(client: httpx.AsyncClient, params: dict) -> dict:
    res = await client.get(BASE, params=params, timeout=_TIMEOUT)
    res.raise_for_status()
    return unwrap_jsonp(res.text)


async def fetch_makes() -> list[str]:
    async with httpx.AsyncClient(headers={"User-Agent": "autocalc-backend/0.1"}) as client:
        data = await _get(client, {"cmd": "getMakes"})
    return [m["make_display"] for m in data.get("Makes", [])]


async def fetch_models(make: str) -> list[str]:
    async with httpx.AsyncClient(headers={"User-Agent": "autocalc-backend/0.1"}) as client:
        data = await _get(client, {"cmd": "getModels", "make": make.lower()})
    return [m["model_name"] for m in data.get("Models", [])]


async def fetch_trims(make: str, model: str, year: int | None = None) -> list[dict]:
    params = {"cmd": "getTrims", "make": make.lower(), "model": model.lower()}
    if year:
        params["year"] = str(year)
    async with httpx.AsyncClient(headers={"User-Agent": "autocalc-backend/0.1"}) as client:
        data = await _get(client, params)
    return data.get("Trims", [])
