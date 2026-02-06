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

### BTC Price & Holdings (No Auth)
```
GET https://api.microstrategy.com/btc/mstrKpiData
GET https://api.microstrategy.com/btc/bitcoinKpis
```

### Preferred Stock Prices (Artemis Auth)
```
GET /api/datasvc/v2/data/PRICE?symbols=eq-strf,eq-strc,eq-strk,eq-strd,eq-sata
```
Proxied through Vercel serverless function with JWT auth.

## Key Files
```
src/
├── App.tsx            # Main calculator UI
├── hooks/
│   ├── useMSTRData.ts       # BTC price/holdings from MicroStrategy
│   └── usePreferredPrices.ts # Preferred prices from Artemis datasvc
└── index.css          # Tailwind + global styles

api/
└── datasvc/[...path].ts  # Vercel serverless proxy for Artemis datasvc
```

## Env Vars
```
# Required for live preferred prices
ARTEMIS_ENCRYPTED_TOKEN_SEED=xxx  # ROT13 encoded token seed

# Optional fallback
VITE_ARTEMIS_API_KEY=xxx
```

Copy `.env.example` to `.env` and configure `ARTEMIS_ENCRYPTED_TOKEN_SEED`.

## Deploy
```bash
npx vercel --prod --yes
```
Set `ARTEMIS_ENCRYPTED_TOKEN_SEED` in Vercel project settings.

**Production URL**: https://artemis-mstr-calculator.vercel.app

---

## Current State (as of 2026-02-04)

### Features
- **4 Tabs**: MSTR Calculator | Strive Calculator | MSTR Sensitivity | Strive Sensitivity
- **Live Data**: BTC price + holdings from MicroStrategy API, preferred prices from Artemis
- **Editable Totals**: Total Debt and Total Pref can be modified directly
- **Sensitivity Analysis**: Per-security coverage matrix with adjustable holdings increments
- **Dark Lavender Theme**: Purple-tinted dark mode with accent color `#9d8df1`
- **Artemis Logo**: Header with logo from `logo/Purple gradient icon.jpg`

### Key Components
- `src/App.tsx` - Main app with all calculator logic
- `src/components/SensitivityTable.tsx` - Sensitivity matrix component
- `src/hooks/useMSTRData.ts` - BTC price/holdings from MicroStrategy
- `src/hooks/usePreferredPrices.ts` - Preferred prices from Artemis datasvc

### Tailwind Colors
```js
'lavender-bg': '#2d2a4a',      // Main background
'lavender-card': '#3d3a5a',    // Card backgrounds
'lavender-border': '#4d4a6a',  // Borders
'lavender-accent': '#9d8df1',  // Accent/highlight
```
