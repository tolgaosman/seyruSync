from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import catalog
from app.db import get_db
from app.schemas import EngineOption, EnginesResponse, MakesResponse, ModelsResponse, YearsResponse
from app.slug import slugify

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.get("/makes", response_model=MakesResponse)
async def get_makes(db: Session = Depends(get_db)) -> MakesResponse:
    local = catalog.catalog_makes(db)
    cq_items, cq_source = await catalog.carquery_makes(db)
    merged = sorted(set(local) | set(cq_items))
    source = "live" if cq_source == "live" else ("fallback" if not local else "cached")
    return MakesResponse(makes=merged, source=source)


@router.get("/models", response_model=ModelsResponse)
async def get_models(make: str, db: Session = Depends(get_db)) -> ModelsResponse:
    local = catalog.catalog_models(db, slugify(make))
    wd_items, wd_source = await catalog.wikidata_models(db, make)
    cq_items, cq_source = await catalog.carquery_models(db, make)
    merged = sorted(set(local) | set(wd_items) | set(cq_items))
    live = wd_source == "live" or cq_source == "live"
    source = "live" if live else ("fallback" if not local else "cached")
    return ModelsResponse(models=merged, source=source)


@router.get("/years", response_model=YearsResponse)
async def get_years(make: str, model: str, db: Session = Depends(get_db)) -> YearsResponse:
    local = catalog.catalog_years(db, slugify(make), slugify(model))
    if local:
        # Doğrulanmış katalogda varsa dış kaynağa hiç gidilmiyor —
        # frontend'deki kısa devre mantığının aynısı.
        return YearsResponse(years=local, source="cached")

    # Katalogda yok — Wikidata nesillerinin inception (P571) yıllarına düş.
    # Not: bunlar nesil-bazlı yıllar, yıllık değil. CarQuery years yine bağlanmadan kalır.
    wd_years, wd_source = await catalog.wikidata_years(db, make, model)
    if wd_years:
        return YearsResponse(years=sorted(wd_years, reverse=True), source=wd_source)

    return YearsResponse(years=[], source="fallback")


@router.get("/engines", response_model=EnginesResponse)
async def get_engines(
    make: str, model: str, year: int, db: Session = Depends(get_db)
) -> EnginesResponse:
    make_slug, model_slug = slugify(make), slugify(model)
    local = catalog.catalog_engines(db, make_slug, model_slug, year)

    if local:
        engines, source = local, "cached"
    else:
        # Yerel yoksa önce Wikidata, boşsa CarQuery. weightKg None ise ASLA burada
        # uydurulmaz — sadece sunum varsayılanı 1350 uygulanır (vergi baremi güvenliği).
        engines, source = await catalog.wikidata_engines(db, make, model, year)
        if not engines:
            engines, source = await catalog.carquery_engines(db, make, model, year)
        for e in engines:
            if e["weightKg"] is None:
                e["weightKg"] = 1350
            if e["fuelConsumption"] is None:
                e["fuelConsumption"] = 0.0 if e["fuelType"] == "Elektrik" else 7.0

    items = []
    for e in engines:
        price, confidence = catalog.lookup_price(db, make, model, year, e["cc"], e["fuelType"])
        items.append(
            EngineOption(
                cc=e["cc"],
                fuelType=e["fuelType"],
                trim=e["trim"],
                weightKg=e["weightKg"],
                fuelConsumption=e["fuelConsumption"],
                label=e["label"],
                priceGBP=price,
                priceConfidence=confidence,
            )
        )

    return EnginesResponse(engines=items, source=source)
