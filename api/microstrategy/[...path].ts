import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  try {
    const response = await fetch(`https://api.microstrategy.com/${pathString}`, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
    });

    const data = await response.json();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('MicroStrategy API proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from MicroStrategy API' });
  }
}
