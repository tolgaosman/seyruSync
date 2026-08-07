from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.cache import get_or_refresh
from app.db import get_db
from app.providers.exchange import FALLBACK_RATES, fetch_rates
from app.schemas import RatesResponse

router = APIRouter(tags=["rates"])

TTL = timedelta(minutes=15)


@router.get("/api/rates", response_model=RatesResponse)
async def get_rates(db: Session = Depends(get_db)) -> RatesResponse:
    payload, source, fetched_at = await get_or_refresh(
        db,
        key="rates",
        ttl=TTL,
        fetcher=fetch_rates,
        fallback_payload={"rates": FALLBACK_RATES},
        fallback_source="fallback",
    )
    return RatesResponse(rates=payload["rates"], source=source, fetchedAt=fetched_at)
