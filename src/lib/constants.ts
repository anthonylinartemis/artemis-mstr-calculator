// Default assumptions (fallback if API fails)
// Holdings updated per bitcointreasuries.net as of Feb 2026
export const DEFAULT_ASSUMPTIONS = {
  btcPrice: 97000,
  btcHoldings: 713502, // 713K BTC per bitcointreasuries.net
  btcVolatility: 0.60, // 60% annualized
};

// API endpoints - always use proxy to avoid CORS (dev: Vite proxy, prod: Vercel functions)
export const API_ENDPOINTS = {
  MSTR_KPI: '/api/microstrategy/btc/mstrKpiData',
  BTC_KPI: '/api/microstrategy/btc/bitcoinKpis',
};

// Refresh interval (60 seconds)
export const REFRESH_INTERVAL = 60 * 1000;

// Coverage thresholds for color coding
export const COVERAGE_THRESHOLDS = {
  EXCELLENT: 10, // green
  GOOD: 5, // light green
  ADEQUATE: 3, // yellow
  WARNING: 2, // orange
  CRITICAL: 1, // red
};

// Preferred stock dividend yields (fixed contractual rates)
// Source: Strategy.com prospectuses, Strive prospectus
export const PREFERRED_YIELDS: Record<string, number> = {
  STRF: 0.10,   // 10%
  STRK: 0.08,   // 8%
  STRC: 0.1125, // 11.25%
  STRD: 0.10,   // 10%
  SATA: 0.12,   // 12%
};

// Strategy official definitions for tooltips
export const STRATEGY_DEFINITIONS = {
  coverage: "Coverage Ratio: (BTC Value + USD Reserve) / Cumulative Notional. Measures how many times the treasury assets cover the obligations.",
  notional: "Notional Amount: The face value of the security's outstanding principal. For preferred stock, this is the aggregate liquidation preference.",
};
