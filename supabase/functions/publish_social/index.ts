// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar solicitud preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action = 'publish', post, platforms, mediaUrls, scheduleDate } = body

    // Aquí usamos la API de Ayrshare (El estándar para publicar en múltiples redes)
    // El usuario debe configurar la variable AYRSHARE_API_KEY en su proyecto de Supabase
    const AYRSHARE_API_KEY = Deno.env.get('AYRSHARE_API_KEY')

    if (action === 'analytics_links') {
      if (!AYRSHARE_API_KEY) {
        return new Response(JSON.stringify({ status: 'error', message: 'No API KEY' }), { status: 400 });
      }

      const response = await fetch("https://api.ayrshare.com/api/links", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AYRSHARE_API_KEY}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener analytics de enlaces');
      }
      return new Response(JSON.stringify({ status: 'success', analytics: data.analytics || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'sync') {
      if (!AYRSHARE_API_KEY) {
        console.warn("AYRSHARE_API_KEY no encontrada. Simulando obtención de historial.");
        return new Response(
          JSON.stringify({
            status: 'success',
            mock: true,
            history: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // Realizar petición real a Ayrshare History
      const response = await fetch("https://api.ayrshare.com/api/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AYRSHARE_API_KEY}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al comunicarse con la API de Ayrshare (History)');
      }

      return new Response(
        JSON.stringify({ status: 'success', history: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!AYRSHARE_API_KEY) {
      // Modo Simulación: Si no hay llave, fingimos que se publicó con éxito para que el sistema siga funcionando.
      console.warn("AYRSHARE_API_KEY no encontrada. Simulando publicación exitosa.");
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Publicación simulada exitosamente (Falta API Key)',
          mock: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Si hay llave, hacemos la petición real a Ayrshare
    // Plataformas soportadas por Ayrshare: ["facebook", "instagram", "twitter", "linkedin", "tiktok"]
    
    const ayrshareBody: any = {
      post: post,             // El texto de la publicación
      platforms: platforms,   // Array de redes, ej: ["facebook", "instagram"]
      mediaUrls: mediaUrls,   // Array de URLs de imágenes (deben ser públicas)
      shortenLinks: true,     // Acortar y trackear clicks de cualquier link en el post
    };

    if (scheduleDate) {
      ayrshareBody.scheduleDate = scheduleDate;
    }

    console.log("Plataformas:", platforms);
    console.log("Contenido:", post);

    const response = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AYRSHARE_API_KEY}`
      },
      body: JSON.stringify(ayrshareBody),
    });

    let data;
    try {
      data = await response.json();
    } catch (_err) {
      const text = await response.text();
      throw new Error(`Código HTTP ${response.status}: ${text || 'Respuesta vacía'}`);
    }
    console.log("Respuesta completa de Ayrshare:", data);

    if (!response.ok) {
      throw new Error(data.message || data.error || JSON.stringify(data) || `Error del servidor de Ayrshare (Código ${response.status})`);
    }

    return new Response(
      JSON.stringify({ status: 'success', data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
