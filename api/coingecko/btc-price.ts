import type { VercelRequest, VercelResponse } from '@vercel/node';

// CoinGecko API for BTC price (free, no auth required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
    usd_24h_change?: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    const url = `${COINGECKO_API}?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    return res.status(200).json({
      price: data.bitcoin.usd,
      change24h: data.bitcoin.usd_24h_change || 0,
      source: 'coingecko',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch BTC price',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
