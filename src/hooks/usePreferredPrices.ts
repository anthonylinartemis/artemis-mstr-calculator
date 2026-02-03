import useSWR from 'swr';
import { PRICE_HISTORY_DAYS, REFRESH_INTERVAL } from '../lib/constants';

interface PriceDataPoint {
  symbol: string;
  val: number;
  date: string;
}

interface PriceResponse {
  data: PriceDataPoint[];
}

interface PreferredPrice {
  ticker: string;
  price: number;
  previousPrice: number | null;
  change: number | null;
}

// Map Artemis symbols to display tickers (use underscores per Artemis API)
const SYMBOL_TO_TICKER: Record<string, string> = {
  'eq_strf': 'STRF',
  'eq_strc': 'STRC',
  'eq_strk': 'STRK',
  'eq_strd': 'STRD',
  'eq_sata': 'SATA',
};

const TICKERS = ['eq_strf', 'eq_strc', 'eq_strk', 'eq_strd', 'eq_sata'];

async function fetchPreferredPrices(): Promise<Record<string, PreferredPrice>> {
  // Get dates for price history to calculate daily change
  const today = new Date();
  const startDateObj = new Date(today);
  startDateObj.setDate(startDateObj.getDate() - PRICE_HISTORY_DAYS);

  const endDate = today.toISOString().split('T')[0];
  const startDate = startDateObj.toISOString().split('T')[0];

  // Use snake_case for Artemis API parameters
  const symbols = TICKERS.join(',');
  const url = `/api/datasvc/v2/data/PRICE?symbols=${symbols}&start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch preferred prices: ${response.status}`);
  }

  const result: PriceResponse = await response.json();

  // Group data by symbol and sort by date
  const pricesBySymbol: Record<string, PriceDataPoint[]> = {};

  for (const point of result.data || []) {
    const symbol = point.symbol;
    if (!pricesBySymbol[symbol]) {
      pricesBySymbol[symbol] = [];
    }
    pricesBySymbol[symbol].push(point);
  }

  // Sort each symbol's data by date descending
  for (const symbol of Object.keys(pricesBySymbol)) {
    pricesBySymbol[symbol].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  // Build the result object
  const prices: Record<string, PreferredPrice> = {};

  for (const symbol of TICKERS) {
    const ticker = SYMBOL_TO_TICKER[symbol];
    const symbolData = pricesBySymbol[symbol] || [];

    if (symbolData.length > 0) {
      const currentPrice = symbolData[0].val;
      const previousPrice = symbolData.length > 1 ? symbolData[1].val : null;
      const change = previousPrice !== null
        ? ((currentPrice - previousPrice) / previousPrice) * 100
        : null;

      prices[ticker] = {
        ticker,
        price: currentPrice,
        previousPrice,
        change,
      };
    }
  }

  return prices;
}

export function usePreferredPrices() {
  const { data, error, isLoading, mutate } = useSWR(
    'preferred-prices',
    fetchPreferredPrices,
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    prices: data || {},
    error,
    isLoading,
    mutate,
  };
}
