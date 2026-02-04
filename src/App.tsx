import { useState, useEffect, useMemo } from 'react';
import { useMSTRData } from './hooks/useMSTRData';
import { usePreferredPrices } from './hooks/usePreferredPrices';
import { COVERAGE_THRESHOLDS, STRATEGY_DEFINITIONS } from './lib/constants';
import { SensitivityTable } from './components/SensitivityTable';
import { YieldCoverageChart } from './components/YieldCoverageChart';
import artemisLogo from '../logo/Purple gradient icon.jpg';
import bitcoinLogo from '../logo/Bitcoin.png';

// Tooltip component for column header definitions
function HeaderTooltip({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  return (
    <span className="relative group cursor-help">
      {children}
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-lavender-bg border border-lavender-accent rounded-lg text-xs text-gray-300 whitespace-normal w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg">
        {tooltip}
      </span>
    </span>
  );
}

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

interface LivePrices {
  [ticker: string]: { price: number; change: number | null } | undefined;
}

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

const STRIVE_INITIAL_PREF: PrefItem[] = [
  { ticker: 'SATA', notional: 500 },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

/**
 * Merge live prices into preferred stock items
 */
function mergePricesIntoPref(prefItems: PrefItem[], livePrices: LivePrices): PrefItem[] {
  return prefItems.map((item) => {
    const livePrice = livePrices[item.ticker];
    if (livePrice) {
      return {
        ...item,
        price: livePrice.price,
        change: livePrice.change ?? undefined,
      };
    }
    return item;
  });
}

/**
 * Get color class based on coverage ratio thresholds
 * Uses COVERAGE_THRESHOLDS from constants for consistency
 */
function getCoverageColor(coverage: number): string {
  if (coverage >= COVERAGE_THRESHOLDS.GOOD) return 'text-green-400';
  if (coverage >= COVERAGE_THRESHOLDS.ADEQUATE) return 'text-yellow-400';
  return 'text-red-400';
}

type TabType = 'mstr' | 'strive' | 'mstr-sensitivity' | 'strive-sensitivity';

function App() {
  const { data, isLoading } = useMSTRData();
  const { prices: livePrices, isLoading: pricesLoading } = usePreferredPrices();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('mstr');

  // MSTR Actuals (from API) - default to known holdings per bitcointreasuries.net
  const [actualBtcPrice, setActualBtcPrice] = useState(97000);
  const [actualBtcHoldings, setActualBtcHoldings] = useState(714); // 714k BTC per bitcointreasuries.net

  // MSTR Assumptions (editable, defaults to actuals)
  const [btcPrice, setBtcPrice] = useState(97000);
  const [btcHoldings, setBtcHoldings] = useState(714);
  const [usdReserve, setUsdReserve] = useState(2250);

  // MSTR Editable tables
  const [debt, setDebt] = useState<DebtItem[]>(INITIAL_DEBT);
  const [pref, setPref] = useState<PrefItem[]>(INITIAL_PREF);

  // Additional notional for quick adjustments (user can add to totals)
  const [additionalDebt, setAdditionalDebt] = useState(0);
  const [additionalPref, setAdditionalPref] = useState(0);

  // Strive data - BTC holdings per treasury.strive.com (actual BTC count)
  const [striveBtcHoldings, setStriveBtcHoldings] = useState(13128); // ~13,128 BTC
  const [striveUsdReserve, setStriveUsdReserve] = useState(24); // $24M USD reserve
  const [strivePref, setStrivePref] = useState<PrefItem[]>(STRIVE_INITIAL_PREF);

  // Update from live API data (BTC price + MSTR holdings)
  useEffect(() => {
    if (data) {
      const price = Math.round(data.btcPrice);
      const holdings = Math.round(data.btcHoldings / 1000);

      // Use live data from MicroStrategy API
      setActualBtcPrice(price);
      setBtcPrice(price);
      setActualBtcHoldings(holdings);
      setBtcHoldings(holdings);
    }
  }, [data]);

  // Merge live prices into pref items
  const prefWithPrices = useMemo(
    () => mergePricesIntoPref(pref, livePrices),
    [pref, livePrices]
  );

  const strivePrefWithPrices = useMemo(
    () => mergePricesIntoPref(strivePref, livePrices),
    [strivePref, livePrices]
  );

  // MSTR Calculations
  const btcValueM = useMemo(() => (btcPrice * btcHoldings * 1000) / 1_000_000, [btcPrice, btcHoldings]);
  const baseDebt = useMemo(() => debt.reduce((sum, d) => sum + d.notional, 0), [debt]);
  const basePref = useMemo(() => pref.reduce((sum, p) => sum + p.notional, 0), [pref]);
  const totalDebt = baseDebt + additionalDebt;
  const totalPref = basePref + additionalPref;
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
    return prefWithPrices.map((p) => {
      cumulative += p.notional;
      const coverage = (btcValueM + usdReserve) / cumulative;
      return { ...p, cumulative, coverage };
    });
  }, [prefWithPrices, totalDebt, btcValueM, usdReserve]);

  const totalCoverage = (btcValueM + usdReserve) / totalDebtPref;

  // Strive Calculations (striveBtcHoldings is actual BTC count, not thousands)
  const striveBtcValueM = useMemo(
    () => (btcPrice * striveBtcHoldings) / 1_000_000,
    [btcPrice, striveBtcHoldings]
  );
  const striveTotalPref = useMemo(() => strivePref.reduce((sum, p) => sum + p.notional, 0), [strivePref]);

  const strivePrefWithCumulative = useMemo(() => {
    let cumulative = 0;
    return strivePrefWithPrices.map((p) => {
      cumulative += p.notional;
      const coverage = (striveBtcValueM + striveUsdReserve) / cumulative;
      return { ...p, cumulative, coverage };
    });
  }, [strivePrefWithPrices, striveBtcValueM, striveUsdReserve]);

  const striveTotalCoverage = striveTotalPref > 0 ? (striveBtcValueM + striveUsdReserve) / striveTotalPref : 0;

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

  const resetToActuals = () => {
    setBtcPrice(actualBtcPrice);
    setBtcHoldings(actualBtcHoldings);
  };

  // Build securities list for MSTR sensitivity
  const mstrSecurities = useMemo(() => {
    const debtSecurities = debt.map((d, i) => ({
      id: `debt-${i}`,
      name: d.name,
      notional: d.notional,
      type: 'debt' as const,
    }));
    const prefSecurities = pref.map((p, i) => ({
      id: `pref-${i}`,
      name: p.ticker,
      notional: p.notional,
      type: 'pref' as const,
    }));
    return [...debtSecurities, ...prefSecurities];
  }, [debt, pref]);

  // Build securities list for Strive sensitivity
  const striveSecurities = useMemo(() => {
    return strivePref.map((p, i) => ({
      id: `pref-${i}`,
      name: p.ticker,
      notional: p.notional,
      type: 'pref' as const,
    }));
  }, [strivePref]);

  return (
    <div className="min-h-screen bg-lavender-bg text-gray-200 font-sans">
      {/* Header with Logo */}
      <div className="bg-lavender-card border-b border-lavender-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src={artemisLogo}
              alt="Artemis"
              className="h-10 w-10 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">BTC Treasury Calculator</h1>
              <p className="text-sm text-gray-400">Coverage Analysis Tool</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveTab('mstr')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'mstr'
                ? 'bg-lavender-accent text-white'
                : 'bg-lavender-card text-gray-300 hover:bg-lavender-border'
            }`}
          >
            MSTR Calculator
          </button>
          <button
            onClick={() => setActiveTab('strive')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'strive'
                ? 'bg-lavender-accent text-white'
                : 'bg-lavender-card text-gray-300 hover:bg-lavender-border'
            }`}
          >
            Strive Calculator
          </button>
          <button
            onClick={() => setActiveTab('mstr-sensitivity')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'mstr-sensitivity'
                ? 'bg-lavender-accent text-white'
                : 'bg-lavender-card text-gray-300 hover:bg-lavender-border'
            }`}
          >
            MSTR Sensitivity
          </button>
          <button
            onClick={() => setActiveTab('strive-sensitivity')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'strive-sensitivity'
                ? 'bg-lavender-accent text-white'
                : 'bg-lavender-card text-gray-300 hover:bg-lavender-border'
            }`}
          >
            Strive Sensitivity
          </button>
        </div>

      {activeTab === 'mstr' ? (
        <>
          {/* MSTR Assumptions Row */}
          <div className="flex items-start gap-6 mb-6 flex-wrap">
            {/* Actuals Section */}
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
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
              {pricesLoading && <span className="text-gray-500 text-xs ml-2">(loading prices...)</span>}
            </div>

            {/* Assumptions Section */}
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-xs text-gray-400 uppercase tracking-wider">Assumptions</div>
                <button
                  onClick={resetToActuals}
                  className="text-xs text-lavender-accent hover:text-white"
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
                    className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 w-28 text-white text-right text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">Holdings</span>
                  <input
                    type="number"
                    value={btcHoldings}
                    onChange={(e) => setBtcHoldings(Number(e.target.value))}
                    className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 w-24 text-white text-right text-sm"
                  />
                  <span className="text-gray-400 text-sm">k</span>
                </div>
              </div>
            </div>

            {/* BTC Value */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-400">BTC Value:</span>
              <span className="text-lavender-accent text-2xl font-bold">
                {formatCurrency(Math.round(btcValueM))}M
              </span>
            </div>
          </div>

          {/* USD Reserve */}
          <div className="flex items-center gap-2 mb-6 bg-lavender-card rounded-lg p-4 border border-lavender-border w-fit">
            <span className="text-lavender-accent font-medium">USD Reserve</span>
            <span className="text-gray-400">$</span>
            <input
              type="number"
              value={usdReserve}
              onChange={(e) => setUsdReserve(Number(e.target.value))}
              className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 w-28 text-white text-right"
            />
            <span className="text-gray-400">M</span>
          </div>

          {/* Debt Table */}
          <div className="bg-lavender-card rounded-lg border border-lavender-border overflow-hidden mb-4">
            <table className="w-full text-base">
              <thead>
                <tr className="text-gray-400 border-b border-lavender-border">
                  <th className="text-left py-4 px-4 font-medium" style={{ width: '30%' }}>Debt</th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '20%' }}>Notional ($M)</th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '25%' }}>Cum Notional ($M)</th>
                  <th className="text-right py-4 px-4 font-medium" style={{ width: '25%' }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {debtWithCumulative.map((item, i) => (
                  <tr key={item.name} className="border-t border-lavender-border">
                    <td className="py-4 px-4 text-gray-300 text-base">{item.name}</td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="number"
                        value={item.notional}
                        onChange={(e) => updateDebt(i, Number(e.target.value))}
                        className="bg-lavender-bg border border-lavender-border rounded px-3 py-2 w-32 text-white text-center text-base"
                      />
                    </td>
                    <td className="py-4 px-4 text-center text-gray-300 text-base">{formatCurrency(item.cumulative)}</td>
                    <td className={`py-4 px-4 text-right font-semibold text-base ${getCoverageColor(item.coverage)}`}>
                      {item.coverage.toFixed(1)}x
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-lavender-border bg-lavender-bg/50">
                  <td className="py-3 px-4 text-lavender-accent font-semibold text-base">Total Debt</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={totalDebt}
                        onChange={(e) => setAdditionalDebt(Number(e.target.value) - baseDebt)}
                        className="bg-lavender-bg border border-lavender-accent rounded px-3 py-1.5 w-32 text-lavender-accent text-center font-semibold"
                      />
                      <span className="text-gray-400">M</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-lavender-accent font-semibold text-base">{formatCurrency(totalDebt)}</td>
                  <td className={`py-3 px-4 text-right font-semibold text-base ${getCoverageColor((btcValueM + usdReserve) / totalDebt)}`}>
                    {((btcValueM + usdReserve) / totalDebt).toFixed(1)}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Preferred Stock Table */}
          <div className="bg-lavender-card rounded-lg border border-lavender-border overflow-hidden mb-4">
            <table className="w-full text-base">
              <thead>
                <tr className="text-gray-400 border-b border-lavender-border">
                  <th className="text-left py-4 px-4 font-medium" style={{ width: '30%' }}>Preferred Stock</th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '20%' }}>
                    <HeaderTooltip tooltip={STRATEGY_DEFINITIONS.notional}>Notional ($M)</HeaderTooltip>
                  </th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '25%' }}>Cum Notional ($M)</th>
                  <th className="text-right py-4 px-4 font-medium" style={{ width: '25%' }}>
                    <HeaderTooltip tooltip={STRATEGY_DEFINITIONS.coverage}>Coverage</HeaderTooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {prefWithCumulative.map((item, i) => (
                  <tr key={item.ticker} className="border-t border-lavender-border">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300 font-semibold text-base">{item.ticker}</span>
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
                    <td className="py-4 px-4 text-center">
                      <input
                        type="number"
                        value={item.notional}
                        onChange={(e) => updatePref(i, Number(e.target.value))}
                        className="bg-lavender-bg border border-lavender-border rounded px-3 py-2 w-32 text-white text-center text-base"
                      />
                    </td>
                    <td className="py-4 px-4 text-center text-gray-300 text-base">{formatCurrency(item.cumulative)}</td>
                    <td className={`py-4 px-4 text-right font-semibold text-base ${getCoverageColor(item.coverage)}`}>
                      {item.coverage.toFixed(1)}x
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-lavender-border bg-lavender-bg/50">
                  <td className="py-3 px-4 text-lavender-accent font-semibold text-base">Total Pref</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-gray-400">$</span>
                      <input
                        type="number"
                        value={totalPref}
                        onChange={(e) => setAdditionalPref(Number(e.target.value) - basePref)}
                        className="bg-lavender-bg border border-lavender-accent rounded px-3 py-1.5 w-32 text-lavender-accent text-center font-semibold"
                      />
                      <span className="text-gray-400">M</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-lavender-accent font-semibold text-base">{formatCurrency(totalDebtPref)}</td>
                  <td className={`py-3 px-4 text-right font-semibold text-base ${getCoverageColor(totalCoverage)}`}>
                    {totalCoverage.toFixed(1)}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Debt + Pref */}
          <div className="bg-lavender-card rounded-lg border-2 border-lavender-accent overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-4 px-4 text-lavender-accent font-bold text-lg" style={{ width: '30%' }}>Total Debt + Pref</td>
                  <td className="py-4 px-4 text-center text-lavender-accent font-bold text-lg" style={{ width: '20%' }}>
                    {formatCurrency(totalDebtPref)}
                  </td>
                  <td className="py-4 px-4 text-center text-lavender-accent font-bold text-lg" style={{ width: '25%' }}>
                    {formatCurrency(totalDebtPref)}
                  </td>
                  <td className={`py-4 px-4 text-right font-bold text-lg ${getCoverageColor(totalCoverage)}`} style={{ width: '25%' }}>
                    {totalCoverage.toFixed(1)}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Yield vs Coverage Chart */}
          <YieldCoverageChart preferredData={prefWithCumulative} />
        </>
      ) : activeTab === 'strive' ? (
        <>
          {/* Strive Tab */}
          <div className="flex items-start gap-6 mb-6 flex-wrap">
            {/* Strive Actuals (Live) */}
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Actuals (Live)</div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-400 text-sm">BTC Price: </span>
                  <span className="text-green-400 font-medium">${actualBtcPrice.toLocaleString()}</span>
                </div>
                {livePrices['SATA'] && (
                  <div>
                    <span className="text-gray-400 text-sm">SATA: </span>
                    <span className="text-green-400 font-medium">${livePrices['SATA'].price.toFixed(2)}</span>
                    <span className={livePrices['SATA'].change && livePrices['SATA'].change < 0 ? 'text-red-400 ml-1 text-sm' : 'text-green-400 ml-1 text-sm'}>
                      ({livePrices['SATA'].change && livePrices['SATA'].change > 0 ? '+' : ''}{livePrices['SATA'].change?.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
              {pricesLoading && <span className="text-gray-500 text-xs">(loading prices...)</span>}
            </div>

            {/* Strive Assumptions */}
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Assumptions</div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">Holdings</span>
                  <input
                    type="number"
                    value={striveBtcHoldings}
                    onChange={(e) => setStriveBtcHoldings(Number(e.target.value))}
                    className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 w-32 text-white text-right text-sm"
                  />
                  <span className="text-gray-400 text-sm">BTC</span>
                </div>
              </div>
              <div className="text-gray-500 text-xs mt-1">
                ({striveBtcHoldings.toLocaleString()} BTC)
              </div>
            </div>

            {/* BTC Value */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-400">BTC Value:</span>
              <span className="text-lavender-accent text-2xl font-bold">
                {formatCurrency(Math.round(striveBtcValueM))}M
              </span>
            </div>
          </div>

          {/* Strive USD Reserve */}
          <div className="flex items-center gap-2 mb-6 bg-lavender-card rounded-lg p-4 border border-lavender-border w-fit">
            <span className="text-lavender-accent font-medium">USD Reserve</span>
            <span className="text-gray-400">$</span>
            <input
              type="number"
              value={striveUsdReserve}
              onChange={(e) => setStriveUsdReserve(Number(e.target.value))}
              className="bg-lavender-bg border border-lavender-border rounded px-3 py-1.5 w-28 text-white text-right"
            />
            <span className="text-gray-400">M</span>
          </div>

          {/* Strive has no debt - just preferred */}
          <div className="text-gray-500 text-sm mb-4 italic">Strive has no convertible debt</div>

          {/* Strive Preferred Stock Table */}
          <div className="bg-lavender-card rounded-lg border border-lavender-border overflow-hidden">
            <table className="w-full text-base">
              <thead>
                <tr className="text-gray-400 border-b border-lavender-border">
                  <th className="text-left py-4 px-4 font-medium" style={{ width: '30%' }}>Preferred Stock</th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '20%' }}>
                    <HeaderTooltip tooltip={STRATEGY_DEFINITIONS.notional}>Notional ($M)</HeaderTooltip>
                  </th>
                  <th className="text-center py-4 px-4 font-medium" style={{ width: '25%' }}>Cum Notional ($M)</th>
                  <th className="text-right py-4 px-4 font-medium" style={{ width: '25%' }}>
                    <HeaderTooltip tooltip={STRATEGY_DEFINITIONS.coverage}>Coverage</HeaderTooltip>
                  </th>
                </tr>
              </thead>
              <tbody>
                {strivePrefWithCumulative.map((item, i) => (
                  <tr key={item.ticker} className="border-t border-lavender-border">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300 font-semibold text-base">{item.ticker}</span>
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
                    <td className="py-4 px-4 text-center">
                      <input
                        type="number"
                        value={item.notional}
                        onChange={(e) => updateStrivePref(i, Number(e.target.value))}
                        className="bg-lavender-bg border border-lavender-border rounded px-3 py-2 w-32 text-white text-center text-base"
                      />
                    </td>
                    <td className="py-4 px-4 text-center text-gray-300 text-base">{formatCurrency(item.cumulative)}</td>
                    <td className={`py-4 px-4 text-right font-semibold text-base ${getCoverageColor(item.coverage)}`}>
                      {item.coverage.toFixed(1)}x
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-lavender-accent bg-lavender-bg/50">
                  <td className="py-4 px-4 text-lavender-accent font-bold text-lg">Total Pref</td>
                  <td className="py-4 px-4 text-center text-lavender-accent font-bold text-lg">{formatCurrency(striveTotalPref)}</td>
                  <td className="py-4 px-4 text-center text-lavender-accent font-bold text-lg">{formatCurrency(striveTotalPref)}</td>
                  <td className={`py-4 px-4 text-right font-bold text-lg ${getCoverageColor(striveTotalCoverage)}`}>
                    {striveTotalCoverage.toFixed(1)}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Yield vs Coverage Chart */}
          <YieldCoverageChart preferredData={strivePrefWithCumulative} />
        </>
      ) : activeTab === 'mstr-sensitivity' ? (
        <>
          {/* MSTR Sensitivity Tab */}
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Current Assumptions</div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-400 text-sm">BTC Price: </span>
                  <span className="text-lavender-accent font-medium">${btcPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Holdings: </span>
                  <span className="text-lavender-accent font-medium">{btcHoldings}k</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">USD Reserve: </span>
                  <span className="text-lavender-accent font-medium">${usdReserve}M</span>
                </div>
              </div>
            </div>
          </div>

          <SensitivityTable
            securities={mstrSecurities}
            btcPrice={btcPrice}
            btcHoldings={btcHoldings}
            usdReserve={usdReserve}
            holdingsUnit="thousands"
          />
        </>
      ) : (
        <>
          {/* Strive Sensitivity Tab */}
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <div className="bg-lavender-card rounded-lg p-4 border border-lavender-border">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Current Assumptions</div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-400 text-sm">BTC Price: </span>
                  <span className="text-lavender-accent font-medium">${btcPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Holdings: </span>
                  <span className="text-lavender-accent font-medium">{striveBtcHoldings.toLocaleString()} BTC</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">USD Reserve: </span>
                  <span className="text-lavender-accent font-medium">${striveUsdReserve}M</span>
                </div>
              </div>
            </div>
          </div>

          <SensitivityTable
            securities={striveSecurities}
            btcPrice={btcPrice}
            btcHoldings={striveBtcHoldings}
            usdReserve={striveUsdReserve}
            holdingsUnit="actual"
          />
        </>
      )}
      </div>

      {/* Footer with Source Citations */}
      <footer className="border-t border-lavender-border mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <img src={bitcoinLogo} alt="Bitcoin" className="h-4 w-4" />
            <span>Data sources:</span>
            <a href="https://www.strategy.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lavender-accent">
              Strategy.com
            </a>
            <span>·</span>
            <a href="https://treasury.strive.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lavender-accent">
              Strive Treasury
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
