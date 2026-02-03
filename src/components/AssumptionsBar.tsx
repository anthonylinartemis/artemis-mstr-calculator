import { formatCurrency, formatNumber, formatPercent } from '../lib/formatters';
import type { Assumptions } from '../types';

interface AssumptionsBarProps {
  assumptions: Assumptions;
  onChange: (assumptions: Assumptions) => void;
  isLive: boolean;
  lastUpdated: Date | null;
  source: string;
  onRefresh: () => void;
}

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  formatter: (value: number) => string;
  step?: number;
  min?: number;
  tooltip?: string;
}

function InputField({
  label,
  value,
  onChange,
  formatter,
  step = 1,
  min = 0,
  tooltip,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-strategy-text-muted uppercase tracking-wider">
        {label}
        {tooltip && (
          <span className="ml-1 cursor-help" title={tooltip}>
            ⓘ
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={step}
          min={min}
          className="w-full bg-strategy-card border border-strategy-border rounded px-3 py-2 text-strategy-text font-mono text-sm focus:border-strategy-orange focus:outline-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-strategy-text-muted text-xs pointer-events-none">
          {formatter(value)}
        </div>
      </div>
    </div>
  );
}

export function AssumptionsBar({
  assumptions,
  onChange,
  isLive,
  lastUpdated,
  source,
  onRefresh,
}: AssumptionsBarProps) {
  const updateField = <K extends keyof Assumptions>(
    field: K,
    value: Assumptions[K]
  ) => {
    onChange({ ...assumptions, [field]: value });
  };

  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return 'Never';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    return `${Math.floor(diffSec / 60)}m ago`;
  };

  return (
    <div className="bg-strategy-card border border-strategy-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-strategy-text">
          Assumptions
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-strategy-green animate-pulse' : 'bg-strategy-yellow'
              }`}
            />
            <span className="text-xs text-strategy-text-muted">
              {isLive ? 'Live' : 'Cached'} • {source} • {formatRelativeTime(lastUpdated)}
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs text-strategy-orange hover:text-strategy-orange-dark transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InputField
          label="BTC Price"
          value={assumptions.btcPrice}
          onChange={(v) => updateField('btcPrice', v)}
          formatter={(v) => formatCurrency(v, { compact: true })}
          step={1000}
          tooltip="Current Bitcoin price in USD"
        />
        <InputField
          label="BTC Holdings"
          value={assumptions.btcHoldings}
          onChange={(v) => updateField('btcHoldings', v)}
          formatter={(v) => formatNumber(v, { compact: true })}
          step={1000}
          tooltip="MicroStrategy's total BTC holdings"
        />
        <InputField
          label="BTC Volatility"
          value={assumptions.btcVolatility}
          onChange={(v) => updateField('btcVolatility', v)}
          formatter={(v) => formatPercent(v)}
          step={0.05}
          min={0}
          tooltip="Annualized BTC price volatility"
        />
        <InputField
          label="BTC ARR"
          value={assumptions.btcArr}
          onChange={(v) => updateField('btcArr', v)}
          formatter={(v) => formatPercent(v)}
          step={0.05}
          tooltip="Expected annual BTC appreciation rate"
        />
      </div>
    </div>
  );
}
