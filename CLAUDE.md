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

3. **Calculation** — [utils/taxCalculator.ts](utils/taxCalculator.ts) is pure and the single source of domain truth:
   - `BAREMS`: 4 weight brackets with TL/kg rates; **electric vehicles get a separate, shifted bracket table inside `calculateRoadTax()`** to compensate for battery weight.
   - `annualTax = weightKg × ratePerKg + BASE_EMISSION_FEE`, then −30% if the car is over 10 years old.
   - `calculateTCO()` = vehicle price (GBP→TL at live rate) + 5×tax + 5×fuel; electric fuel cost is 0. Note it calls `calculateRoadTax(car.weightKg)` **without** `fuelType`, so the EV bracket table does not apply inside TCO.
   - `getBaremColors()` maps barem 1–4 to the Tailwind classes and the Recharts `fill` hex used across all components — use it rather than hardcoding barem colors.

Money is dual-currency by design: **vehicle prices are GBP, taxes and fuel are TL**. Conversion always goes through the live `gbpRate` passed down from `page.tsx`; format with `formatTL` / `formatGBP`.

### UI

State lives entirely in `page.tsx` (`selectedCars: (Car|null)[]` of length 3, `annualKm`) and flows down as props — no store, no context. Presentational components ([TaxDisplay](components/TaxDisplay.tsx), [ComparisonTable](components/ComparisonTable.tsx), [TCOChart](components/TCOChart.tsx), [BaselineSummary](components/BaselineSummary.tsx)) each re-derive their numbers by calling the calculator; the widgets ([FuelPricesTable](components/FuelPricesTable.tsx), [ExchangeRatesTable](components/ExchangeRatesTable.tsx)) call the hooks themselves.

`components/ui/` is shadcn-style Radix + `cva` primitives. Tailwind v4 (PostCSS plugin, no `tailwind.config`). Charts use Recharts. Imports use the `@/*` path alias.

Types shared across layers live in [types/index.ts](types/index.ts); `EngineOption` is the exception and lives in `services/vehicleApi.ts`. [data/cars.ts](data/cars.ts) is a deliberately emptied stub kept for import compatibility.

## Deployment

`next.config.ts` sets `output: "export"`, `distDir: "docs"`, and `basePath: "/seyruSync/docs"` in production — so a production build writes the site into `docs/`, **which is committed to git** and served by GitHub Pages. Root [index.html](index.html) is a redirect stub into `docs/`. Consequences:

- `npm run build` produces a large, intentional diff under `docs/`. That is expected, not accidental.
- The `deploy` script (`gh-pages -d out`) points at `out/`, which this config never produces; the live path is the committed `docs/` directory.
- The `basePath` hardcodes repo name `seyruSync`, while this checkout is `autoCalc` and the package is `autobarem`. Changing the repo name requires updating `basePath`.

## Next.js version

`AGENTS.md` (auto-generated by `next dev`) warns this is Next 16 with breaking changes vs. older knowledge; consult `node_modules/next/dist/docs/` before writing framework-level code. That file is rewritten by `next dev` — commit it with your work rather than reverting it.
