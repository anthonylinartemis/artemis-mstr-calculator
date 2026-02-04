import type { DebtInstrument, PreferredInstrument } from '../types';

// Current year for duration calculations
export const CURRENT_YEAR = new Date().getFullYear();

// MicroStrategy Convertible Debt Instruments
// Source: Strategy.com Credit section, SEC filings
export const DEBT_INSTRUMENTS: DebtInstrument[] = [
  {
    id: 'convert-2028',
    name: 'Convert 2028',
    notional: 1050, // $1.05B
    maturityYear: 2028,
    couponRate: 0.00, // 0% coupon
    conversionPrice: 183.19,
  },
  {
    id: 'convert-2029',
    name: 'Convert 2029',
    notional: 1010, // $1.01B
    maturityYear: 2029,
    couponRate: 0.00,
    conversionPrice: 497.91,
  },
  {
    id: 'convert-2030',
    name: 'Convert 2030',
    notional: 800, // $800M
    maturityYear: 2030,
    couponRate: 0.00625, // 0.625%
    conversionPrice: 149.77,
  },
  {
    id: 'convert-2031',
    name: 'Convert 2031',
    notional: 3000, // $3B
    maturityYear: 2031,
    couponRate: 0.00,
    conversionPrice: 672.40,
  },
  {
    id: 'convert-2032',
    name: 'Convert 2032',
    notional: 2000, // $2B
    maturityYear: 2032,
    couponRate: 0.00,
    conversionPrice: 433.43,
  },
];

// MicroStrategy Preferred Stock Instruments
// Source: Strategy.com Credit section
export const PREFERRED_INSTRUMENTS: PreferredInstrument[] = [
  {
    id: 'strf',
    ticker: 'STRF',
    name: 'Strike Preferred',
    notional: 584, // ~$584M
    dividendRate: 0.10, // 10% annual
    liquidationPreference: 100,
    sharesOutstanding: 5840000,
  },
  {
    id: 'strk',
    ticker: 'STRK',
    name: 'Strike Convertible Preferred',
    notional: 563, // ~$563M
    dividendRate: 0.08, // 8% annual
    liquidationPreference: 100,
    sharesOutstanding: 5630000,
  },
];

// Default assumptions (fallback if API fails)
// Holdings updated per bitcointreasuries.net as of Feb 2026
export const DEFAULT_ASSUMPTIONS = {
  btcPrice: 97000,
  btcHoldings: 713502, // 713K BTC per bitcointreasuries.net
  btcVolatility: 0.60, // 60% annualized
  btcArr: 0.25, // 25% expected annual return
};

// API endpoints - always use proxy to avoid CORS (dev: Vite proxy, prod: Vercel functions)
export const API_ENDPOINTS = {
  MSTR_KPI: '/api/microstrategy/btc/mstrKpiData',
  BTC_KPI: '/api/microstrategy/btc/bitcoinKpis',
  ARTEMIS_PRICE: '/api/artemis/asset/price',
};

// Refresh interval (60 seconds)
export const REFRESH_INTERVAL = 60 * 1000;

// Number of days to look back for price change calculation
export const PRICE_HISTORY_DAYS = 3;

// Sensitivity matrix ranges
export const SENSITIVITY_HOLDINGS_RANGE = [
  500000, 600000, 713502, 800000, 900000, 1000000,
];

export const SENSITIVITY_PRICE_RANGE = [
  50000, 75000, 100000, 125000, 150000, 200000,
];

// Coverage thresholds for color coding
export const COVERAGE_THRESHOLDS = {
  EXCELLENT: 10, // green
  GOOD: 5, // light green
  ADEQUATE: 3, // yellow
  WARNING: 2, // orange
  CRITICAL: 1, // red
};

// Duration for perpetual preferred (used in calculations)
export const PERPETUAL_DURATION = 30;

// Preferred stock dividend yields (fixed contractual rates)
// Source: Strategy.com prospectuses
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
