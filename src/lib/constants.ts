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

// Default assumptions
export const DEFAULT_ASSUMPTIONS = {
  btcPrice: 100000,
  btcHoldings: 471107,
  btcVolatility: 0.60, // 60% annualized
  btcArr: 0.25, // 25% expected annual return
};

// API endpoints
export const API_ENDPOINTS = {
  MSTR_KPI: 'https://api.microstrategy.com/btc/mstrKpiData',
  BTC_KPI: 'https://api.microstrategy.com/btc/bitcoinKpis',
  ARTEMIS_PRICE: 'https://api.artemis.xyz/asset/price',
};

// Refresh interval (60 seconds)
export const REFRESH_INTERVAL = 60 * 1000;

// Sensitivity matrix ranges
export const SENSITIVITY_HOLDINGS_RANGE = [
  300000, 400000, 471107, 550000, 650000, 750000,
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
