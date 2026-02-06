import type { VercelRequest, VercelResponse } from '@vercel/node';

// CoinGecko public treasury API (free, no auth)
const COINGECKO_TREASURY_URL = 'https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin';

interface CoinGeckoCompany {
  name: string;
  symbol: string;
  country: string;
  total_holdings: number;
  total_entry_value_usd: number;
  total_current_value_usd: number;
  percentage_of_total_supply: number;
}

interface CoinGeckoTreasuryResponse {
  total_holdings: number;
  total_value_usd: number;
  market_cap_dominance: number;
  companies: CoinGeckoCompany[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  try {
    const response = await fetch(COINGECKO_TREASURY_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko treasury API error: ${response.status}`);
    }

    const data: CoinGeckoTreasuryResponse = await response.json();

    // Find Strive in the companies list (ticker ASST on exchanges)
    const strive = data.companies.find(
      (c) => c.name.toLowerCase().includes('strive') || c.symbol.toLowerCase() === 'asst'
    );

    if (!strive) {
      return res.status(200).json({
        btcHoldings: null,
        btcValue: null,
        source: 'coingecko',
        timestamp: new Date().toISOString(),
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    // Cache for 5 minutes (BTC holdings change less frequently than price)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    return res.status(200).json({
      btcHoldings: strive.total_holdings,
      btcValue: strive.total_current_value_usd,
      source: 'coingecko',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch Strive treasury data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
