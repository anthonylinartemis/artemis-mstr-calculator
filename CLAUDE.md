# MSTR BTC Treasury Calculator

## Quick Start
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
```

## Architecture
- **Framework:** Vite + React 18 + TypeScript (strict)
- **Styling:** Tailwind CSS (Strategy dark theme)
- **Data:** SWR with 60s refresh

## Data Sources (No Auth)
```
GET https://api.microstrategy.com/btc/mstrKpiData
GET https://api.microstrategy.com/btc/bitcoinKpis
```

Fallback: Artemis API (requires `VITE_ARTEMIS_API_KEY`)

## Key Files
```
src/
├── components/    # UI components
├── hooks/         # useMSTRData, useBTCData
├── lib/
│   ├── api.ts           # API clients
│   ├── calculations.ts  # Financial formulas
│   ├── constants.ts     # Debt/pref instruments
│   └── formatters.ts    # Display helpers
└── types/index.ts       # TypeScript interfaces
```

## Non-Negotiables
- [ ] All financial calculations match Strategy.com
- [ ] TypeScript strict mode, no `any`
- [ ] Loading/error states for all API calls
- [ ] Mobile responsive

## Env Vars
```
VITE_ARTEMIS_API_KEY=xxx  # Fallback only
```

## Deploy
```bash
vercel --prod
```

See `docs/agent-bible.md` for extended principles.
