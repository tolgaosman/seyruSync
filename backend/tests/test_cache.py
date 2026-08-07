from datetime import timedelta

import pytest

from app.cache import get_or_refresh


@pytest.mark.asyncio
async def test_fresh_entry_served_without_refetch(db_session):
    calls = 0

    async def fetcher():
        nonlocal calls
        calls += 1
        return {"v": 1}, "live"

    payload, source, _ = await get_or_refresh(
        db_session, "k", timedelta(minutes=15), fetcher, {"v": 0}, "fallback"
    )
    assert payload == {"v": 1} and source == "live" and calls == 1

    # İkinci çağrı TTL içinde — fetcher tekrar çağrılmamalı.
    payload2, source2, _ = await get_or_refresh(
        db_session, "k", timedelta(minutes=15), fetcher, {"v": 0}, "fallback"
    )
    assert payload2 == {"v": 1} and calls == 1


@pytest.mark.asyncio
async def test_failed_refresh_serves_stale_value(db_session):
    async def good_fetcher():
        return {"v": "good"}, "live"

    async def bad_fetcher():
        raise RuntimeError("upstream down")

    await get_or_refresh(
        db_session, "k", timedelta(seconds=-1), good_fetcher, {"v": "fallback"}, "fallback"
    )

    payload, source, _ = await get_or_refresh(
        db_session, "k", timedelta(seconds=-1), bad_fetcher, {"v": "fallback"}, "fallback"
    )
    assert payload == {"v": "good"}
    assert source == "stale"


@pytest.mark.asyncio
async def test_no_entry_and_fetch_fails_uses_fallback(db_session):
    async def bad_fetcher():
        raise RuntimeError("upstream down")

    payload, source, _ = await get_or_refresh(
        db_session, "brandnew", timedelta(minutes=15), bad_fetcher, {"v": "fallback"}, "fallback"
    )
    assert payload == {"v": "fallback"}
    assert source == "fallback"
