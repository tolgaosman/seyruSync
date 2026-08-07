"""Elle fiyat girişi. Token boşsa bu router hiç mount edilmez (bkz. main.py)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db
from app.models import VehiclePrice
from app.schemas import AdminPriceIn
from app.slug import slugify

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _check_token(x_admin_token: str = Header(default="")) -> None:
    settings = get_settings()
    if not settings.admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Geçersiz veya eksik admin token")


@router.put("/prices", dependencies=[Depends(_check_token)])
def upsert_price(payload: AdminPriceIn, db: Session = Depends(get_db)) -> dict:
    make_slug, model_slug = slugify(payload.make), slugify(payload.model)
    row = db.execute(
        select(VehiclePrice).where(
            VehiclePrice.make_slug == make_slug,
            VehiclePrice.model_slug == model_slug,
            VehiclePrice.year == payload.year,
            VehiclePrice.cc == payload.cc,
            VehiclePrice.fuel_type == payload.fuelType,
        )
    ).scalar_one_or_none()

    if row is None:
        row = VehiclePrice(
            make_slug=make_slug,
            model_slug=model_slug,
            year=payload.year,
            cc=payload.cc,
            fuel_type=payload.fuelType,
        )
        db.add(row)

    row.price_gbp = payload.priceGBP
    row.confidence = "manual"
    row.note = payload.note
    db.commit()
    return {"ok": True, "id": row.id}


@router.get("/prices", dependencies=[Depends(_check_token)])
def list_prices(make: str | None = None, db: Session = Depends(get_db)) -> list[dict]:
    q = select(VehiclePrice)
    if make:
        q = q.where(VehiclePrice.make_slug == slugify(make))
    rows = db.execute(q).scalars().all()
    return [
        {
            "id": r.id,
            "makeSlug": r.make_slug,
            "modelSlug": r.model_slug,
            "year": r.year,
            "cc": r.cc,
            "fuelType": r.fuel_type,
            "priceGBP": r.price_gbp,
            "confidence": r.confidence,
            "note": r.note,
        }
        for r in rows
    ]
