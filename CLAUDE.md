# MSTR BTC Treasury Calculator

## SESSION START - READ FIRST
**IMPORTANT**: At the start of every new session, Claude MUST:
1. Read this file (`CLAUDE.md`) for project context
2. Read `CHANGELOG.md` for recent changes and current state
3. Understand what's been built before making changes

This ensures continuity across sessions and prevents duplicate work.

---

## Quick Start
```bash
npm install
npm run dev           # http://localhost:5173 (no serverless functions)
npm run dev:vercel    # Uses Vercel dev server with serverless functions
npm run build         # Production build
```

## Architecture
- **Framework:** Vite + React 18 + TypeScript (strict)
- **Styling:** Tailwind CSS (Strategy dark theme)
- **Data:** SWR with 60s refresh

## Data Sources

### BTC Price & MSTR Holdings (No Auth)
```
GET /api/microstrategy/btc/mstrKpiData
GET /api/microstrategy/btc/bitcoinKpis
GET /api/coingecko/btc-price
```

### Preferred Stock Prices (Yahoo Finance)
```
GET /api/yahoo/prices?symbols=STRF,STRC,STRK,STRD,SATA
```

### Strive BTC Holdings (CoinGecko)
```
GET /api/coingecko/strive-treasury
```

## Key Files
```
src/
├── App.tsx                          # Main calculator UI
├── components/
│   ├── NumericInput.tsx             # Editable numeric inputs
│   ├── SensitivityTable.tsx         # Sensitivity matrix
│   └── YieldCoverageChart.tsx       # YTM vs Coverage scatter chart
├── hooks/
│   ├── useMSTRData.ts              # BTC price/holdings from MicroStrategy
│   ├── usePreferredPrices.ts       # Preferred prices from Yahoo Finance
│   └── useStriveData.ts            # Strive BTC holdings from CoinGecko
├── lib/
│   ├── api.ts                      # Data fetching with fallbacks
│   └── constants.ts                # Thresholds, yields, endpoints
├── index.css                       # Tailwind + global styles
└── main.tsx                        # Entry point

api/
├── coingecko/
│   ├── btc-price.ts                # CoinGecko BTC price proxy
│   └── strive-treasury.ts          # CoinGecko Strive BTC holdings
├── microstrategy/[...path].ts      # MicroStrategy API proxy
└── yahoo/prices.ts                 # Yahoo Finance preferred prices
```

## Env Vars
No env vars required — all APIs are public (CoinGecko, Yahoo Finance, MicroStrategy).

## Deploy
```bash
npx vercel --prod --yes
```

**Production URL**: https://artemis-mstr-calculator.vercel.app

---

## Current State (as of 2026-02-06)

### Features
- **4 Tabs**: MSTR Calculator | Strive Calculator | MSTR Sensitivity | Strive Sensitivity
- **Live Data**: BTC price from CoinGecko, MSTR holdings from MicroStrategy API, preferred prices from Yahoo Finance, Strive BTC holdings from CoinGecko
- **Editable Totals**: Total Debt and Total Pref can be modified directly
- **Sensitivity Analysis**: Per-security coverage matrix with adjustable holdings increments
- **YTM vs Coverage Chart**: Scatter plot with NaN/Infinity protection
- **Dark Lavender Theme**: Purple-tinted dark mode with accent color `#9d8df1`

### Key Components
- `src/App.tsx` - Main app with all calculator logic
- `src/components/SensitivityTable.tsx` - Sensitivity matrix component
- `src/components/YieldCoverageChart.tsx` - YTM vs Coverage scatter chart
- `src/components/NumericInput.tsx` - TradingView-style editable inputs
- `src/hooks/useMSTRData.ts` - BTC price/holdings from MicroStrategy
- `src/hooks/usePreferredPrices.ts` - Preferred prices from Yahoo Finance
- `src/hooks/useStriveData.ts` - Strive BTC holdings from CoinGecko

### Tailwind Colors
```js
'lavender-bg': '#2d2a4a',      // Main background
'lavender-card': '#3d3a5a',    // Card backgrounds
'lavender-border': '#4d4a6a',  // Borders
'lavender-accent': '#9d8df1',  // Accent/highlight
```
