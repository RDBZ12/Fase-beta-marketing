export default async function handler(req: any, res: any) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const action = body?.action || req.query?.action;
  const ayrsharePostId = body?.ayrsharePostId || req.query?.ayrsharePostId;
  const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY || process.env.VITE_AYRSHARE_API_KEY;
  const BASE_URL = 'https://api.ayrshare.com/api';

  if (!AYRSHARE_API_KEY || AYRSHARE_API_KEY === 'FEC64958-E887449B-B80BB8CC-96537107') {
    return res.status(500).json({ error: 'Missing or invalid AYRSHARE_API_KEY' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
  };

  try {
    if (action === 'history') {
      const r = await fetch(`${BASE_URL}/history?offset=0&limit=100`, { method: 'GET', headers });
      const data = await r.json();
      return res.status(r.status).json(data);
    } else if (action === 'analytics' && ayrsharePostId) {
      const r = await fetch(`${BASE_URL}/analytics/post`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: ayrsharePostId }),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    } else if (action === 'check') {
      return res.status(200).json({ status: 'ok' });
    }
    return res.status(400).json({ error: 'Invalid action', actionReceived: action });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
