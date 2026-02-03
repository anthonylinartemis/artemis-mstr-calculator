import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  const apiKey = process.env.ARTEMIS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Artemis API key not configured' });
  }

  try {
    const url = new URL(`https://api.artemis.xyz/${pathString}`);
    // Forward query params
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path' && typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Artemis API proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Artemis API' });
  }
}
