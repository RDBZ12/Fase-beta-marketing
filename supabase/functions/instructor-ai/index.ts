import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, context } = await req.json()
    
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('No GEMINI_API_KEY set in Edge Function environment variables')
    }

    const systemPrompt = `
      Eres el Instructor Inteligente de MarketIA. Tu objetivo es guiar al usuario usando el "Sistema de Aprendizaje" predefinido.
      Módulo actual del usuario: ${context.module}.
      Tours completados: ${context.completedTours}.
      Flujo pausado: ${context.pausedFlow}.
      El sistema tiene estos módulos: ${context.modules.join(', ')}.
      Para guiar al usuario, DEBES responder con un JSON en este formato estricto:
      {
        "text": "Tu respuesta amistosa y contextual aquí",
        "action": { "type": "tour", "targetId": "ID_DEL_FLOW", "label": "Iniciar Tour" } // Opcional
      }
      Ejemplos de ID de Flow: FLOW_CLIENT_PANEL_OVERVIEW, FLOW_CAMPAIGN_WIZARD, FLOW_CLIENT_PAGOS, FLOW_CLIENT_PUBLICACIONES, FLOW_CLIENT_ESTADISTICAS.
      Si no encuentras una acción directa, responde con text amigable e invita a usar la Academia (type: "academia", targetId: "academia").
    `;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Entendido. Esperando consulta.' }] },
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
      })
    })
    
    if (!response.ok) {
        throw new Error('Error al conectar con Gemini API');
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu solicitud."

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
