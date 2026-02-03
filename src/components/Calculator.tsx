import { useState, useEffect, useMemo } from 'react';
import { useMSTRData } from '../hooks/useMSTRData';
import { AssumptionsBar } from './AssumptionsBar';
import { MetricsBar } from './MetricsBar';
import { DebtTable } from './DebtTable';
import { PreferredTable } from './PreferredTable';
import { SensitivityMatrix } from './SensitivityMatrix';
import {
  calculateDebtMetrics,
  calculatePreferredMetrics,
  calculateTreasuryMetrics,
} from '../lib/calculations';
import {
  DEBT_INSTRUMENTS,
  PREFERRED_INSTRUMENTS,
  DEFAULT_ASSUMPTIONS,
} from '../lib/constants';
import type { Assumptions } from '../types';

export function Calculator() {
  const { data, isLoading, isError, error, refresh, lastUpdated, source } =
    useMSTRData();

  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);

  // Update assumptions when live data arrives
  useEffect(() => {
    if (data) {
      setAssumptions((prev) => ({
        ...prev,
        btcPrice: data.btcPrice,
        btcHoldings: data.btcHoldings,
        btcVolatility: data.historicVolatility || prev.btcVolatility,
      }));
    }
  }, [data]);

  // Calculate all metrics
  const debtMetrics = useMemo(
    () => calculateDebtMetrics(DEBT_INSTRUMENTS, assumptions),
    [assumptions]
  );

  const totalDebt = useMemo(
    () => debtMetrics.reduce((sum, m) => sum + m.instrument.notional, 0),
    [debtMetrics]
  );

  const preferredMetrics = useMemo(
    () => calculatePreferredMetrics(PREFERRED_INSTRUMENTS, assumptions, totalDebt),
    [assumptions, totalDebt]
  );

  const treasuryMetrics = useMemo(
    () => calculateTreasuryMetrics(debtMetrics, preferredMetrics, assumptions),
    [debtMetrics, preferredMetrics, assumptions]
  );

  const totalObligationsMillions = useMemo(
    () => totalDebt + preferredMetrics.reduce((sum, m) => sum + m.instrument.notional, 0),
    [totalDebt, preferredMetrics]
  );

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-strategy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-strategy-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-strategy-text-muted">Loading treasury data...</p>
        </div>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="min-h-screen bg-strategy-bg flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-strategy-text mb-2">
            Failed to load data
          </h2>
          <p className="text-strategy-text-muted mb-4">
            {error?.message || 'Unable to fetch treasury data'}
          </p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-strategy-orange text-white rounded hover:bg-strategy-orange-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-strategy-bg">
      {/* Header */}
      <header className="border-b border-strategy-border bg-strategy-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-strategy-text">
                <span className="text-strategy-orange">₿</span> MSTR Treasury Calculator
              </h1>
              <p className="text-sm text-strategy-text-muted mt-1">
                BTC coverage analysis for MicroStrategy debt & preferred
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.strategy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-strategy-text-muted hover:text-strategy-orange transition-colors"
              >
                Data: Strategy.com
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Assumptions */}
        <AssumptionsBar
          assumptions={assumptions}
          onChange={setAssumptions}
          isLive={!isError}
          lastUpdated={lastUpdated}
          source={source}
          onRefresh={refresh}
        />

        {/* Key Metrics */}
        <MetricsBar metrics={treasuryMetrics} />

        {/* Tables */}
        <div className="grid lg:grid-cols-2 gap-6">
          <DebtTable metrics={debtMetrics} />
          <PreferredTable metrics={preferredMetrics} />
        </div>

        {/* Sensitivity Matrix */}
        <SensitivityMatrix
          totalObligationsMillions={totalObligationsMillions}
          currentHoldings={assumptions.btcHoldings}
          currentPrice={assumptions.btcPrice}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-strategy-text-muted py-4 border-t border-strategy-border">
          <p>
            Built with data from MicroStrategy API • Not financial advice •{' '}
            <a
              href="https://github.com/anthonylinartemis/artemis-mstr-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-strategy-orange hover:underline"
            >
              View Source
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
