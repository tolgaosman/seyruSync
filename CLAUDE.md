# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # static export -> docs/ (see Deployment)
npm run lint     # eslint (flat config, eslint.config.mjs)
```

There is no test framework in this project — no test runner, no test files.

## What this app is

A single-page Turkish-language calculator for the **KKTC (Northern Cyprus) seyrüsefer (road) tax** and 5-year **TCO** comparison of up to 3 vehicles. All UI strings, comments, and domain terms are Turkish; keep new code consistent with that.

Runtime shape: **fully client-side static export**. There are no API routes, no server components doing data work — [app/page.tsx](app/page.tsx) is `"use client"` and every external fetch happens in the browser.

## Architecture

### Three-layer data flow

1. **Vehicle catalog** — [services/vehicleApi.ts](services/vehicleApi.ts) drives a cascading `make → model → year → engine` picker in [components/CarSelector.tsx](components/CarSelector.tsx). Each step has a **three-tier fallback**:
   - local JSON ([data/kktc_popular_cars.json](data/kktc_popular_cars.json), keyed `Make → Model → Year → EngineOption[]`) — **preferred, wins outright** for years/engines;
   - CarQuery API, fetched through CORS proxies (direct → `api.allorigins.win` → `corsproxy.io`);
   - heuristic fallbacks — `FALLBACK_MODELS` and `buildFallbackEngines()`, which classify a `"make model"` string by keyword (`isExtraHeavy`, `isLargeLuxury`, `isUltraLight`, `isSmall`) into a canned engine/weight table. Recent commit history is mostly tuning these weight buckets, since **weight is what determines the tax barem**.

   Prices are never fetched — `estimatePriceGBP()` invents a GBP price from brand tier, engine cc, fuel type, and 8%/yr depreciation.

2. **Live rates** — [hooks/useExchangeRate.ts](hooks/useExchangeRate.ts) (GBP/USD/EUR vs TRY, 2 providers, 15-min refresh) and [hooks/useFuelPrice.ts](hooks/useFuelPrice.ts) (scrapes a KKTC fuel-price page via CORS proxy with regex, 24-hr refresh). Both expose a `source: "live" | "fallback" | "cached"` flag that the UI surfaces as a warning banner — preserve that pattern when adding data sources.

   Both are **module-level singleton stores** read via `useSyncExternalStore`, not per-component state: one cached snapshot, one in-flight promise, one interval shared by all subscribers (first subscriber starts it, last one stops it). They're each called from two places (`page.tsx` header + the widget card), so per-component state would mean duplicate fetch loops and two consumers disagreeing about the rate. Keep new data hooks on this pattern.

3. **Calculation** — [utils/taxCalculator.ts](utils/taxCalculator.ts) is pure and the single source of domain truth:
   - `BAREMS`: 4 weight brackets with TL/kg rates; **electric vehicles get a separate, shifted bracket table inside `calculateRoadTax()`** to compensate for battery weight.
   - `annualTax = weightKg × ratePerKg + BASE_EMISSION_FEE`, then −30% if the car is over 10 years old.
   - `calculateTCO()` = vehicle price (GBP→TL at live rate) + 5×tax + 5×fuel; electric fuel cost is 0. Note it calls `calculateRoadTax(car.weightKg)` **without** `fuelType`, so the EV bracket table does not apply inside TCO.
   - `getBaremColors()` maps barem 1–4 to Tailwind classes + a `fill` hex. It's a thin delegate to `BAREM_PALETTE` in [lib/theme.ts](lib/theme.ts) — the single source for barem, TCO-segment, and fuel-type colors. Never hardcode these; they used to be triplicated across `taxCalculator`, `ui/badge.tsx`, and `TCOChart` and drifted apart.

Money is dual-currency by design: **vehicle prices are GBP, taxes and fuel are TL**. Conversion always goes through the live `gbpRate` passed down from `page.tsx`; format with `formatTL` / `formatGBP`.

### UI

State lives entirely in `page.tsx` (`selectedCars: (Car|null)[]` of length 3, `annualKm`) and flows down as props — no store, no context. Pass `selectedCars` **unfiltered** to `CarSelector`: slot indices must stay aligned, or a car lands in the wrong slot when an earlier one is empty. Presentational components ([TaxDisplay](components/TaxDisplay.tsx), [ComparisonTable](components/ComparisonTable.tsx), [TCOChart](components/TCOChart.tsx), [BaselineSummary](components/BaselineSummary.tsx)) each re-derive their numbers by calling the calculator; the widgets ([FuelPricesTable](components/FuelPricesTable.tsx), [ExchangeRatesTable](components/ExchangeRatesTable.tsx)) call the hooks themselves.

Layout is a single vertical flow (header → car strip → tax cards → table → chart → market widgets), not columns. Every widget is rendered **once**; responsive variants are handled by breakpoints, not by `hidden`/`lg:hidden` duplicate subtrees. The one deliberate exception is `ComparisonTable`, which renders a card list below `md` and a real table above — static props, no hooks behind it.

`components/ui/` is shadcn-style Radix + `cva` primitives, plus `stat.tsx` (KPI tile) and `widget-card.tsx` (market-widget shell + `DataSourceBadge`). Tailwind v4 (PostCSS plugin, no `tailwind.config`). Charts use Recharts. Imports use the `@/*` path alias.

### Theming

Light and dark, toggled by `data-theme` on `<html>`, persisted to `localStorage` and applied by an inline script in [layout.tsx](app/layout.tsx) before first paint (removing it causes a theme flash).

[globals.css](app/globals.css) is the whole system: `@theme` only *indirects* (`--color-x: var(--t-x)`), and the real values live in two palettes — `:root` (light) and `[data-theme="dark"]`. So a new color means adding it in three places: the `@theme` alias and both palettes.

Rules that are easy to get wrong:
- **Never write `bg-white/[0.05]`-style overlays** — they vanish in light mode. Use the `fill` / `fill-2` / `fill-3` tokens, which flip to a dark tint in light mode.
- `.glass`, `.skeleton`, and the other helpers must stay inside `@layer components`. Unlayered, they outrank every Tailwind utility and silently kill `ring-*` / `shadow-*` / `border-*` overrides on cards.
- **Recharts can't use CSS variables** (`var()` doesn't resolve in SVG presentation attributes). Chart colors come from `TCO_SEGMENT_COLORS_BY_THEME`, `CHART_CHROME`, and `BAREM_HEX` in `lib/theme.ts`, selected at runtime via `useTheme()`.

`useTheme` is a `useSyncExternalStore` over the DOM attribute, so the DOM stays authoritative and there's no hydration mismatch.

Types shared across layers live in [types/index.ts](types/index.ts); `EngineOption` is the exception and lives in `services/vehicleApi.ts`. [data/cars.ts](data/cars.ts) is a deliberately emptied stub kept for import compatibility.

## Deployment

`next.config.ts` sets `output: "export"`, `distDir: "docs"`, and `basePath: "/autoCalc"` in production — so a production build writes the site into `docs/`, **which is committed to git** and served by GitHub Pages configured as **Deploy from branch → `main` → `/docs`**. That mapping makes `docs/index.html` the site root at `https://tolgaosman.github.io/autoCalc/` directly — no redirect stub. Consequences:

- `npm run build` produces a large, intentional diff under `docs/`. That is expected, not accidental.
- The `deploy` script (`gh-pages -d out`) points at `out/`, which this config never produces; the live path is the committed `docs/` directory.
- `docs/dev/` is a stray dev-server artifact directory, untracked but **not** gitignored — check `git status` before a blind `git add .` near a build.

## Backend (`backend/`)

A FastAPI service exists at [backend/](backend/) — see [backend/README.md](backend/README.md) for setup. It is an **enhancement layer, not a dependency**: the frontend stays a static export on GitHub Pages, the backend runs separately (Fly.io/Render), and every frontend call to it goes through [lib/api.ts](lib/api.ts)'s `apiGet()`, which times out (6–8s) and returns `null` on any failure — network error, timeout, CORS, non-2xx. Callers then fall through to the pre-existing fallback chains (local JSON, direct provider calls, heuristics), which were **not removed**. The site must work identically with the backend stopped; verify this after touching either side.

What it replaces: the CORS-proxy ladders in `services/vehicleApi.ts` (CarQuery) and `hooks/useFuelPrice.ts` (HTML scrape) now try the backend first (`/api/vehicles/*`, `/api/fuel`), and `hooks/useExchangeRate.ts` tries `/api/rates` before its own two direct providers. `EngineOption` gained optional `priceGBP`/`priceConfidence` fields — the backend embeds a price directly in the engines response (`confidence: "manual" | "listing" | "baseline"`, mostly `"baseline"` today, a Python port of `estimatePriceGBP()`) because `CarSelector.onCalculate` calls `buildCar()` **synchronously** and must stay that way.

Backend-side: SQLite via SQLAlchemy, one `cache_entries` table implementing stale-while-error (`app/cache.py` — serve the last good value with `source:"stale"` rather than ever erroring), and a `makes/models/model_years/engines` catalog seeded from a copy of `data/kktc_popular_cars.json` at `backend/app/seed/`. **CarQuery results are never auto-promoted into the catalog** — only cached — because CarQuery frequently omits weight and the code would otherwise persist a fabricated value as if it were a fact (weight drives the tax barem). Tax math is **not** duplicated server-side; `utils/taxCalculator.ts` stays the only implementation.

`carqueryapi.com` currently serves a mismatched SSL certificate (their bug, not this code) — the backend's stale-while-error handling absorbs it and returns `source:"fallback"` rather than crashing. Don't "fix" this by disabling certificate verification.

## Next.js version

`AGENTS.md` (auto-generated by `next dev`) warns this is Next 16 with breaking changes vs. older knowledge; consult `node_modules/next/dist/docs/` before writing framework-level code. That file is rewritten by `next dev` — commit it with your work rather than reverting it.
