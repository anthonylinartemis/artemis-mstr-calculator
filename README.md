# MSTR BTC Treasury Calculator

A BTC treasury coverage calculator inspired by [Strategy.com](https://www.strategy.com), built with React + TypeScript.

Analyze MicroStrategy's debt and preferred stock coverage using live data from the MicroStrategy API.

## Features

- **Live Data**: Auto-refreshes every 60 seconds from MicroStrategy's public API
- **Editable Assumptions**: Adjust BTC price, holdings, volatility, and expected ARR
- **Debt Coverage Table**: Convertible notes with cumulative coverage ratios
- **Preferred Stock Table**: STRF/STRK with dividend calculations
- **Sensitivity Matrix**: Heatmap showing coverage across holdings × price scenarios
- **Dark Theme**: Strategy-inspired orange/black aesthetic

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Deploy to Vercel

```bash
npm run build
vercel --prod
```

Or connect the GitHub repo directly to Vercel for automatic deployments.

## Data Sources

**Primary:** MicroStrategy Public API (no auth required)
- `https://api.microstrategy.com/btc/mstrKpiData`
- `https://api.microstrategy.com/btc/bitcoinKpis`

**Fallback:** Artemis API (requires `VITE_ARTEMIS_API_KEY` env var)

## Tech Stack

- Vite + React 18
- TypeScript (strict mode)
- Tailwind CSS
- SWR for data fetching

## Key Metrics

| Metric | Formula |
|--------|---------|
| BTC NAV | Holdings × Price |
| Coverage | NAV / Cumulative Notional |
| BTC Years of Dividends | NAV / Annual Dividend Obligation |
| Breakeven ARR | Total Obligations / NAV / Avg Duration |

## License

MIT
