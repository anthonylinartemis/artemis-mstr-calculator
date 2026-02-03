import { useMemo } from 'react';
import { formatCurrency, formatNumber, formatMultiplier } from '../lib/formatters';
import {
  generateSensitivityMatrix,
  getCoverageColor,
  getCoverageTextColor,
} from '../lib/calculations';
import {
  SENSITIVITY_HOLDINGS_RANGE,
  SENSITIVITY_PRICE_RANGE,
} from '../lib/constants';

interface SensitivityMatrixProps {
  totalObligationsMillions: number;
  currentHoldings: number;
  currentPrice: number;
}

export function SensitivityMatrix({
  totalObligationsMillions,
  currentHoldings,
  currentPrice,
}: SensitivityMatrixProps) {
  const matrix = useMemo(
    () => generateSensitivityMatrix(totalObligationsMillions),
    [totalObligationsMillions]
  );

  // Create a map for quick lookup
  const coverageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const cell of matrix) {
      map.set(`${cell.holdings}-${cell.price}`, cell.coverage);
    }
    return map;
  }, [matrix]);

  const isCurrentCell = (holdings: number, price: number) => {
    const holdingsDiff = Math.abs(holdings - currentHoldings);
    const priceDiff = Math.abs(price - currentPrice);
    // Highlight if within 10% of current values
    return (
      holdingsDiff < currentHoldings * 0.1 && priceDiff < currentPrice * 0.15
    );
  };

  return (
    <div className="bg-strategy-card border border-strategy-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-strategy-border">
        <h3 className="text-lg font-semibold text-strategy-text">
          Coverage Sensitivity Matrix
        </h3>
        <p className="text-xs text-strategy-text-muted mt-1">
          Holdings (rows) vs BTC Price (columns) — coverage ratio
        </p>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs text-strategy-text-muted">
                Holdings ↓ / Price →
              </th>
              {SENSITIVITY_PRICE_RANGE.map((price) => (
                <th
                  key={price}
                  className="px-2 py-2 text-center text-xs text-strategy-text-muted font-mono"
                >
                  {formatCurrency(price, { compact: true })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SENSITIVITY_HOLDINGS_RANGE.map((holdings) => (
              <tr key={holdings}>
                <td className="px-2 py-2 text-xs text-strategy-text-muted font-mono">
                  {formatNumber(holdings, { compact: true })}
                </td>
                {SENSITIVITY_PRICE_RANGE.map((price) => {
                  const coverage = coverageMap.get(`${holdings}-${price}`) ?? 0;
                  const isCurrent = isCurrentCell(holdings, price);

                  return (
                    <td key={price} className="px-1 py-1">
                      <div
                        className={`
                          px-2 py-2 rounded text-center text-xs font-bold
                          ${getCoverageColor(coverage)}
                          ${getCoverageTextColor(coverage)}
                          ${isCurrent ? 'ring-2 ring-strategy-orange ring-offset-1 ring-offset-strategy-card' : ''}
                        `}
                        title={`${formatNumber(holdings)} BTC @ ${formatCurrency(price)} = ${formatMultiplier(coverage)} coverage`}
                      >
                        {formatMultiplier(coverage)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-strategy-border flex items-center gap-4 text-xs">
        <span className="text-strategy-text-muted">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-strategy-text-muted">≥10x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-strategy-text-muted">5-10x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-strategy-text-muted">3-5x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-strategy-text-muted">2-3x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-strategy-text-muted">&lt;2x</span>
        </div>
      </div>
    </div>
  );
}
