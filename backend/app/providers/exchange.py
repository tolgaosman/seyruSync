"""Döviz kuru sağlayıcıları — hooks/useExchangeRate.ts'in sunucu tarafı portu.
İki sağlayıcı sırayla denenir, ikisi de USD tabanlı çapraz kur matematiği kullanır."""

from __future__ import annotations

import httpx

FALLBACK_RATES = {"gbp": 45.2, "usd": 35.1, "eur": 38.5}

_TIMEOUT = httpx.Timeout(8.0)


async def _provider_open_er_api(client: httpx.AsyncClient) -> dict | None:
    res = await client.get("https://open.er-api.com/v6/latest/USD", timeout=_TIMEOUT)
    if res.status_code != 200:
        return None
    data = res.json()
    rates = data.get("rates", {})
    try_rate, gbp_rate, eur_rate = rates.get("TRY"), rates.get("GBP"), rates.get("EUR")
    if not (try_rate and gbp_rate and eur_rate):
        return None
    return {
        "usd": round(try_rate, 4),
        "gbp": round(try_rate / gbp_rate, 4),
        "eur": round(try_rate / eur_rate, 4),
    }


async def _provider_fawazahmed0(client: httpx.AsyncClient) -> dict | None:
    res = await client.get(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
        timeout=_TIMEOUT,
    )
    if res.status_code != 200:
        return None
    data = res.json()
    usd = data.get("usd", {})
    try_rate, gbp_rate, eur_rate = usd.get("try"), usd.get("gbp"), usd.get("eur")
    if not (try_rate and gbp_rate and eur_rate):
        return None
    return {
        "usd": round(try_rate, 4),
        "gbp": round(try_rate / gbp_rate, 4),
        "eur": round(try_rate / eur_rate, 4),
    }


async def fetch_rates() -> tuple[dict, str]:
    """Döner: ({"rates": {...}}, "live"). Her iki sağlayıcı da başarısızsa raise eder —
    çağıran taraf (cache.get_or_refresh) bunu stale/fallback'e çevirir."""

    async with httpx.AsyncClient(headers={"User-Agent": "autocalc-backend/0.1"}) as client:
        for provider in (_provider_open_er_api, _provider_fawazahmed0):
            try:
                rates = await provider(client)
            except (httpx.HTTPError, ValueError, KeyError):
                rates = None
            if rates:
                return {"rates": rates}, "live"

    raise RuntimeError("Her iki döviz kuru sağlayıcısı da başarısız oldu")
