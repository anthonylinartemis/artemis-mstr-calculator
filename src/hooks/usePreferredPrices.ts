import useSWR from 'swr';
import { REFRESH_INTERVAL } from '../lib/constants';

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketChangePercent: number;
}

interface YahooResponse {
  prices: Record<string, YahooQuote>;
  timestamp: string;
}

export interface PreferredPrice {
  ticker: string;
  price: number;
  previousPrice: number | null;
  change: number | null;
}

// All preferred stock tickers (MSTR + Strive)
const PREFERRED_TICKERS = ['STRF', 'STRC', 'STRK', 'STRD', 'SATA'];

async function fetchPreferredPrices(): Promise<Record<string, PreferredPrice>> {
  const symbols = PREFERRED_TICKERS.join(',');
  const url = `/api/yahoo/prices?symbols=${symbols}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferred prices: ${response.status}`);
  }

  const result: YahooResponse = await response.json();

  // Convert Yahoo response to our PreferredPrice format
  const prices: Record<string, PreferredPrice> = {};

  for (const ticker of PREFERRED_TICKERS) {
    const quote = result.prices[ticker];
    if (quote) {
      prices[ticker] = {
        ticker,
        price: quote.regularMarketPrice,
        previousPrice: quote.regularMarketPreviousClose,
        change: quote.regularMarketChangePercent,
      };
    }
  }

  return prices;
}

export function usePreferredPrices() {
  const { data, error, isLoading, mutate } = useSWR(
    'preferred-prices-yahoo',
    fetchPreferredPrices,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
      errorRetryCount: 3,
    }
  );

  return {
    prices: data || {},
    error,
    isLoading,
    mutate,
  };
}
