import type {
  Assumptions,
  DebtInstrument,
  PreferredInstrument,
  DebtMetrics,
  PreferredMetrics,
  TreasuryMetrics,
  SensitivityCell,
} from '../types';
import {
  CURRENT_YEAR,
  PERPETUAL_DURATION,
  SENSITIVITY_HOLDINGS_RANGE,
  SENSITIVITY_PRICE_RANGE,
} from './constants';

/**
 * Calculate BTC NAV (Net Asset Value)
 * NAV = BTC Holdings × BTC Price
 */
export function calculateNav(holdings: number, price: number): number {
  return holdings * price;
}

/**
 * Calculate duration (years to maturity)
 */
export function calculateDuration(maturityYear: number): number {
  const duration = maturityYear - CURRENT_YEAR;
  return Math.max(duration, 0.5); // minimum 6 months
}

/**
 * Calculate BTC Risk (volatility-adjusted duration)
 * BTC Risk = Volatility × sqrt(Duration)
 */
export function calculateBtcRisk(volatility: number, duration: number): number {
  return volatility * Math.sqrt(duration);
}

/**
 * Calculate Coverage Ratio (BTC Rating)
 * Coverage = NAV / Cumulative Notional
 */
export function calculateCoverage(nav: number, cumulativeNotional: number): number {
  if (cumulativeNotional <= 0) return Infinity;
  return nav / (cumulativeNotional * 1_000_000); // notional in millions
}

/**
 * Calculate BTC Credit Spread
 * Credit = BTC Risk × (1 - 1/Coverage)
 * Higher coverage = lower credit spread
 */
export function calculateBtcCredit(btcRisk: number, coverage: number): number {
  if (coverage <= 1) return btcRisk; // At or below par, full risk
  return btcRisk * (1 - 1 / coverage);
}

/**
 * Calculate metrics for all debt instruments
 */
export function calculateDebtMetrics(
  instruments: DebtInstrument[],
  assumptions: Assumptions
): DebtMetrics[] {
  const nav = calculateNav(assumptions.btcHoldings, assumptions.btcPrice);
  let cumulativeNotional = 0;

  return instruments
    .sort((a, b) => a.maturityYear - b.maturityYear)
    .map((instrument) => {
      cumulativeNotional += instrument.notional;
      const duration = calculateDuration(instrument.maturityYear);
      const btcRating = calculateCoverage(nav, cumulativeNotional);
      const btcRisk = calculateBtcRisk(assumptions.btcVolatility, duration);
      const btcCredit = calculateBtcCredit(btcRisk, btcRating);

      return {
        instrument,
        cumulativeNotional,
        duration,
        btcRating,
        btcRisk,
        btcCredit,
      };
    });
}

/**
 * Calculate metrics for all preferred instruments
 */
export function calculatePreferredMetrics(
  instruments: PreferredInstrument[],
  assumptions: Assumptions,
  startingCumulative: number = 0
): PreferredMetrics[] {
  const nav = calculateNav(assumptions.btcHoldings, assumptions.btcPrice);
  let cumulativeNotional = startingCumulative;

  return instruments.map((instrument) => {
    cumulativeNotional += instrument.notional;
    const annualDividend = instrument.notional * instrument.dividendRate;
    const duration = PERPETUAL_DURATION; // Preferred is perpetual
    const btcRating = calculateCoverage(nav, cumulativeNotional);
    const btcRisk = calculateBtcRisk(assumptions.btcVolatility, duration);
    const btcCredit = calculateBtcCredit(btcRisk, btcRating);

    return {
      instrument,
      cumulativeNotional,
      annualDividend,
      duration,
      btcRating,
      btcRisk,
      btcCredit,
    };
  });
}

/**
 * Calculate overall treasury metrics
 */
export function calculateTreasuryMetrics(
  debtMetrics: DebtMetrics[],
  preferredMetrics: PreferredMetrics[],
  assumptions: Assumptions
): TreasuryMetrics {
  const nav = calculateNav(assumptions.btcHoldings, assumptions.btcPrice);

  const totalDebt = debtMetrics.reduce(
    (sum, m) => sum + m.instrument.notional,
    0
  );

  const totalPreferred = preferredMetrics.reduce(
    (sum, m) => sum + m.instrument.notional,
    0
  );

  const totalObligations = totalDebt + totalPreferred;

  const debtCoverage = calculateCoverage(nav, totalDebt);
  const totalCoverage = calculateCoverage(nav, totalObligations);

  // Annual dividend obligations
  const annualDividends = preferredMetrics.reduce(
    (sum, m) => sum + m.annualDividend,
    0
  );

  // BTC Years of Dividends = NAV / Annual Dividend Obligation (in millions)
  const btcYearsOfDividends = annualDividends > 0
    ? nav / (annualDividends * 1_000_000)
    : Infinity;

  // Average duration weighted by notional
  const totalNotionalDuration = [
    ...debtMetrics.map((m) => m.instrument.notional * m.duration),
    ...preferredMetrics.map((m) => m.instrument.notional * m.duration),
  ].reduce((sum, val) => sum + val, 0);

  const avgDuration = totalObligations > 0
    ? totalNotionalDuration / totalObligations
    : 0;

  // BTC Breakeven ARR = Total Obligations / NAV / Avg Duration
  const btcBreakevenArr = nav > 0 && avgDuration > 0
    ? (totalObligations * 1_000_000) / nav / avgDuration
    : 0;

  return {
    nav,
    totalDebt: totalDebt * 1_000_000,
    totalPreferred: totalPreferred * 1_000_000,
    totalObligations: totalObligations * 1_000_000,
    debtCoverage,
    totalCoverage,
    btcYearsOfDividends,
    btcBreakevenArr,
  };
}

/**
 * Generate sensitivity matrix data
 */
export function generateSensitivityMatrix(
  totalObligationsMillions: number,
  holdingsRange: number[] = SENSITIVITY_HOLDINGS_RANGE,
  priceRange: number[] = SENSITIVITY_PRICE_RANGE
): SensitivityCell[] {
  const cells: SensitivityCell[] = [];

  for (const holdings of holdingsRange) {
    for (const price of priceRange) {
      const nav = calculateNav(holdings, price);
      const coverage = calculateCoverage(nav, totalObligationsMillions);
      cells.push({ holdings, price, coverage });
    }
  }

  return cells;
}

/**
 * Get coverage color based on thresholds
 */
export function getCoverageColor(coverage: number): string {
  if (coverage >= 10) return 'bg-green-600';
  if (coverage >= 5) return 'bg-green-500';
  if (coverage >= 3) return 'bg-yellow-500';
  if (coverage >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get coverage text color for contrast
 */
export function getCoverageTextColor(coverage: number): string {
  if (coverage >= 5) return 'text-white';
  if (coverage >= 2) return 'text-black';
  return 'text-white';
}
