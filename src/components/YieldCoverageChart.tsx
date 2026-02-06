import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PREFERRED_YIELDS, COVERAGE_THRESHOLDS } from '../lib/constants';

interface PreferredData {
  ticker: string;
  notional: number;
  coverage: number;
  price?: number; // Current market price
}

interface YieldCoverageChartProps {
  preferredData: PreferredData[];
}

interface ChartDataPoint {
  ticker: string;
  couponRate: number;  // Fixed coupon rate (e.g., 0.10 for 10%)
  ytm: number;         // Yield to Maturity = (Coupon × Par) / Price
  coverage: number;
  notional: number;
  price?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
}

// Par value for preferred stock (standard $100)
const PAR_VALUE = 100;

/**
 * Calculate Yield to Maturity for perpetual preferred stock
 * YTM = Annual Dividend / Current Price
 * Where Annual Dividend = Coupon Rate × Par Value
 *
 * Example: STRF with 10% coupon, $100 par, trading at $85
 * Annual Dividend = 0.10 × $100 = $10
 * YTM = $10 / $85 = 11.76%
 */
function calculateYTM(couponRate: number, currentPrice: number | undefined): number {
  if (!currentPrice || currentPrice <= 0) {
    // If no price available, YTM equals coupon rate (trading at par)
    return couponRate;
  }
  const annualDividend = couponRate * PAR_VALUE;
  return annualDividend / currentPrice;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-lavender-card border border-lavender-border rounded-lg p-3 shadow-lg">
        <p className="text-lavender-accent font-bold text-base">{data.ticker}</p>
        <p className="text-gray-300 text-sm">
          Coupon: <span className="text-white font-medium">{(data.couponRate * 100).toFixed(2)}%</span>
        </p>
        <p className="text-gray-300 text-sm">
          YTM: <span className="text-green-400 font-medium">{(data.ytm * 100).toFixed(2)}%</span>
        </p>
        {data.price && (
          <p className="text-gray-300 text-sm">
            Price: <span className="text-white font-medium">${data.price.toFixed(2)}</span>
          </p>
        )}
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
  const chartData: ChartDataPoint[] = preferredData.map((item) => {
    const couponRate = PREFERRED_YIELDS[item.ticker] ?? 0;
    const ytm = calculateYTM(couponRate, item.price);

    return {
      ticker: item.ticker,
      couponRate,
      ytm,
      coverage: item.coverage,
      notional: item.notional,
      price: item.price,
    };
  });

  const maxCoverage = Math.max(...chartData.map((d) => d.coverage), COVERAGE_THRESHOLDS.GOOD);
  const maxYtm = Math.max(...chartData.map((d) => d.ytm));

  return (
    <div className="bg-lavender-card rounded-lg border border-lavender-border p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-300 text-sm font-medium">YTM vs Coverage</h3>
        <p className="text-gray-500 text-xs">
          YTM = (Coupon % × $100 Par) / Market Price
        </p>
      </div>
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
            dataKey="ytm"
            name="YTM"
            domain={[0, Math.ceil(maxYtm * 100 * 1.2) / 100]}
            tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            axisLine={{ stroke: '#4d4a6a' }}
            tickLine={{ stroke: '#4d4a6a' }}
            label={{
              value: 'YTM (%)',
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
