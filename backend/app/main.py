from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import SessionLocal, init_db
from app.routers import admin, fuel, health, rates, vehicles
from app.seed.seed_catalog import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="AutoCalc KKTC Backend", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "PUT"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(rates.router)
app.include_router(fuel.router)
app.include_router(vehicles.router)

# Admin uçları yalnızca ADMIN_TOKEN tanımlıysa mount edilir — tanımsızken
# 404 verir, 401 vermez, böylece yapılandırılmamış bir deploy hiçbir şey ifşa etmez.
if settings.admin_token:
    app.include_router(admin.router)
