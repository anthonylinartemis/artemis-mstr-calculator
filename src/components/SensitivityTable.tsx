import { useState, useMemo } from 'react';

interface SecurityOption {
  id: string;
  name: string;
  notional: number;
  type: 'debt' | 'pref';
}

interface SensitivityTableProps {
  securities: SecurityOption[];
  btcPrice: number;
  btcHoldings: number; // in thousands for MSTR, actual for Strive
  usdReserve: number;
  holdingsUnit: 'thousands' | 'actual'; // MSTR uses thousands, Strive uses actual
}

const PRICE_STEPS = [30000, 50000, 75000, 100000, 150000, 200000];

function getCoverageColor(coverage: number): string {
  if (coverage >= 10) return 'bg-green-600';
  if (coverage >= 5) return 'bg-green-500';
  if (coverage >= 3) return 'bg-yellow-500';
  if (coverage >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getCoverageTextColor(coverage: number): string {
  if (coverage >= 5) return 'text-white';
  if (coverage >= 2) return 'text-black';
  return 'text-white';
}

export function SensitivityTable({
  securities,
  btcPrice,
  btcHoldings,
  usdReserve,
  holdingsUnit,
}: SensitivityTableProps) {
  const [selectedSecurityId, setSelectedSecurityId] = useState<string>(
    securities[0]?.id || ''
  );
  const [holdingsIncrement, setHoldingsIncrement] = useState<number>(
    holdingsUnit === 'thousands' ? 100 : 5000
  );

  // Find the selected security and calculate cumulative notional up to and including it
  const cumulativeNotional = useMemo(() => {
    let cumulative = 0;
    for (const sec of securities) {
      cumulative += sec.notional;
      if (sec.id === selectedSecurityId) break;
    }
    return cumulative;
  }, [securities, selectedSecurityId]);

  // Generate dynamic holdings range centered on current holdings
  const holdingsRange = useMemo(() => {
    const baseHoldings = holdingsUnit === 'thousands' ? btcHoldings : btcHoldings;
    return [
      baseHoldings - 3 * holdingsIncrement,
      baseHoldings - 2 * holdingsIncrement,
      baseHoldings - holdingsIncrement,
      baseHoldings,
      baseHoldings + holdingsIncrement,
      baseHoldings + 2 * holdingsIncrement,
      baseHoldings + 3 * holdingsIncrement,
    ].filter(h => h > 0);
  }, [btcHoldings, holdingsIncrement, holdingsUnit]);

  // Calculate coverage for a specific price and holdings
  const calcCoverageFor = (price: number, holdings: number): number => {
    // For MSTR, holdings is in thousands, so multiply by 1000
    const actualHoldings = holdingsUnit === 'thousands' ? holdings * 1000 : holdings;
    const btcValue = (price * actualHoldings) / 1_000_000; // in millions
    const totalAssets = btcValue + usdReserve;
    return cumulativeNotional > 0 ? totalAssets / cumulativeNotional : 0;
  };

  // Check if cell is current position
  const isCurrentCell = (price: number, holdings: number): boolean => {
    const priceMatch = Math.abs(price - btcPrice) < btcPrice * 0.1;
    const holdingsMatch = holdings === btcHoldings;
    return priceMatch && holdingsMatch;
  };

  const selectedSecurity = securities.find(s => s.id === selectedSecurityId);

  return (
    <div className="bg-lavender-card border border-lavender-border rounded-lg overflow-hidden">
      {/* Header with controls */}
      <div className="px-4 py-4 border-b border-lavender-border">
        <h3 className="text-lg font-semibold text-white mb-3">
          Coverage Sensitivity Analysis
        </h3>

        <div className="flex flex-wrap items-center gap-4">
          {/* Security Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Security:</label>
            <select
              value={selectedSecurityId}
              onChange={(e) => setSelectedSecurityId(e.target.value)}
              className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 text-white text-sm focus:border-lavender-accent"
            >
              {securities.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.type === 'debt' ? 'Debt' : 'Pref'}) - ${sec.notional}M
                </option>
              ))}
            </select>
          </div>

          {/* Holdings Increment Control */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">
              Holdings Increment ({holdingsUnit === 'thousands' ? 'k' : 'BTC'}):
            </label>
            <input
              type="number"
              value={holdingsIncrement}
              onChange={(e) => setHoldingsIncrement(Number(e.target.value))}
              className="bg-lavender-bg border border-lavender-border rounded px-2 py-1.5 w-24 text-white text-right text-sm"
            />
          </div>
        </div>

        {selectedSecurity && (
          <div className="mt-2 text-sm text-gray-400">
            Cumulative notional through {selectedSecurity.name}: ${cumulativeNotional.toLocaleString()}M
          </div>
        )}
      </div>

      {/* Sensitivity Matrix */}
      <div className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-xs text-gray-400">
                Holdings ↓ / Price →
              </th>
              {PRICE_STEPS.map((price) => (
                <th
                  key={price}
                  className={`px-2 py-2 text-center text-xs font-mono ${
                    Math.abs(price - btcPrice) < btcPrice * 0.1
                      ? 'text-lavender-accent font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  ${(price / 1000).toFixed(0)}k
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdingsRange.map((holdings) => (
              <tr key={holdings}>
                <td
                  className={`px-2 py-2 text-xs font-mono ${
                    holdings === btcHoldings
                      ? 'text-lavender-accent font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  {holdingsUnit === 'thousands'
                    ? `${holdings}k`
                    : holdings.toLocaleString()}
                </td>
                {PRICE_STEPS.map((price) => {
                  const coverage = calcCoverageFor(price, holdings);
                  const isCurrent = isCurrentCell(price, holdings);

                  return (
                    <td key={price} className="px-1 py-1">
                      <div
                        className={`
                          px-2 py-2 rounded text-center text-sm font-bold
                          ${getCoverageColor(coverage)}
                          ${getCoverageTextColor(coverage)}
                          ${isCurrent ? 'ring-2 ring-lavender-accent ring-offset-2 ring-offset-lavender-card' : ''}
                        `}
                        title={`${holdings}${holdingsUnit === 'thousands' ? 'k' : ''} BTC @ $${price.toLocaleString()} = ${coverage.toFixed(1)}x coverage`}
                      >
                        {coverage.toFixed(1)}x
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-lavender-border flex items-center gap-4 text-xs">
        <span className="text-gray-400">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-gray-400">≥10x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-gray-400">5-10x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span className="text-gray-400">3-5x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-gray-400">2-3x</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-400">&lt;2x</span>
        </div>
      </div>
    </div>
  );
}
