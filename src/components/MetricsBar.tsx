import {
  formatCurrency,
  formatMultiplier,
  formatYears,
  formatPercent,
} from '../lib/formatters';
import type { TreasuryMetrics } from '../types';

interface MetricsBarProps {
  metrics: TreasuryMetrics;
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  tooltip?: string;
  highlight?: boolean;
}

function MetricCard({ label, value, subtext, tooltip, highlight }: MetricCardProps) {
  return (
    <div
      className={`bg-strategy-card border rounded-lg p-4 ${
        highlight ? 'border-strategy-orange' : 'border-strategy-border'
      }`}
      title={tooltip}
    >
      <div className="text-xs text-strategy-text-muted uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${
          highlight ? 'text-strategy-orange' : 'text-strategy-text'
        }`}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-strategy-text-muted mt-1">{subtext}</div>
      )}
    </div>
  );
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="BTC NAV"
        value={formatCurrency(metrics.nav, { compact: true })}
        tooltip="Net Asset Value = BTC Holdings × BTC Price"
        highlight
      />
      <MetricCard
        label="Total Coverage"
        value={formatMultiplier(metrics.totalCoverage)}
        subtext={`Debt: ${formatMultiplier(metrics.debtCoverage)}`}
        tooltip="NAV / Total Obligations"
      />
      <MetricCard
        label="BTC Years of Dividends"
        value={formatYears(metrics.btcYearsOfDividends, 0)}
        tooltip="NAV / Annual Dividend Obligation"
      />
      <MetricCard
        label="Breakeven ARR"
        value={formatPercent(metrics.btcBreakevenArr)}
        tooltip="Required BTC appreciation to cover obligations"
      />
    </div>
  );
}
