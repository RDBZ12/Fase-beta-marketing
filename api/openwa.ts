export default async function handler(req: any, res: any) {
  const { path, method, body, apiUrl } = req.body;
  const API_KEY = process.env.OPENWA_API_KEY || process.env.VITE_OPENWA_API_KEY || 'owa_k1_98f0a84c3b21bd0ec89b7b8d78a2182a90dc355b4d0ef5aab13b9ad3a1c931a3';
  
  // We use the apiUrl passed from the client because OpenWA might be running on a custom URL or proxy
  const base = apiUrl || process.env.OPENWA_API_URL || process.env.VITE_OPENWA_API_URL || 'http://localhost:2785/api';

  if (base.includes('localhost') || base.includes('127.0.0.1')) {
     // Si estamos en Vercel, localhost no funcionará, pero al menos devolvemos error manejable
     // a menos que Vercel esté en desarrollo local.
  }

  const headers: any = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  try {
    const url = `${base}${path}`;
    const options: any = { method, headers };
    if (body && method !== 'GET' && method !== 'HEAD') {
      options.body = JSON.stringify(body);
    }
    
    const r = await fetch(url, options);
    
    if (!r.ok) {
      if (r.status === 502 || r.status === 503 || r.status === 504) {
        return res.status(r.status).json({ error: "El servidor de WhatsApp (OpenWA) está apagado o no responde." });
      }
      let errText = await r.text();
      try {
        const errJson = JSON.parse(errText);
        return res.status(r.status).json(errJson);
      } catch {
        return res.status(r.status).json({ error: errText || `Error HTTP: ${r.status}` });
      }
    }

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
