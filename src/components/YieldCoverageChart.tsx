import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { PREFERRED_YIELDS, COVERAGE_THRESHOLDS } from '../lib/constants';

interface PreferredData {
  ticker: string;
  notional: number;
  coverage: number;
}

interface YieldCoverageChartProps {
  preferredData: PreferredData[];
}

interface ChartDataPoint {
  ticker: string;
  yield: number;
  coverage: number;
  notional: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-lavender-card border border-lavender-border rounded-lg p-3 shadow-lg">
        <p className="text-lavender-accent font-bold text-base">{data.ticker}</p>
        <p className="text-gray-300 text-sm">
          Yield: <span className="text-white font-medium">{(data.yield * 100).toFixed(2)}%</span>
        </p>
        <p className="text-gray-300 text-sm">
          Coverage: <span className="text-white font-medium">{data.coverage.toFixed(2)}x</span>
        </p>
        <p className="text-gray-300 text-sm">
          Notional: <span className="text-white font-medium">${data.notional.toLocaleString()}M</span>
        </p>
      </div>
    );
  }
  return null;
}

export function YieldCoverageChart({ preferredData }: YieldCoverageChartProps) {
  // Transform data for the scatter chart
  const chartData: ChartDataPoint[] = preferredData.map((item) => ({
    ticker: item.ticker,
    yield: PREFERRED_YIELDS[item.ticker] ?? 0,
    coverage: item.coverage,
    notional: item.notional,
  }));

  // Calculate axis domains
  const maxCoverage = Math.max(...chartData.map((d) => d.coverage), COVERAGE_THRESHOLDS.GOOD);
  const maxYield = Math.max(...chartData.map((d) => d.yield));

  return (
    <div className="bg-lavender-card rounded-lg border border-lavender-border p-4 mt-4">
      <h3 className="text-gray-300 text-sm font-medium mb-4">Yield vs Coverage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4d4a6a" />
          <XAxis
            type="number"
            dataKey="coverage"
            name="Coverage"
            unit="x"
            domain={[0, Math.ceil(maxCoverage * 1.1)]}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#4d4a6a' }}
            tickLine={{ stroke: '#4d4a6a' }}
            label={{
              value: 'Coverage Ratio',
              position: 'insideBottom',
              offset: -10,
              fill: '#9ca3af',
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="yield"
            name="Yield"
            domain={[0, Math.ceil(maxYield * 100 * 1.2) / 100]}
            tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#4d4a6a' }}
            tickLine={{ stroke: '#4d4a6a' }}
            label={{
              value: 'Yield (%)',
              angle: -90,
              position: 'insideLeft',
              fill: '#9ca3af',
              fontSize: 12,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={() => (
              <span className="text-gray-300 text-sm">Preferred Securities</span>
            )}
          />
          <ReferenceLine
            x={COVERAGE_THRESHOLDS.GOOD}
            stroke="#22c55e"
            strokeDasharray="5 5"
            label={{
              value: `${COVERAGE_THRESHOLDS.GOOD}x`,
              position: 'top',
              fill: '#22c55e',
              fontSize: 11,
            }}
          />
          <Scatter
            name="Preferred Securities"
            data={chartData}
            fill="#9d8df1"
            shape={(props) => {
              const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: ChartDataPoint };
              if (cx === undefined || cy === undefined || !payload) return null;
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill="#9d8df1"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    x={cx}
                    y={cy - 14}
                    textAnchor="middle"
                    fill="#e5e7eb"
                    fontSize={11}
                    fontWeight="bold"
                  >
                    {payload.ticker}
                  </text>
                </g>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
