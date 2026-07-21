// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { campana_id } = await req.json();

    if (!campana_id) {
      return new Response(JSON.stringify({ ok: false, error: 'Falta campana_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Obtener las publicaciones de la campaña
    const { data: publicaciones, error: pubError } = await supabaseClient
      .from('publicaciones')
      .select('*')
      .eq('id_campana', campana_id);

    if (pubError || !publicaciones || publicaciones.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'No se encontraron publicaciones para esta campaña' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    let allValid = true;
    let allErrors: Record<string, string[]> = {};

    for (const pub of publicaciones) {
      const errores: string[] = [];
      const contenido = pub.contenido || '';
      
      // ==========================================
      // CAPA 1: Validación Técnica (Reglas fijas)
      // ==========================================
      
      // Texto: no vacío y max 1000 caracteres
      if (!contenido.trim()) {
        errores.push('El texto de la publicación está vacío.');
      } else if (contenido.length > 1000) {
        errores.push(`El texto supera el máximo de 1000 caracteres (actual: ${contenido.length}).`);
      }

      // Hashtags: máximo 5
      const hashtags = contenido.match(/#[a-zA-Z0-9_]+/g) || [];
      if (hashtags.length > 5) {
        errores.push(`Se encontraron ${hashtags.length} hashtags. El máximo permitido es 5.`);
      }

      // Validación de imagen (si existe)
      if (pub.imagen_url) {
        try {
          // Intentamos obtener los headers de la imagen para validar tamaño y tipo
          const headRes = await fetch(pub.imagen_url, { method: 'HEAD' });
          if (headRes.ok) {
            const contentType = headRes.headers.get('content-type') || '';
            const contentLength = parseInt(headRes.headers.get('content-length') || '0', 10);
            
            if (!contentType.includes('image/jpeg') && !contentType.includes('image/png')) {
              errores.push('La imagen debe estar en formato JPG o PNG.');
            }
            if (contentLength > 8 * 1024 * 1024) {
              errores.push(`La imagen supera el peso máximo de 8MB.`);
            }
          }
        } catch (e) {
          console.warn(`No se pudo validar tamaño/tipo de imagen para publicación ${pub.id_publicacion}`, e);
        }
      } else {
         errores.push('La publicación no tiene una imagen asociada, lo cual es requerido para Instagram.');
      }

      // ==========================================
      // CAPA 2: Validación de Contenido con IA
      // ==========================================
      
      if (geminiApiKey && contenido.trim()) {
        try {
          const prompt = `Evalúa el siguiente texto de una publicación de redes sociales.
Debes rechazar contenido si contiene: 
- Lenguaje engañoso o clickbait excesivo
- Promesas falsas (ej. "gana dinero garantizado")
- Contenido que viole políticas de Meta (odio, violencia, desinformación médica o financiera)
- Spam evidente
- Texto corrupto o sin sentido producto de un error de generación.

Texto a evaluar:
"""
${contenido}
"""

Responde estrictamente en formato JSON válido (sin markdown, sin bloques de código) con la siguiente estructura:
{"aprobado": boolean, "razon": "string explicando el motivo, si fue rechazado"}
`;

          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
              }
            })
          });

          if (geminiRes.ok) {
            const aiData = await geminiRes.json();
            const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            
            try {
              const aiValidation = JSON.parse(cleanJson);
              if (aiValidation.aprobado === false) {
                errores.push(`Rechazado por moderación IA: ${aiValidation.razon}`);
              }
            } catch (parseError) {
              console.error("Error parseando JSON de Gemini:", cleanJson);
            }
          } else {
             console.error("Gemini API error:", await geminiRes.text());
             // NOTA: Si falla técnicamente, NO bloqueamos al cliente. Registramos el fallo y dejamos pasar.
          }
        } catch (aiError) {
          console.error("Error en llamada a Gemini de moderación:", aiError);
          // NOTA: Fallo técnico, NO bloqueamos.
        }
      }

      // ==========================================
      // Guardar resultados
      // ==========================================
      const estado_validacion = errores.length > 0 ? 'rechazado' : 'aprobado';
      
      if (errores.length > 0) {
        allValid = false;
        allErrors[pub.id_publicacion] = errores;
      }

      await supabaseClient
        .from('publicaciones')
        .update({
          validacion_estado: estado_validacion,
          validacion_errores: errores
        })
        .eq('id_publicacion', pub.id_publicacion);
    }

    if (!allValid) {
      return new Response(JSON.stringify({ 
        ok: false, 
        valido: false, 
        error: 'El contenido no cumple con las políticas de validación.',
        detalles: allErrors
      }), {
        status: 200, // Devolvemos 200 porque la validación se ejecutó correctamente, el resultado es lo que falló.
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, valido: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
