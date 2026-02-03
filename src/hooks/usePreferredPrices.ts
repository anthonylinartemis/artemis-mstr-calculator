import useSWR from 'swr';

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

// Map Artemis symbols to display tickers
const SYMBOL_TO_TICKER: Record<string, string> = {
  'eq-strf': 'STRF',
  'eq-strc': 'STRC',
  'eq-strk': 'STRK',
  'eq-strd': 'STRD',
  'eq-sata': 'SATA',
};

const TICKERS = ['eq-strf', 'eq-strc', 'eq-strk', 'eq-strd', 'eq-sata'];

async function fetchPreferredPrices(): Promise<Record<string, PreferredPrice>> {
  // Get dates for last 2 days to calculate change
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 3); // Go back 3 days to ensure we get 2 data points

  const endDate = today.toISOString().split('T')[0];
  const startDate = twoDaysAgo.toISOString().split('T')[0];

  const symbols = TICKERS.join(',');
  const url = `/api/datasvc/v2/data/PRICE?symbols=${symbols}&startDate=${startDate}&endDate=${endDate}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Artemis datasvc error:', response.status, errorText);
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
      refreshInterval: 60000, // Refresh every 60 seconds
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
