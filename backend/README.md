# AutoCalc KKTC — Backend

Frontend'in üç kırılgan bağımlılığını (döviz kuru, akaryakıt fiyatı, CarQuery)
kendi önbelleğimizin arkasına alan FastAPI servisi. Frontend GitHub Pages'te
statik kalır; bu servis ayrı bir yerde (Fly.io / Render vb.) çalışır.

**Backend bir bağımlılık değil, iyileştirme katmanıdır.** Kapalıyken veya
ulaşılamazken site bugünkü gibi (yerel JSON + sezgisel tahminlerle) çalışmaya
devam eder — her istek 6-8 saniyede kesilir ve frontend kendi fallback
merdivenine düşer.

## Kurulum (Windows / PowerShell)

```powershell
cd backend
py -m venv .venv
.venv\Scripts\python.exe -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

## Çalıştırma

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Katalog ilk açılışta otomatik tohumlanır (`kktc_popular_cars.json` → SQLite).
Elle de çalıştırılabilir:

```powershell
.venv\Scripts\python.exe -m app.seed.seed_catalog
```

Etkileşimli API dokümantasyonu: http://localhost:8000/docs

## Test

```powershell
.venv\Scripts\python.exe -m pytest -q
```

En riskli parçalar (`fuel_scraper.py` regex'leri, CarQuery JSONP ayrıştırma,
önbellek stale-while-error mantığı) ağ olmadan, saf fonksiyon testleriyle
doğrulanıyor.

## Uçlar

| Uç | Açıklama |
|---|---|
| `GET /api/health` | Canlılık kontrolü |
| `GET /api/rates` | GBP/USD/EUR → TRY, 15 dk önbellek |
| `GET /api/fuel` | KKTC akaryakıt fiyatları, 12 saat önbellek |
| `GET /api/vehicles/makes` | Katalog + CarQuery birleşimi |
| `GET /api/vehicles/models?make=` | |
| `GET /api/vehicles/years?make=&model=` | Katalogda varsa CarQuery'ye hiç gidilmez |
| `GET /api/vehicles/engines?make=&model=&year=` | Fiyat bilgisi de gömülü döner |
| `PUT /api/admin/prices` | `X-Admin-Token` gerektirir; token tanımsızsa uç hiç mount edilmez (404) |

Her yanıt `source` alanı taşır (`live`/`cached`/`stale`/`fallback`) — frontend'in
"Canlı Veri / Yedek" rozet sözleşmesiyle birebir eşleşir.

## Ortam değişkenleri

`.env.example`'a bakın. Önemli olanlar: `DATABASE_URL`, `CORS_ORIGINS`
(virgülle ayrılmış, GitHub Pages origin'i **path'siz**, sadece `https://<kullanıcı>.github.io`),
`ADMIN_TOKEN`.

## Bilinen kısıtlar

- **CarQuery'nin SSL sertifikası şu an kendi hostname'iyle uyuşmuyor**
  (`carqueryapi.com` sertifika hatası veriyor) — bizim kodumuzdan bağımsız,
  servisin kendi sorunu. Sistem bunu zarifçe yutup `source:"fallback"` döner;
  sertifika doğrulaması bilerek gevşetilmedi.
- Fiyat verisi çoğunlukla `confidence:"baseline"` — gerçek KKTC piyasa
  fiyatı değil, mevcut sezgisel tahminin Python portu. Gerçek fiyatlar
  `PUT /api/admin/prices` ile elle girilebilir.
- Ücretsiz barındırmada (Render vb.) disk kalıcı olmayabilir — elle girilen
  fiyatlar bu durumda deploy'lar arası kaybolur. Kalıcı volume'lü bir host
  (Fly.io) veya periyodik `GET /api/admin/prices` dökümünün commit'lenmesi
  önerilir.
