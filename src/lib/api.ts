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
 * Fetch BTC price from Artemis API (fallback)
 */
async function fetchArtemisBtcPrice(): Promise<number> {
  const apiKey = import.meta.env.VITE_ARTEMIS_API_KEY;

  if (!apiKey) {
    throw new Error('Artemis API key not configured');
  }

  const response = await fetch(`${API_ENDPOINTS.ARTEMIS_PRICE}?symbol=BTC`, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Artemis API error: ${response.status}`);
  }

  const data = await response.json();
  return data.price;
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
  source: 'microstrategy' | 'artemis' | 'mixed';
}

/**
 * Fetch and normalize data from MicroStrategy APIs
 */
export async function fetchCombinedData(): Promise<CombinedData> {
  try {
    // Try MicroStrategy APIs first
    const [mstrData, btcData] = await Promise.all([
      fetchMSTRKpiData(),
      fetchBitcoinKpis(),
    ]);

    const btcResults = btcData.results;

    return {
      btcPrice: btcResults.latestPrice,
      btcHoldings: parseApiNumber(btcResults.btcHoldings),
      mstrPrice: parseApiNumber(mstrData.price),
      mstrMarketCap: parseApiNumber(mstrData.marketCap) * 1_000_000, // API returns in millions
      totalDebt: parseApiNumber(mstrData.debt), // in millions
      totalPreferred: parseApiNumber(mstrData.pref), // in millions
      historicVolatility: mstrData.historicVolatility / 100, // Convert from percentage
      btcNav: btcResults.btcNavNumber * 1_000_000_000, // API returns in billions
      source: 'microstrategy',
    };
  } catch (mstrError) {
    console.warn('MicroStrategy API failed, trying Artemis fallback:', mstrError);

    try {
      const btcPrice = await fetchArtemisBtcPrice();

      // Return partial data with Artemis BTC price and defaults
      return {
        btcPrice,
        btcHoldings: DEFAULT_ASSUMPTIONS.btcHoldings,
        mstrPrice: 0,
        mstrMarketCap: 0,
        totalDebt: 8244, // Sum of debt instruments from latest API
        totalPreferred: 8389, // Sum of preferred instruments
        historicVolatility: DEFAULT_ASSUMPTIONS.btcVolatility,
        btcNav: btcPrice * DEFAULT_ASSUMPTIONS.btcHoldings,
        source: 'artemis',
      };
    } catch (artemisError) {
      console.error('Artemis API also failed:', artemisError);
      throw new Error('All data sources failed');
    }
  }
}
