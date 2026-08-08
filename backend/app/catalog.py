"""Araç kataloğu — DB'deki doğrulanmış veri (tohum + elle giriş) ile
CarQuery'den gelen önbelleklenmiş veriyi birleştirir.

CarQuery sonuçları kataloğa OTOMATİK YAZILMAZ, sadece cache_entries'te durur.
Gerekçe: CarQuery'de ağırlık çoğu zaman eksik ve bu eksiklik sessizce 1350 kg'a
düşüyor — bu değer doğrudan vergi baremini belirliyor. Katalog yalnızca
doğrulanmış veriyle büyür; CarQuery yalnızca "bilinmeyen" araçlar için
son çare olarak kullanılır.
"""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.cache import get_or_refresh
from app.models import Make, ModelYear, VehicleModel, VehiclePrice
from app.pricing import estimate_price_gbp
from app.providers import carquery, wikidata
from app.slug import slugify

CARQUERY_TTL = timedelta(days=7)
CARQUERY_ENGINES_TTL = timedelta(days=30)
WIKIDATA_TTL = timedelta(days=14)
WIKIDATA_ENGINES_TTL = timedelta(days=30)


def catalog_makes(db: Session) -> list[str]:
    return [m.name for m in db.execute(select(Make)).scalars().all()]


def catalog_models(db: Session, make_slug: str) -> list[str]:
    make = db.execute(select(Make).where(Make.slug == make_slug)).scalar_one_or_none()
    if make is None:
        return []
    return [m.name for m in make.models]


def catalog_years(db: Session, make_slug: str, model_slug: str) -> list[int]:
    model = db.execute(
        select(VehicleModel)
        .join(Make)
        .where(Make.slug == make_slug, VehicleModel.slug == model_slug)
    ).scalar_one_or_none()
    if model is None:
        return []
    return sorted((y.year for y in model.years), reverse=True)


def catalog_engines(db: Session, make_slug: str, model_slug: str, year: int) -> list[dict]:
    my = db.execute(
        select(ModelYear)
        .join(VehicleModel)
        .join(Make)
        .where(Make.slug == make_slug, VehicleModel.slug == model_slug, ModelYear.year == year)
    ).scalar_one_or_none()
    if my is None:
        return []

    out = []
    for e in my.engines:
        out.append(
            {
                "cc": e.cc,
                "fuelType": e.fuel_type,
                "trim": e.trim,
                "weightKg": e.weight_kg if e.weight_kg is not None else 1350,
                "fuelConsumption": (
                    e.fuel_consumption if e.fuel_consumption is not None else 7.0
                ),
                "label": e.label,
            }
        )
    return out


async def carquery_makes(db: Session) -> tuple[list[str], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key="carquery:makes",
        ttl=CARQUERY_TTL,
        fetcher=lambda: _wrap(carquery.fetch_makes()),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def carquery_models(db: Session, make: str) -> tuple[list[str], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key=f"carquery:models:{slugify(make)}",
        ttl=CARQUERY_TTL,
        fetcher=lambda: _wrap(carquery.fetch_models(make)),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def carquery_engines(
    db: Session, make: str, model: str, year: int
) -> tuple[list[dict], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key=f"carquery:engines:{slugify(make)}:{slugify(model)}:{year}",
        ttl=CARQUERY_ENGINES_TTL,
        fetcher=lambda: _wrap_trims(make, model, year),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def wikidata_makes(db: Session) -> tuple[list[str], str]:
    # Pragmatik: Wikidata global marka listesi vermiyor (fetch_makes -> []).
    # Sarmalayıcı simetri için var; makes endpoint'inde kullanılmıyor.
    payload, source, _ = await get_or_refresh(
        db,
        key="wikidata:makes",
        ttl=WIKIDATA_TTL,
        fetcher=lambda: _wrap(wikidata.fetch_makes()),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def wikidata_models(db: Session, make: str) -> tuple[list[str], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key=f"wikidata:models:{slugify(make)}",
        ttl=WIKIDATA_TTL,
        fetcher=lambda: _wrap(wikidata.fetch_models(make)),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def wikidata_years(db: Session, make: str, model: str) -> tuple[list[int], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key=f"wikidata:years:{slugify(make)}:{slugify(model)}",
        ttl=WIKIDATA_TTL,
        fetcher=lambda: _wrap(wikidata.fetch_years(make, model)),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def wikidata_engines(
    db: Session, make: str, model: str, year: int
) -> tuple[list[dict], str]:
    payload, source, _ = await get_or_refresh(
        db,
        key=f"wikidata:engines:{slugify(make)}:{slugify(model)}:{year}",
        ttl=WIKIDATA_ENGINES_TTL,
        fetcher=lambda: _wrap(wikidata.fetch_engines(make, model, year)),
        fallback_payload={"items": []},
        fallback_source="fallback",
    )
    return payload["items"], source


async def _wrap(coro) -> tuple[dict, str]:
    items = await coro
    return {"items": items}, "live"


async def _wrap_trims(make: str, model: str, year: int) -> tuple[dict, str]:
    trims = await carquery.fetch_trims(make, model, year)
    engines = carquery.trims_to_engines(trims)
    return {"items": engines}, "live"


def lookup_price(
    db: Session, make: str, model: str, year: int, cc: int, fuel_type: str
) -> tuple[int, str]:
    """(fiyat, confidence) döner. En yüksek güvenilirlikteki kayıt önce denenir;
    hiçbiri yoksa sezgisel taban değere düşer."""

    make_slug, model_slug = slugify(make), slugify(model)

    rows = db.execute(
        select(VehiclePrice).where(
            VehiclePrice.make_slug == make_slug,
            VehiclePrice.model_slug == model_slug,
            VehiclePrice.year == year,
            VehiclePrice.cc == cc,
            VehiclePrice.fuel_type == fuel_type,
        )
    ).scalars().all()

    if rows:
        priority = {"manual": 0, "listing": 1, "baseline": 2}
        best = min(rows, key=lambda r: priority.get(r.confidence, 9))
        return best.price_gbp, best.confidence

    return estimate_price_gbp(make, model, year, cc, fuel_type), "baseline"
