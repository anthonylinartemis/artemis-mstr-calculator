import type { VercelRequest, VercelResponse } from '@vercel/node';

// Yahoo Finance API for preferred stock prices
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketChangePercent: number;
}

interface YahooResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

async function fetchYahooPrice(symbol: string): Promise<YahooQuote | null> {
  try {
    const url = `${YAHOO_BASE_URL}/${symbol}?interval=1d&range=2d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BTCCalculator/1.0)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: YahooResponse = await response.json();

    if (data.chart.error || !data.chart.result?.[0]) {
      return null;
    }

    const meta = data.chart.result[0].meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const changePercent = previousClose > 0
      ? ((currentPrice - previousClose) / previousClose) * 100
      : 0;

    return {
      symbol,
      regularMarketPrice: currentPrice,
      regularMarketPreviousClose: previousClose,
      regularMarketChangePercent: changePercent,
    };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const symbolsParam = req.query.symbols;
  if (!symbolsParam || typeof symbolsParam !== 'string') {
    return res.status(400).json({ error: 'Missing symbols parameter' });
  }

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

  // Fetch all prices in parallel
  const pricePromises = symbols.map(fetchYahooPrice);
  const results = await Promise.all(pricePromises);

  // Build response object
  const prices: Record<string, YahooQuote> = {};
  results.forEach((result, index) => {
    if (result) {
      prices[symbols[index]] = result;
    }
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  return res.status(200).json({ prices, timestamp: new Date().toISOString() });
}
