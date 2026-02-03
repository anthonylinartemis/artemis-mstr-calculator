import type { MSTRKpiData, BitcoinKpis } from '../types';
import { API_ENDPOINTS } from './constants';

/**
 * Fetch MSTR KPI data from MicroStrategy API
 */
export async function fetchMSTRKpiData(): Promise<MSTRKpiData> {
  const response = await fetch(API_ENDPOINTS.MSTR_KPI);

  if (!response.ok) {
    throw new Error(`MSTR API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch Bitcoin KPI data from MicroStrategy API
 */
export async function fetchBitcoinKpis(): Promise<BitcoinKpis> {
  const response = await fetch(API_ENDPOINTS.BTC_KPI);

  if (!response.ok) {
    throw new Error(`BTC API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch BTC price from Artemis API (fallback)
 */
export async function fetchArtemisBtcPrice(): Promise<number> {
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
 * Combined data fetcher with fallback logic
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

export async function fetchCombinedData(): Promise<CombinedData> {
  try {
    // Try MicroStrategy APIs first
    const [mstrData, btcData] = await Promise.all([
      fetchMSTRKpiData(),
      fetchBitcoinKpis(),
    ]);

    return {
      btcPrice: btcData.latestPrice,
      btcHoldings: btcData.btcHoldings,
      mstrPrice: mstrData.price,
      mstrMarketCap: mstrData.marketCap,
      totalDebt: mstrData.debt,
      totalPreferred: mstrData.pref,
      historicVolatility: mstrData.historicVolatility,
      btcNav: btcData.btcNav,
      source: 'microstrategy',
    };
  } catch (mstrError) {
    console.warn('MicroStrategy API failed, trying Artemis fallback:', mstrError);

    try {
      const btcPrice = await fetchArtemisBtcPrice();

      // Return partial data with Artemis BTC price
      return {
        btcPrice,
        btcHoldings: 471107, // Default from constants
        mstrPrice: 0,
        mstrMarketCap: 0,
        totalDebt: 7860, // Sum of debt instruments
        totalPreferred: 1147, // Sum of preferred instruments
        historicVolatility: 0.60,
        btcNav: btcPrice * 471107,
        source: 'artemis',
      };
    } catch (artemisError) {
      console.error('Artemis API also failed:', artemisError);
      throw new Error('All data sources failed');
    }
  }
}
