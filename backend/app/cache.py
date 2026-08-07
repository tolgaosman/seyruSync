"""Lazy-refresh önbellek: TTL içindeyse doğrudan ver, bayatsa yenilemeyi dene,
yenileme başarısız olursa (upstream çökük/yavaş) eski değeri "stale" olarak ver.
Hiçbir durumda hata fırlatmaz — çağıran taraf her zaman bir payload alır.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import CacheEntry

logger = logging.getLogger("autocalc.cache")

Fetcher = Callable[[], Awaitable[tuple[dict, str]]]  # -> (payload, source_label)


async def get_or_refresh(
    db: Session,
    key: str,
    ttl: timedelta,
    fetcher: Fetcher,
    fallback_payload: dict,
    fallback_source: str = "fallback",
) -> tuple[dict, str, datetime]:
    """Döner: (payload, source, fetched_at)."""

    entry = db.get(CacheEntry, key)
    now = datetime.now(timezone.utc)

    if entry is not None:
        fetched_at = entry.fetched_at
        if fetched_at.tzinfo is None:
            fetched_at = fetched_at.replace(tzinfo=timezone.utc)
        if now - fetched_at < ttl:
            return entry.payload, entry.source, fetched_at

    # Bayat ya da hiç yok — yenilemeyi dene.
    try:
        payload, source = await fetcher()
        if entry is None:
            entry = CacheEntry(key=key)
            db.add(entry)
        entry.payload = payload
        entry.source = source
        entry.fetched_at = now
        entry.last_error = None
        db.commit()
        return payload, source, now
    except Exception as exc:  # noqa: BLE001 — upstream'in her türlü hatası burada yutulur
        logger.warning("cache refresh failed for %s: %s", key, exc)
        if entry is not None:
            entry.last_error = str(exc)[:500]
            db.commit()
            fetched_at = entry.fetched_at
            if fetched_at.tzinfo is None:
                fetched_at = fetched_at.replace(tzinfo=timezone.utc)
            return entry.payload, "stale", fetched_at
        return fallback_payload, fallback_source, now
