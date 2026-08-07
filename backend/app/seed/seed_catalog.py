"""kktc_popular_cars.json'ı veritabanına yükler. Idempotent — birden fazla
çalıştırılabilir, mevcut kayıtları çoğaltmaz (unique constraint'lere güvenir).
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import SessionLocal, init_db
from app.models import Engine, Make, ModelYear, VehicleModel
from app.slug import slugify

SEED_FILE = Path(__file__).parent / "kktc_popular_cars.json"


def seed_if_empty(db: Session) -> None:
    if db.execute(select(Make)).first() is not None:
        return  # zaten tohumlanmış

    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))

    for make_name, models in data.items():
        make = Make(name=make_name, slug=slugify(make_name), source="seed")
        db.add(make)
        db.flush()

        for model_name, years in models.items():
            model = VehicleModel(
                make_id=make.id, name=model_name, slug=slugify(model_name), source="seed"
            )
            db.add(model)
            db.flush()

            for year_str, engines in years.items():
                model_year = ModelYear(model_id=model.id, year=int(year_str), source="seed")
                db.add(model_year)
                db.flush()

                for e in engines:
                    db.add(
                        Engine(
                            model_year_id=model_year.id,
                            cc=e["cc"],
                            fuel_type=e["fuelType"],
                            trim=e.get("trim", ""),
                            weight_kg=e["weightKg"],
                            fuel_consumption=e["fuelConsumption"],
                            label=e["label"],
                            source="seed",
                            confidence=1.0,
                        )
                    )

    db.commit()


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        count = db.execute(select(Make)).scalars().all()
        print(f"Tohumlama tamam: {len(count)} marka.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
