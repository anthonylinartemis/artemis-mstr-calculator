import { useState, useEffect, useMemo } from 'react';
import { useMSTRData } from './hooks/useMSTRData';

// Types
interface DebtItem {
  name: string;
  notional: number;
}

interface PrefItem {
  ticker: string;
  notional: number;
}

// Initial data (editable)
const INITIAL_DEBT: DebtItem[] = [
  { name: 'Convert 2028', notional: 1010 },
  { name: 'Convert 2030 B', notional: 2000 },
  { name: 'Convert 2029', notional: 3000 },
  { name: 'Convert 2030 A', notional: 800 },
  { name: 'Convert 2031', notional: 604 },
  { name: 'Convert 2032', notional: 800 },
];

const INITIAL_PREF: PrefItem[] = [
  { ticker: 'STRF', notional: 1284 },
  { ticker: 'STRC', notional: 3379 },
  { ticker: 'STRK', notional: 1402 },
  { ticker: 'STRD', notional: 1402 },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

function App() {
  const { data, isLoading } = useMSTRData();

  // Assumptions
  const [btcPrice, setBtcPrice] = useState(77592);
  const [btcHoldings, setBtcHoldings] = useState(550);
  const [usdReserve, setUsdReserve] = useState(2250);

  // Editable tables
  const [debt, setDebt] = useState<DebtItem[]>(INITIAL_DEBT);
  const [pref, setPref] = useState<PrefItem[]>(INITIAL_PREF);

  // Update from live data
  useEffect(() => {
    if (data) {
      setBtcPrice(Math.round(data.btcPrice));
      setBtcHoldings(Math.round(data.btcHoldings / 1000)); // Convert to thousands
    }
  }, [data]);

  // Calculations
  const btcValue = useMemo(() => btcPrice * btcHoldings * 1000, [btcPrice, btcHoldings]);
  const btcValueM = btcValue / 1_000_000;

  const totalDebt = useMemo(() => debt.reduce((sum, d) => sum + d.notional, 0), [debt]);
  const totalPref = useMemo(() => pref.reduce((sum, p) => sum + p.notional, 0), [pref]);
  const totalDebtPref = totalDebt + totalPref;

  // Cumulative calculations for debt
  const debtWithCumulative = useMemo(() => {
    let cumulative = 0;
    return debt.map((d) => {
      cumulative += d.notional;
      const coverage = (btcValueM + usdReserve) / cumulative;
      return { ...d, cumulative, coverage };
    });
  }, [debt, btcValueM, usdReserve]);

  // Cumulative calculations for pref (continues from debt)
  const prefWithCumulative = useMemo(() => {
    let cumulative = totalDebt;
    return pref.map((p) => {
      cumulative += p.notional;
      const coverage = (btcValueM + usdReserve) / cumulative;
      return { ...p, cumulative, coverage };
    });
  }, [pref, totalDebt, btcValueM, usdReserve]);

  const totalCumulative = totalDebtPref;
  const totalCoverage = (btcValueM + usdReserve) / totalCumulative;

  // Update debt notional
  const updateDebt = (index: number, value: number) => {
    const newDebt = [...debt];
    newDebt[index] = { ...newDebt[index], notional: value };
    setDebt(newDebt);
  };

  // Update pref notional
  const updatePref = (index: number, value: number) => {
    const newPref = [...pref];
    newPref[index] = { ...newPref[index], notional: value };
    setPref(newPref);
  };

  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 5) return 'text-green-400';
    if (coverage >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200 p-6 font-sans">
      {/* Assumptions Row */}
      <div className="flex items-center gap-8 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Assumptions:</span>
          <span className="text-gray-400">BTC Price</span>
          <span className="text-gray-400">$</span>
          <input
            type="number"
            value={btcPrice}
            onChange={(e) => setBtcPrice(Number(e.target.value))}
            className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-right"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">BTC Holdings</span>
          <input
            type="number"
            value={btcHoldings}
            onChange={(e) => setBtcHoldings(Number(e.target.value))}
            className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-20 text-white text-right"
          />
          <span className="text-gray-400">k</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-400">BTC Value:</span>
          <span className="text-yellow-400 text-xl font-bold">
            {formatCurrency(Math.round(btcValueM))}M
          </span>
          {isLoading && <span className="text-gray-500 text-sm">(loading...)</span>}
        </div>
      </div>

      {/* USD Reserve */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-yellow-400">USD Reserve</span>
        <span className="text-gray-400">$</span>
        <input
          type="number"
          value={usdReserve}
          onChange={(e) => setUsdReserve(Number(e.target.value))}
          className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-right"
        />
        <span className="text-gray-400">M</span>
      </div>

      {/* Debt Table */}
      <table className="w-full mb-4">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left py-2 font-normal w-1/3">Debt</th>
            <th className="text-center py-2 font-normal">Notional ($M)</th>
            <th className="text-center py-2 font-normal">Cum Notional ($M)</th>
            <th className="text-right py-2 font-normal">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {debtWithCumulative.map((item, i) => (
            <tr key={item.name} className="border-t border-gray-700">
              <td className="py-2 text-gray-300">{item.name}</td>
              <td className="py-2 text-center">
                <input
                  type="number"
                  value={item.notional}
                  onChange={(e) => updateDebt(i, Number(e.target.value))}
                  className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
                />
              </td>
              <td className="py-2 text-center text-gray-300">
                {formatCurrency(item.cumulative)}
              </td>
              <td className={`py-2 text-right font-medium ${getCoverageColor(item.coverage)}`}>
                {item.coverage.toFixed(1)}x
              </td>
            </tr>
          ))}
          {/* Total Debt Row */}
          <tr className="border-t-2 border-gray-600">
            <td className="py-2 text-yellow-400 font-medium">Total Debt</td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalDebt)}
            </td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalDebt)}
            </td>
            <td className={`py-2 text-right font-medium ${getCoverageColor((btcValueM + usdReserve) / totalDebt)}`}>
              {((btcValueM + usdReserve) / totalDebt).toFixed(1)}x
            </td>
          </tr>
        </tbody>
      </table>

      {/* Preferred Stock Table */}
      <table className="w-full mb-4">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left py-2 font-normal w-1/3">Preferred Stock</th>
            <th className="text-center py-2 font-normal">Notional ($M)</th>
            <th className="text-center py-2 font-normal">Cum Notional ($M)</th>
            <th className="text-right py-2 font-normal">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {prefWithCumulative.map((item, i) => (
            <tr key={item.ticker} className="border-t border-gray-700">
              <td className="py-2 text-gray-300">{item.ticker}</td>
              <td className="py-2 text-center">
                <input
                  type="number"
                  value={item.notional}
                  onChange={(e) => updatePref(i, Number(e.target.value))}
                  className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
                />
              </td>
              <td className="py-2 text-center text-gray-300">
                {formatCurrency(item.cumulative)}
              </td>
              <td className={`py-2 text-right font-medium ${getCoverageColor(item.coverage)}`}>
                {item.coverage.toFixed(1)}x
              </td>
            </tr>
          ))}
          {/* Total Pref Row */}
          <tr className="border-t-2 border-gray-600">
            <td className="py-2 text-yellow-400 font-medium">Total Pref</td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalPref)}
            </td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalDebt + totalPref)}
            </td>
            <td className={`py-2 text-right font-medium ${getCoverageColor(totalCoverage)}`}>
              {totalCoverage.toFixed(1)}x
            </td>
          </tr>
        </tbody>
      </table>

      {/* Total Debt + Pref */}
      <table className="w-full">
        <tbody>
          <tr className="border-t-2 border-gray-500">
            <td className="py-2 text-yellow-400 font-medium w-1/3">Total Debt + Pref</td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalDebtPref)}
            </td>
            <td className="py-2 text-center text-yellow-400 font-medium">
              {formatCurrency(totalCumulative)}
            </td>
            <td className={`py-2 text-right font-medium ${getCoverageColor(totalCoverage)}`}>
              {totalCoverage.toFixed(1)}x
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default App;
