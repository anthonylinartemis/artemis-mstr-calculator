# MSTR BTC Treasury Calculator

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
vercel --prod
```
Set `ARTEMIS_ENCRYPTED_TOKEN_SEED` in Vercel project settings.
