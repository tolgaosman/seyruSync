"""Wikidata — model/yıl/motor kapsamını genişleten veri kaynağı.
CarQuery'den ÖNCE denenir. Her şey JSON döner (SPARQL + wbsearchentities),
bu yüzden httpx tek başına yeter; HTML kazıma / ek bağımlılık yok.

Kritik kural: ağırlık (weightKg) vergi baremini belirler. Wikidata ağırlık
vermezse None bırakılır, ASLA uydurulmaz — carquery.trims_to_engines ile aynı
politika. Sunum katmanı (routers/vehicles.py) None -> 1350 varsayılanını uygular.

Wikidata gerçeği: üst-seviye model varlığında (ör. Toyota Corolla) kütle/hacim/nesil
yoktur; spec — varsa — ayrı nesil varlıklarında (ör. "Toyota Corolla (E210)") durur ve
ağırlık orada bile çoğu zaman eksiktir. Bu yüzden nesilleri etiket-öneki ile bulup
inception + spec'leri tek sorguda çekiyoruz.
"""

from __future__ import annotations

import httpx

from app.providers import carquery

SPARQL = "https://query.wikidata.org/sparql"
WBSEARCH = "https://www.wikidata.org/w/api.php"

# Wikimedia politikası: açıklayıcı User-Agent + iletişim zorunlu (yoksa 403).
_UA = "autocalc-backend/0.1 (https://github.com/tolgaosman/autoCalc; tolgaosmanfly@gmail.com)"
_HEADERS = {"User-Agent": _UA, "Accept": "application/sparql-results+json"}

# Genel timeout; engines yolu tek sorguya indirgendiği için ayrıca sıkmaya gerek kalmadı.
_TIMEOUT = httpx.Timeout(8.0)

# Model LİSTESİ için sınıf filtresi: P176 sonuçları motor/yazılım gibi gürültü
# içerir. Doğrudan P31'i şu sınıflarla eşliyoruz (canlı doğrulama):
#   Q59773381 otomobil model serisi — ana modellerin çoğu bu tipte
#   Q1420      motorlu otomobil
#   Q3231690   otomobil modeli
# Bu üçlü Toyota için ~575 gerçek model/nesil döndürüyor (Corolla, Camry, RAV4,
# Hilux, Prius, Land Cruiser…). Sadece Q1420 çoğunu kaçırıyor; Q42889/vehicle +
# P279* ise WDQS'te timeout'a düşüyor. Bu yüzden düz P31 + VALUES kullanıyoruz.
VEHICLE_CLASSES = ["wd:Q59773381", "wd:Q1420", "wd:Q3231690"]
_CLASS_VALUES = " ".join(VEHICLE_CLASSES)

_DESC_HINTS = ("manufacturer", "company", "automobile", "car maker", "marque")


async def _sparql(query: str) -> list[dict]:
    """SPARQL sorgusunu çalıştırıp bindings listesini döner. Hata fırlatabilir —
    çağıran get_or_refresh yutup cache'i stale işaretler."""

    async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT) as client:
        res = await client.get(SPARQL, params={"query": query, "format": "json"})
        res.raise_for_status()
        data = res.json()
    return data.get("results", {}).get("bindings", [])


def _val(row: dict, key: str) -> str | None:
    node = row.get(key)
    return node.get("value") if node else None


def _qid(uri: str) -> str:
    """`http://www.wikidata.org/entity/Q123` -> `Q123`."""
    return uri.rsplit("/", 1)[-1]


async def resolve_make_qid(make: str) -> str | None:
    """Marka adını Q-id'ye çevirir. Eşleşme yoksa None (hata değil)."""

    params = {
        "action": "wbsearchentities",
        "search": make,
        "language": "en",
        "type": "item",
        "format": "json",
        "limit": 5,
    }
    async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT) as client:
        res = await client.get(WBSEARCH, params=params)
        res.raise_for_status()
        results = res.json().get("search", [])

    if not results:
        return None

    # Belirsizliği azalt: description'ı üretici/şirket çağrıştıranı tercih et
    # (ör. "Tesla" kişi/yer değil, otomobil şirketi).
    for item in results:
        desc = (item.get("description") or "").lower()
        if any(hint in desc for hint in _DESC_HINTS):
            return item["id"]
    return results[0]["id"]


async def fetch_models_for_qid(make_qid: str) -> list[dict]:
    """Bir markanın araç-sınıfı model varlıkları. -> [{"qid","name"}], adına göre sıralı."""

    query = f"""
SELECT DISTINCT ?model ?modelLabel WHERE {{
  ?model wdt:P176 wd:{make_qid} .
  ?model wdt:P31 ?c .
  VALUES ?c {{ {_CLASS_VALUES} }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
ORDER BY ?modelLabel
LIMIT 600
"""
    out: list[dict] = []
    for row in await _sparql(query):
        uri = _val(row, "model")
        name = _val(row, "modelLabel")
        if not uri or not name:
            continue
        qid = _qid(uri)
        # Etiket hâlâ Q-id ise (etiketsiz varlık) atla.
        if name == qid:
            continue
        out.append({"qid": qid, "name": name})
    return out


async def _fetch_generation_rows(make_qid: str, model_name: str) -> list[dict]:
    """Bir modelin nesillerini + inception + ağırlık/hacim spec'lerini TEK sorguda
    çeker. Nesiller ayrı varlıklardır ve üst model onlara P527 ile bağlanmaz; bu
    yüzden aynı üreticinin, etiketi model adını İÇEREN varlıklarını eşliyoruz.

    Not: etiketler make-önekli ("Toyota Corolla ..."), o yüzden STRSTARTS değil
    CONTAINS kullanılır. Sınıf filtresi kasıtlı YOK — canlı doğrulamada P31/P279*
    "otomobil model serisi" nesillerini eliyor ve verinin çoğunu düşürüyordu;
    P176 + model-adı eşleşmesi zaten gürültüyü sınırlıyor."""

    # SPARQL string literalinde çift tırnağı kaçır.
    safe = model_name.replace('"', '\\"').lower()
    # Not: motor hacmi (displacement) Wikidata'da model/nesil varlığında neredeyse
    # hiç bulunmaz (ayrı motor varlıklarında durur), o yüzden çekilmiyor — cc=0
    # kalır ve label "Bilinmiyor" olur. Yakıt tipi de güvenilir alan olmadığından
    # varsayılan Benzin'e düşer (sunum). Wikidata'nın asıl katkısı: model+yıl+ağırlık.
    query = f"""
SELECT ?e ?eLabel ?inception ?mass ?curb WHERE {{
  ?e wdt:P176 wd:{make_qid} .
  ?e rdfs:label ?lbl .
  FILTER(LANG(?lbl) = "en")
  FILTER(CONTAINS(LCASE(?lbl), "{safe}"))
  OPTIONAL {{ ?e wdt:P571 ?inception . }}
  OPTIONAL {{ ?e wdt:P2067 ?mass . }}
  OPTIONAL {{ ?e wdt:P4020 ?curb . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
LIMIT 200
"""
    return await _sparql(query)


def _year_of(row: dict) -> int | None:
    raw = _val(row, "inception")
    if not raw or len(raw) < 4 or not raw[:4].isdigit():
        return None
    return int(raw[:4])


def _weight_of(row: dict) -> int | None:
    """Önce curb (P4020), sonra mass (P2067). İkisi de yoksa None — asla uydurma."""
    for key in ("curb", "mass"):
        raw = _val(row, key)
        if raw:
            try:
                return int(float(raw))
            except ValueError:
                continue
    return None


def _row_to_engine(row: dict) -> dict:
    # cc yok (yukarıdaki nota bak) -> 0. Yakıt için tek ipucu varlık etiketi
    # (ör. "... Electric", "... Hybrid"); yoksa varsayılan Benzin.
    name = _val(row, "eLabel") or ""
    cc = 0
    fuel_type = carquery.normalize_fuel_type(name)
    label = "Full Elektrik" if fuel_type == "Elektrik" else f"Bilinmiyor {fuel_type}"
    return {
        "cc": cc,
        "fuelType": fuel_type,
        "trim": name,
        "weightKg": _weight_of(row),  # None kalabilir — sunum katmanı 1350 uygular
        "fuelConsumption": None,  # Wikidata'da güvenilir alan yok
        "label": label,
    }


# --- Üst-seviye kolaylık (catalog.py bunları sarar) -------------------------


async def fetch_makes() -> list[str]:
    """Pragmatik: global marka listesi çekmiyoruz (yavaş/gürültülü, CarQuery yeterli).
    Markalar models/years/engines içinde talep üzerine resolve edilir."""
    return []


async def fetch_models(make: str) -> list[str]:
    qid = await resolve_make_qid(make)
    if qid is None:
        return []
    return [m["name"] for m in await fetch_models_for_qid(qid)]


async def fetch_years(make: str, model: str) -> list[int]:
    qid = await resolve_make_qid(make)
    if qid is None:
        return []
    rows = await _fetch_generation_rows(qid, model)
    years = {y for row in rows if (y := _year_of(row)) is not None}
    return sorted(years, reverse=True)


async def fetch_engines(make: str, model: str, year: int) -> list[dict]:
    qid = await resolve_make_qid(make)
    if qid is None:
        return []
    rows = await _fetch_generation_rows(qid, model)

    # Yıla göre daralt: inception'ı olan ve seçilen yıldan sonra başlayan nesilleri
    # ele (henüz yoktu). Yılsız varlıklar (çoğunluk — veri seyrek) her zaman kalır.
    chosen = [row for row in rows if (y := _year_of(row)) is None or y <= year]
    if not chosen:
        chosen = rows

    # Wikidata'da cc/yakıt yok; her nesil aynı "0-Benzin" olur. O yüzden dedup'ı
    # varlık ADI (nesil) + ağırlık üzerinden yap ki farklı ağırlıklı nesiller —
    # vergi baremini belirleyen asıl fark — birbirini ezmesin.
    engines: list[dict] = []
    seen: set[str] = set()
    for row in chosen:
        eng = _row_to_engine(row)
        key = f"{eng['trim'].lower()}|{eng['weightKg']}"
        if key in seen:
            continue
        seen.add(key)
        engines.append(eng)

    # Ağırlığı bilinenler önce (daha kullanışlı), sonra ada göre.
    engines.sort(key=lambda e: (e["weightKg"] is None, e["trim"].lower()))
    return engines
