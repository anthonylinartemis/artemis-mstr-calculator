import { API_ENDPOINTS, DEFAULT_ASSUMPTIONS } from './constants';

/**
 * Parse number from API response (handles strings with commas)
 */
function parseApiNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Raw API response types (as returned by MicroStrategy)
 */
interface RawMSTRKpiData {
  company: string;
  price: string;
  ufPrice: number;
  marketCap: string;
  debt: string;
  pref: string;
  debtByMc: number;
  historicVolatility: number;
}

interface RawBitcoinKpis {
  results: {
    latestPrice: number;
    btcHoldings: string;
    btcNav: string;
    btcNavNumber: number;
    debtByBN: number;
    prefByBN: number;
  };
  timestamp: string;
}

interface CoinGeckoResponse {
  price: number;
  change24h: number;
  source: string;
  timestamp: string;
}

/**
 * Fetch BTC price from CoinGecko (primary source)
 */
async function fetchCoinGeckoBtcPrice(): Promise<number> {
  const response = await fetch('/api/coingecko/btc-price');

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: CoinGeckoResponse = await response.json();
  return data.price;
}

/**
 * Fetch MSTR KPI data from MicroStrategy API
 */
async function fetchMSTRKpiData(): Promise<RawMSTRKpiData> {
  const response = await fetch(API_ENDPOINTS.MSTR_KPI);

  if (!response.ok) {
    throw new Error(`MSTR API error: ${response.status}`);
  }

  const data = await response.json();
  // API returns an array, take the first element
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Fetch Bitcoin KPI data from MicroStrategy API
 */
async function fetchBitcoinKpis(): Promise<RawBitcoinKpis> {
  const response = await fetch(API_ENDPOINTS.BTC_KPI);

  if (!response.ok) {
    throw new Error(`BTC API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Combined data interface (normalized)
 */
export interface CombinedData {
  btcPrice: number;
  btcHoldings: number;
  mstrPrice: number;
  mstrMarketCap: number;
  totalDebt: number;
  totalPreferred: number;
  historicVolatility: number;
  btcNav: number;
  source: 'coingecko' | 'microstrategy' | 'mixed';
}

/**
 * Fetch and normalize data from multiple sources
 * - BTC Price: CoinGecko (primary), MicroStrategy (fallback)
 * - Holdings: MicroStrategy API, falls back to bitcointreasuries.net defaults
 */
export async function fetchCombinedData(): Promise<CombinedData> {
  // Fetch BTC price from CoinGecko (more reliable)
  let btcPrice: number;
  let priceSource: 'coingecko' | 'microstrategy' = 'coingecko';

  try {
    btcPrice = await fetchCoinGeckoBtcPrice();
  } catch {
    // CoinGecko failed, will try MicroStrategy below
    btcPrice = 0;
    priceSource = 'microstrategy';
  }

  // Try to get holdings from MicroStrategy API
  try {
    const [mstrData, btcData] = await Promise.all([
      fetchMSTRKpiData(),
      fetchBitcoinKpis(),
    ]);

    const btcResults = btcData.results;

    // Use CoinGecko price if available, otherwise MicroStrategy
    const finalBtcPrice = btcPrice > 0 ? btcPrice : btcResults.latestPrice;
    const holdings = parseApiNumber(btcResults.btcHoldings);

    return {
      btcPrice: finalBtcPrice,
      btcHoldings: holdings,
      mstrPrice: parseApiNumber(mstrData.price),
      mstrMarketCap: parseApiNumber(mstrData.marketCap) * 1_000_000,
      totalDebt: parseApiNumber(mstrData.debt),
      totalPreferred: parseApiNumber(mstrData.pref),
      historicVolatility: mstrData.historicVolatility / 100,
      btcNav: btcResults.btcNavNumber * 1_000_000_000,
      source: priceSource === 'coingecko' ? 'mixed' : 'microstrategy',
    };
  } catch {
    // MicroStrategy API failed, use defaults from bitcointreasuries.net
    // If CoinGecko also failed, use default price
    const finalBtcPrice = btcPrice > 0 ? btcPrice : DEFAULT_ASSUMPTIONS.btcPrice;

    return {
      btcPrice: finalBtcPrice,
      btcHoldings: DEFAULT_ASSUMPTIONS.btcHoldings,
      mstrPrice: 0,
      mstrMarketCap: 0,
      totalDebt: 8214,
      totalPreferred: 7467,
      historicVolatility: DEFAULT_ASSUMPTIONS.btcVolatility,
      btcNav: finalBtcPrice * DEFAULT_ASSUMPTIONS.btcHoldings,
      source: 'coingecko',
    };
  }
}
