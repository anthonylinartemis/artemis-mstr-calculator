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
  price?: number;
  change?: number;
}

// MSTR Initial data
const INITIAL_DEBT: DebtItem[] = [
  { name: 'Convert 2028', notional: 1010 },
  { name: 'Convert 2030 B', notional: 2000 },
  { name: 'Convert 2029', notional: 3000 },
  { name: 'Convert 2030 A', notional: 800 },
  { name: 'Convert 2031', notional: 604 },
  { name: 'Convert 2032', notional: 800 },
];

const INITIAL_PREF: PrefItem[] = [
  { ticker: 'STRF', notional: 1284, price: 85.50, change: -2.3 },
  { ticker: 'STRC', notional: 3379, price: 92.10, change: -1.8 },
  { ticker: 'STRK', notional: 1402, price: 78.25, change: -3.1 },
  { ticker: 'STRD', notional: 1402, price: 88.00, change: -2.5 },
];

// Strive Initial data (ASST)
const STRIVE_INITIAL_PREF: PrefItem[] = [
  { ticker: 'SATA', notional: 500, price: 95.00, change: -1.5 },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

type TabType = 'mstr' | 'strive';

function App() {
  const { data, isLoading } = useMSTRData();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('mstr');

  // MSTR Actuals (from API)
  const [actualBtcPrice, setActualBtcPrice] = useState(77592);
  const [actualBtcHoldings, setActualBtcHoldings] = useState(550);

  // MSTR Assumptions (editable, defaults to actuals)
  const [btcPrice, setBtcPrice] = useState(77592);
  const [btcHoldings, setBtcHoldings] = useState(550);
  const [usdReserve, setUsdReserve] = useState(2250);

  // MSTR Editable tables
  const [debt, setDebt] = useState<DebtItem[]>(INITIAL_DEBT);
  const [pref, setPref] = useState<PrefItem[]>(INITIAL_PREF);

  // Strive data
  const [striveBtcHoldings, setStriveBtcHoldings] = useState(50); // in thousands
  const [striveUsdReserve, setStriveUsdReserve] = useState(100);
  const [strivePref, setStrivePref] = useState<PrefItem[]>(STRIVE_INITIAL_PREF);

  // Update from live data
  useEffect(() => {
    if (data) {
      const price = Math.round(data.btcPrice);
      const holdings = Math.round(data.btcHoldings / 1000);
      setActualBtcPrice(price);
      setActualBtcHoldings(holdings);
      setBtcPrice(price);
      setBtcHoldings(holdings);
    }
  }, [data]);

  // MSTR Calculations
  const btcValueM = useMemo(() => (btcPrice * btcHoldings * 1000) / 1_000_000, [btcPrice, btcHoldings]);
  const totalDebt = useMemo(() => debt.reduce((sum, d) => sum + d.notional, 0), [debt]);
  const totalPref = useMemo(() => pref.reduce((sum, p) => sum + p.notional, 0), [pref]);
  const totalDebtPref = totalDebt + totalPref;

  const debtWithCumulative = useMemo(() => {
    let cumulative = 0;
    return debt.map((d) => {
      cumulative += d.notional;
      const coverage = (btcValueM + usdReserve) / cumulative;
      return { ...d, cumulative, coverage };
    });
  }, [debt, btcValueM, usdReserve]);

  const prefWithCumulative = useMemo(() => {
    let cumulative = totalDebt;
    return pref.map((p) => {
      cumulative += p.notional;
      const coverage = (btcValueM + usdReserve) / cumulative;
      return { ...p, cumulative, coverage };
    });
  }, [pref, totalDebt, btcValueM, usdReserve]);

  const totalCoverage = (btcValueM + usdReserve) / totalDebtPref;

  // Strive Calculations
  const striveBtcValueM = useMemo(
    () => (btcPrice * striveBtcHoldings * 1000) / 1_000_000,
    [btcPrice, striveBtcHoldings]
  );
  const striveTotalPref = useMemo(() => strivePref.reduce((sum, p) => sum + p.notional, 0), [strivePref]);

  const strivePrefWithCumulative = useMemo(() => {
    let cumulative = 0;
    return strivePref.map((p) => {
      cumulative += p.notional;
      const coverage = (striveBtcValueM + striveUsdReserve) / cumulative;
      return { ...p, cumulative, coverage };
    });
  }, [strivePref, striveBtcValueM, striveUsdReserve]);

  const striveTotalCoverage = striveTotalPref > 0 ? (striveBtcValueM + striveUsdReserve) / striveTotalPref : 0;

  // Handlers
  const updateDebt = (index: number, value: number) => {
    const newDebt = [...debt];
    newDebt[index] = { ...newDebt[index], notional: value };
    setDebt(newDebt);
  };

  const updatePref = (index: number, value: number) => {
    const newPref = [...pref];
    newPref[index] = { ...newPref[index], notional: value };
    setPref(newPref);
  };

  const updateStrivePref = (index: number, value: number) => {
    const newPref = [...strivePref];
    newPref[index] = { ...newPref[index], notional: value };
    setStrivePref(newPref);
  };

  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 5) return 'text-green-400';
    if (coverage >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const resetToActuals = () => {
    setBtcPrice(actualBtcPrice);
    setBtcHoldings(actualBtcHoldings);
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200 p-6 font-sans">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('mstr')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeTab === 'mstr'
              ? 'bg-yellow-500 text-black'
              : 'bg-[#2d2d44] text-gray-300 hover:bg-[#3d3d54]'
          }`}
        >
          MSTR (Strategy)
        </button>
        <button
          onClick={() => setActiveTab('strive')}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            activeTab === 'strive'
              ? 'bg-yellow-500 text-black'
              : 'bg-[#2d2d44] text-gray-300 hover:bg-[#3d3d54]'
          }`}
        >
          ASST (Strive)
        </button>
      </div>

      {activeTab === 'mstr' ? (
        <>
          {/* MSTR Assumptions Row */}
          <div className="flex items-start gap-8 mb-6 flex-wrap">
            {/* Actuals Section */}
            <div className="bg-[#252540] rounded p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Actuals (Live)</div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-400 text-sm">BTC Price: </span>
                  <span className="text-green-400 font-medium">${actualBtcPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Holdings: </span>
                  <span className="text-green-400 font-medium">{actualBtcHoldings}k</span>
                </div>
              </div>
              {isLoading && <span className="text-gray-500 text-xs">(updating...)</span>}
            </div>

            {/* Assumptions Section */}
            <div className="bg-[#252540] rounded p-3 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Assumptions</div>
                <button
                  onClick={resetToActuals}
                  className="text-xs text-yellow-400 hover:text-yellow-300"
                >
                  Reset
                </button>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">BTC Price $</span>
                  <input
                    type="number"
                    value={btcPrice}
                    onChange={(e) => setBtcPrice(Number(e.target.value))}
                    className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-right text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">Holdings</span>
                  <input
                    type="number"
                    value={btcHoldings}
                    onChange={(e) => setBtcHoldings(Number(e.target.value))}
                    className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-20 text-white text-right text-sm"
                  />
                  <span className="text-gray-400 text-sm">k</span>
                </div>
              </div>
            </div>

            {/* BTC Value */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-400">BTC Value:</span>
              <span className="text-yellow-400 text-2xl font-bold">
                {formatCurrency(Math.round(btcValueM))}M
              </span>
            </div>
          </div>

          {/* USD Reserve */}
          <div className="flex items-center gap-2 mb-4 bg-[#252540] rounded p-3 border border-gray-600 w-fit">
            <span className="text-yellow-400 font-medium">USD Reserve</span>
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
          <table className="w-full mb-2">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left py-2 font-normal" style={{ width: '30%' }}>Debt</th>
                <th className="text-center py-2 font-normal" style={{ width: '20%' }}>Notional ($M)</th>
                <th className="text-center py-2 font-normal" style={{ width: '25%' }}>Cum Notional ($M)</th>
                <th className="text-right py-2 font-normal" style={{ width: '25%' }}>Coverage</th>
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
                  <td className="py-2 text-center text-gray-300">{formatCurrency(item.cumulative)}</td>
                  <td className={`py-2 text-right font-medium ${getCoverageColor(item.coverage)}`}>
                    {item.coverage.toFixed(1)}x
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-500">
                <td className="py-2 text-yellow-400 font-medium">Total Debt</td>
                <td className="py-2 text-center text-yellow-400 font-medium">{formatCurrency(totalDebt)}</td>
                <td className="py-2 text-center text-yellow-400 font-medium">{formatCurrency(totalDebt)}</td>
                <td className={`py-2 text-right font-medium ${getCoverageColor((btcValueM + usdReserve) / totalDebt)}`}>
                  {((btcValueM + usdReserve) / totalDebt).toFixed(1)}x
                </td>
              </tr>
            </tbody>
          </table>

          {/* Preferred Stock Table */}
          <table className="w-full mb-2">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left py-2 font-normal" style={{ width: '30%' }}>Preferred Stock</th>
                <th className="text-center py-2 font-normal" style={{ width: '20%' }}>Notional ($M)</th>
                <th className="text-center py-2 font-normal" style={{ width: '25%' }}>Cum Notional ($M)</th>
                <th className="text-right py-2 font-normal" style={{ width: '25%' }}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {prefWithCumulative.map((item, i) => (
                <tr key={item.ticker} className="border-t border-gray-700">
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 font-medium">{item.ticker}</span>
                      {item.price && (
                        <span className="text-gray-400 text-sm">
                          ${item.price.toFixed(2)}
                          <span className={item.change && item.change < 0 ? 'text-red-400 ml-1' : 'text-green-400 ml-1'}>
                            ({item.change && item.change > 0 ? '+' : ''}{item.change?.toFixed(1)}%)
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      value={item.notional}
                      onChange={(e) => updatePref(i, Number(e.target.value))}
                      className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
                    />
                  </td>
                  <td className="py-2 text-center text-gray-300">{formatCurrency(item.cumulative)}</td>
                  <td className={`py-2 text-right font-medium ${getCoverageColor(item.coverage)}`}>
                    {item.coverage.toFixed(1)}x
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-500">
                <td className="py-2 text-yellow-400 font-medium">Total Pref</td>
                <td className="py-2 text-center text-yellow-400 font-medium">{formatCurrency(totalPref)}</td>
                <td className="py-2 text-center text-yellow-400 font-medium">{formatCurrency(totalDebtPref)}</td>
                <td className={`py-2 text-right font-medium ${getCoverageColor(totalCoverage)}`}>
                  {totalCoverage.toFixed(1)}x
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Debt + Pref */}
          <table className="w-full">
            <tbody>
              <tr className="border-t-2 border-yellow-500/50">
                <td className="py-3 text-yellow-400 font-bold" style={{ width: '30%' }}>Total Debt + Pref</td>
                <td className="py-3 text-center text-yellow-400 font-bold" style={{ width: '20%' }}>
                  {formatCurrency(totalDebtPref)}
                </td>
                <td className="py-3 text-center text-yellow-400 font-bold" style={{ width: '25%' }}>
                  {formatCurrency(totalDebtPref)}
                </td>
                <td className={`py-3 text-right font-bold ${getCoverageColor(totalCoverage)}`} style={{ width: '25%' }}>
                  {totalCoverage.toFixed(1)}x
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <>
          {/* Strive Tab */}
          <div className="flex items-start gap-8 mb-6 flex-wrap">
            {/* Strive Assumptions */}
            <div className="bg-[#252540] rounded p-3 border border-gray-600">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Strive (ASST) Assumptions</div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">BTC Price $</span>
                  <span className="text-green-400 font-medium">{btcPrice.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs">(from MSTR)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">Holdings</span>
                  <input
                    type="number"
                    value={striveBtcHoldings}
                    onChange={(e) => setStriveBtcHoldings(Number(e.target.value))}
                    className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-20 text-white text-right text-sm"
                  />
                  <span className="text-gray-400 text-sm">k</span>
                </div>
              </div>
            </div>

            {/* BTC Value */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-400">BTC Value:</span>
              <span className="text-yellow-400 text-2xl font-bold">
                {formatCurrency(Math.round(striveBtcValueM))}M
              </span>
            </div>
          </div>

          {/* Strive USD Reserve */}
          <div className="flex items-center gap-2 mb-4 bg-[#252540] rounded p-3 border border-gray-600 w-fit">
            <span className="text-yellow-400 font-medium">USD Reserve</span>
            <span className="text-gray-400">$</span>
            <input
              type="number"
              value={striveUsdReserve}
              onChange={(e) => setStriveUsdReserve(Number(e.target.value))}
              className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-right"
            />
            <span className="text-gray-400">M</span>
          </div>

          {/* Strive has no debt - just preferred */}
          <div className="text-gray-500 text-sm mb-2 italic">Strive has no convertible debt</div>

          {/* Strive Preferred Stock Table */}
          <table className="w-full mb-2">
            <thead>
              <tr className="text-gray-400 text-sm">
                <th className="text-left py-2 font-normal" style={{ width: '30%' }}>Preferred Stock</th>
                <th className="text-center py-2 font-normal" style={{ width: '20%' }}>Notional ($M)</th>
                <th className="text-center py-2 font-normal" style={{ width: '25%' }}>Cum Notional ($M)</th>
                <th className="text-right py-2 font-normal" style={{ width: '25%' }}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {strivePrefWithCumulative.map((item, i) => (
                <tr key={item.ticker} className="border-t border-gray-700">
                  <td className="py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 font-medium">{item.ticker}</span>
                      {item.price && (
                        <span className="text-gray-400 text-sm">
                          ${item.price.toFixed(2)}
                          <span className={item.change && item.change < 0 ? 'text-red-400 ml-1' : 'text-green-400 ml-1'}>
                            ({item.change && item.change > 0 ? '+' : ''}{item.change?.toFixed(1)}%)
                          </span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      value={item.notional}
                      onChange={(e) => updateStrivePref(i, Number(e.target.value))}
                      className="bg-[#2d2d44] border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
                    />
                  </td>
                  <td className="py-2 text-center text-gray-300">{formatCurrency(item.cumulative)}</td>
                  <td className={`py-2 text-right font-medium ${getCoverageColor(item.coverage)}`}>
                    {item.coverage.toFixed(1)}x
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-yellow-500/50">
                <td className="py-3 text-yellow-400 font-bold">Total Pref</td>
                <td className="py-3 text-center text-yellow-400 font-bold">{formatCurrency(striveTotalPref)}</td>
                <td className="py-3 text-center text-yellow-400 font-bold">{formatCurrency(striveTotalPref)}</td>
                <td className={`py-3 text-right font-bold ${getCoverageColor(striveTotalCoverage)}`}>
                  {striveTotalCoverage.toFixed(1)}x
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
