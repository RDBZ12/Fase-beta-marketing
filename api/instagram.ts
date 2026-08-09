export default async function handler(req: any, res: any) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  const action = body?.action || req.query?.action;
  const mediaId = body?.mediaId || req.query?.mediaId;
  const limit = body?.limit || req.query?.limit || 10;
  const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.VITE_INSTAGRAM_ACCESS_TOKEN;
  const IG_ACCT_ID = process.env.INSTAGRAM_ACCOUNT_ID || process.env.VITE_INSTAGRAM_ACCOUNT_ID || '17841480091400531';
  const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

  if (!IG_TOKEN || IG_TOKEN === 'PEGA_AQUI_TU_INSTAGRAM_ACCESS_TOKEN') {
    return res.status(500).json({ error: 'Missing or invalid IG_TOKEN' });
  }

  try {
    if (action === 'insights' && mediaId) {
      const metrics = 'impressions,reach,likes,comments,shares,saved,total_interactions';
      const url = `${GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${IG_TOKEN}`;
      const r = await fetch(url);
      const data = await r.json();
      return res.status(r.status).json(data);
    } else if (action === 'media') {
      const fields = 'id,caption,timestamp,permalink,media_type,like_count,comments_count';
      const url = `${GRAPH_BASE}/${IG_ACCT_ID}/media?fields=${fields}&access_token=${IG_TOKEN}&limit=${limit}`;
      const r = await fetch(url);
      const data = await r.json();
      return res.status(r.status).json(data);
    } else if (action === 'check') {
      return res.status(200).json({ status: 'ok' });
    }
    return res.status(400).json({ error: 'Invalid action', actionReceived: action, bodyType: typeof req.body });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
