"""Pydantic yanıt modelleri — frontend tipleriyle alan adı bazında birebir."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Source = Literal["live", "fallback", "cached", "stale"]
FuelType = Literal["Benzin", "Dizel", "Hibrit", "Elektrik"]
PriceConfidence = Literal["manual", "listing", "baseline"]


class Rates(BaseModel):
    gbp: float
    usd: float
    eur: float


class RatesResponse(BaseModel):
    rates: Rates
    source: Source
    fetchedAt: datetime


class FuelPrices(BaseModel):
    oktan95: float
    oktan98: float
    euroDiesel: float
    gazyagi: float


class FuelResponse(BaseModel):
    prices: FuelPrices
    source: Source
    lastUpdated: str  # dd.mm.yyyy
    fetchedAt: datetime
    partial: bool = False


class MakesResponse(BaseModel):
    makes: list[str]
    source: Source


class ModelsResponse(BaseModel):
    models: list[str]
    source: Source


class YearsResponse(BaseModel):
    years: list[int]
    source: Source


class EngineOption(BaseModel):
    """Frontend'deki EngineOption ile birebir + isteğe bağlı fiyat alanları.
    Yeni alanlar opsiyonel olduğu için mevcut TS tipiyle geriye dönük uyumlu."""

    cc: int
    fuelType: FuelType
    trim: str
    weightKg: int
    fuelConsumption: float
    label: str
    priceGBP: int | None = None
    priceConfidence: PriceConfidence | None = None


class EnginesResponse(BaseModel):
    engines: list[EngineOption]
    source: Source


class PriceResponse(BaseModel):
    priceGBP: int
    confidence: PriceConfidence
    source: Source
    note: str | None = None


class AdminPriceIn(BaseModel):
    make: str
    model: str
    year: int
    cc: int
    fuelType: FuelType
    priceGBP: int
    note: str | None = None
