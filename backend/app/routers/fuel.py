from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.cache import get_or_refresh
from app.db import get_db
from app.providers.fuel_scraper import FALLBACK_PRICES, fetch_fuel_prices
from app.schemas import FuelResponse

router = APIRouter(tags=["fuel"])

TTL = timedelta(hours=12)


@router.get("/api/fuel", response_model=FuelResponse)
async def get_fuel(db: Session = Depends(get_db)) -> FuelResponse:
    payload, source, fetched_at = await get_or_refresh(
        db,
        key="fuel",
        ttl=TTL,
        fetcher=fetch_fuel_prices,
        fallback_payload={
            "prices": FALLBACK_PRICES,
            "lastUpdated": "05.08.2026",
            "partial": False,
        },
        fallback_source="cached",
    )
    return FuelResponse(
        prices=payload["prices"],
        source=source,
        lastUpdated=payload["lastUpdated"],
        fetchedAt=fetched_at,
        partial=payload.get("partial", False),
    )
