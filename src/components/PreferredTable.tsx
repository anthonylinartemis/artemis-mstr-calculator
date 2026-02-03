import {
  formatCurrency,
  formatMultiplier,
  formatPercent,
} from '../lib/formatters';
import { getCoverageColor, getCoverageTextColor } from '../lib/calculations';
import type { PreferredMetrics } from '../types';

interface PreferredTableProps {
  metrics: PreferredMetrics[];
}

export function PreferredTable({ metrics }: PreferredTableProps) {
  return (
    <div className="bg-strategy-card border border-strategy-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-strategy-border">
        <h3 className="text-lg font-semibold text-strategy-text">
          Preferred Stock
        </h3>
        <p className="text-xs text-strategy-text-muted mt-1">
          Perpetual preferred equity securities
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-strategy-bg text-strategy-text-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Ticker</th>
              <th className="px-4 py-3 text-right">Notional</th>
              <th className="px-4 py-3 text-right">Cumulative</th>
              <th className="px-4 py-3 text-right">Annual Div</th>
              <th className="px-4 py-3 text-right">Coverage</th>
              <th className="px-4 py-3 text-right">BTC Risk</th>
              <th className="px-4 py-3 text-right">BTC Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-strategy-border">
            {metrics.map((m) => (
              <tr
                key={m.instrument.id}
                className="hover:bg-strategy-bg/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-strategy-orange">
                    {m.instrument.ticker}
                  </div>
                  <div className="text-xs text-strategy-text-muted">
                    {m.instrument.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-strategy-text font-mono">
                  {formatCurrency(m.instrument.notional * 1_000_000, {
                    compact: true,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-strategy-text font-mono">
                  {formatCurrency(m.cumulativeNotional * 1_000_000, {
                    compact: true,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-strategy-text font-mono">
                  {formatCurrency(m.annualDividend * 1_000_000, {
                    compact: true,
                  })}
                  <div className="text-xs text-strategy-text-muted">
                    {formatPercent(m.instrument.dividendRate)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-bold ${getCoverageColor(
                      m.btcRating
                    )} ${getCoverageTextColor(m.btcRating)}`}
                  >
                    {formatMultiplier(m.btcRating)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-strategy-text-muted font-mono">
                  {formatPercent(m.btcRisk)}
                </td>
                <td className="px-4 py-3 text-right text-strategy-text-muted font-mono">
                  {formatPercent(m.btcCredit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
