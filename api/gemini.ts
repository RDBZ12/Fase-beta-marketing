export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { contents, generationConfig, systemInstruction, model } = req.body;

    // Acepta diferentes modelos según lo solicite el frontend, o usa uno por defecto
    const targetModel = model || 'gemini-2.5-flash';

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Falta la GEMINI_API_KEY en el servidor' });
    }

    const payload: any = { contents };
    if (generationConfig) payload.generationConfig = generationConfig;
    if (systemInstruction) payload.systemInstruction = systemInstruction;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error en /api/gemini:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
