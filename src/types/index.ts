// Instrument Types
export interface DebtInstrument {
  id: string;
  name: string;
  notional: number; // in millions USD
  maturityYear: number;
  couponRate: number; // annual rate as decimal
  conversionPrice?: number; // for convertible notes
}

export interface PreferredInstrument {
  id: string;
  ticker: string;
  name: string;
  notional: number; // in millions USD
  dividendRate: number; // annual rate as decimal
  liquidationPreference: number; // per share
  sharesOutstanding: number;
}

// Calculator State
export interface Assumptions {
  btcPrice: number;
  btcHoldings: number;
  btcVolatility: number;
  btcArr: number; // BTC appreciation rate
}

// Calculated Metrics
export interface DebtMetrics {
  instrument: DebtInstrument;
  cumulativeNotional: number;
  duration: number; // years to maturity
  btcRating: number; // coverage ratio
  btcRisk: number; // volatility * sqrt(duration)
  btcCredit: number; // credit spread
}

export interface PreferredMetrics {
  instrument: PreferredInstrument;
  cumulativeNotional: number;
  annualDividend: number;
  duration: number; // perpetual = use 30 years for calc
  btcRating: number;
  btcRisk: number;
  btcCredit: number;
}

export interface TreasuryMetrics {
  nav: number;
  totalDebt: number;
  totalPreferred: number;
  totalObligations: number;
  debtCoverage: number;
  totalCoverage: number;
  btcYearsOfDividends: number;
  btcBreakevenArr: number;
}

// Sensitivity Matrix
export interface SensitivityCell {
  holdings: number;
  price: number;
  coverage: number;
}

// API Status
export interface DataStatus {
  isLoading: boolean;
  isError: boolean;
  lastUpdated: Date | null;
  source: 'live' | 'cached' | 'fallback';
}
