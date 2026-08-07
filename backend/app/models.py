"""SQLAlchemy tabloları."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CacheEntry(Base):
    """Yabancı servislerden çekilen verinin önbelleği (TTL + stale-while-error)."""

    __tablename__ = "cache_entries"

    key: Mapped[str] = mapped_column(String(200), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)
    source: Mapped[str] = mapped_column(String(20))  # "live" | "fallback" | "cached" | "stale"
    fetched_at: Mapped[datetime] = mapped_column(default=_now)
    last_error: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Make(Base):
    __tablename__ = "makes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    source: Mapped[str] = mapped_column(String(20), default="seed")

    models: Mapped[list["VehicleModel"]] = relationship(back_populates="make")


class VehicleModel(Base):
    """Ad çakışmasını önlemek için `Model` değil `VehicleModel` (Pydantic/SQLAlchemy Base ile
    karışmasın diye)."""

    __tablename__ = "models"
    __table_args__ = (UniqueConstraint("make_id", "slug", name="uq_model_make_slug"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    make_id: Mapped[int] = mapped_column(ForeignKey("makes.id"))
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), index=True)
    source: Mapped[str] = mapped_column(String(20), default="seed")

    make: Mapped[Make] = relationship(back_populates="models")
    years: Mapped[list["ModelYear"]] = relationship(back_populates="model")


class ModelYear(Base):
    __tablename__ = "model_years"
    __table_args__ = (UniqueConstraint("model_id", "year", name="uq_model_year"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    model_id: Mapped[int] = mapped_column(ForeignKey("models.id"))
    year: Mapped[int]
    source: Mapped[str] = mapped_column(String(20), default="seed")

    model: Mapped[VehicleModel] = relationship(back_populates="years")
    engines: Mapped[list["Engine"]] = relationship(back_populates="model_year")


class Engine(Base):
    __tablename__ = "engines"
    __table_args__ = (
        UniqueConstraint(
            "model_year_id", "cc", "fuel_type", "trim", name="uq_engine_variant"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    model_year_id: Mapped[int] = mapped_column(ForeignKey("model_years.id"))
    cc: Mapped[int]
    fuel_type: Mapped[str] = mapped_column(String(20))  # Benzin|Dizel|Hibrit|Elektrik
    trim: Mapped[str] = mapped_column(String(80), default="")
    # NULL = bilinmiyor. Sunum katmanında varsayılan uygulanır ama DB'de
    # gerçek ölçüm ile uydurma veri asla karıştırılmaz (ağırlık = vergi baremi).
    weight_kg: Mapped[int | None] = mapped_column(nullable=True)
    fuel_consumption: Mapped[float | None] = mapped_column(nullable=True)
    label: Mapped[str] = mapped_column(String(120))
    source: Mapped[str] = mapped_column(String(20), default="seed")  # seed|manual|carquery
    confidence: Mapped[float] = mapped_column(default=1.0)

    model_year: Mapped[ModelYear] = relationship(back_populates="engines")


class VehiclePrice(Base):
    """Fiyat katmanı — üç güven seviyesi: manual > listing > baseline.
    `confidence` string alanı frontend'e aynen geçer; API her zaman en yüksek
    güvenilirlikteki kaydı döner."""

    __tablename__ = "vehicle_prices"
    __table_args__ = (
        UniqueConstraint(
            "make_slug", "model_slug", "year", "cc", "fuel_type",
            name="uq_price_variant",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    make_slug: Mapped[str] = mapped_column(String(80), index=True)
    model_slug: Mapped[str] = mapped_column(String(80), index=True)
    year: Mapped[int]
    cc: Mapped[int]
    fuel_type: Mapped[str] = mapped_column(String(20))
    price_gbp: Mapped[int]
    confidence: Mapped[str] = mapped_column(String(20))  # manual|listing|baseline
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(default=_now, onupdate=_now)
