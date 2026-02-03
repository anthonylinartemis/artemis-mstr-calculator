import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as jose from 'jose';

// ROT13 decode
function rot13(message: string): string {
  return message.replace(/[a-z]/gi, (letter) =>
    String.fromCharCode(
      letter.charCodeAt(0) + (letter.toLowerCase() <= 'm' ? 13 : -13)
    )
  );
}

// Generate JWT token for Artemis datasvc
async function getArtemisToken(): Promise<string> {
  const tokenSeed = rot13(process.env.ARTEMIS_ENCRYPTED_TOKEN_SEED || '');

  if (!tokenSeed) {
    throw new Error('ARTEMIS_ENCRYPTED_TOKEN_SEED not configured');
  }

  const secret = new TextEncoder().encode(tokenSeed);
  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secret);

  return jwt;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const { path, ...queryParams } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  // Build query string from remaining params
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  const fullUrl = `https://data-svc.artemisxyz.com/${pathString}${queryString ? `?${queryString}` : ''}`;

  try {
    const token = await getArtemisToken();

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Art-Webtoken': token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Artemis datasvc error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Artemis API error',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Artemis datasvc proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from Artemis datasvc',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
