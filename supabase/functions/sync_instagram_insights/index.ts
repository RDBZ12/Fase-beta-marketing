// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function obtenerInsights(mediaId: string, accessToken: string) {
  const metrics = 'likes,comments,saved,reach,impressions'
  const url = `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || `Error HTTP ${res.status}`)
  }

  const resultado: Record<string, number> = {}
  if (data.data) {
    for (const item of data.data) {
      resultado[item.name] = item.values?.[0]?.value ?? 0
    }
  }
  return resultado
}

serve(async (req) => {
  // Asegurarnos de que el endpoint cron no sea abusado, aunque Supabase lo protege por defecto.
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Trae publicaciones publicadas con instagram_media_id, 
  // priorizando las que no se han actualizado en las últimas 6 horas
  const hace6horas = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  // En tu tabla la columna de estado se llama 'estado' (con valores como 'Publicada' o 'Programada')
  const { data: publicaciones, error } = await supabase
    .from('publicaciones')
    .select('id_publicacion, instagram_media_id, id_campana, campaigns!inner(id_usuario, id_cliente)')
    .eq('estado', 'Publicada')
    .not('instagram_media_id', 'is', null)
    .or(`metricas_actualizado_en.is.null,metricas_actualizado_en.lt.${hace6horas}`)
    .limit(100)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const resultados = []

  for (const pub of publicaciones ?? []) {
    try {
      // Necesitamos encontrar el token del cliente. 
      // El cliente es el id_usuario o id_cliente asociado a la campaña de la publicación.
      const userId = pub.campaigns?.id_cliente || pub.campaigns?.id_usuario;

      if (!userId) {
         resultados.push({ id: pub.id_publicacion, resultado: 'sin_usuario' })
         continue
      }

      // Supongamos que el token se guarda en la tabla `usuarios` o `clientes`. 
      // Basado en el prompt, buscaré `instagram_access_token` en `usuarios`.
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('instagram_access_token')
        .eq('id_usuario', userId)
        .maybeSingle()

      if (!usuario?.instagram_access_token) {
        resultados.push({ id: pub.id_publicacion, resultado: 'sin_token' })
        continue
      }

      const insights = await obtenerInsights(pub.instagram_media_id, usuario.instagram_access_token)

      await supabase
        .from('publicaciones')
        .update({
          metricas_likes: insights.likes ?? 0,
          metricas_comentarios: insights.comments ?? 0,
          metricas_guardados: insights.saved ?? 0,
          metricas_alcance: insights.reach ?? 0,
          metricas_impresiones: insights.impressions ?? 0,
          metricas_actualizado_en: new Date().toISOString(),
          last_metrics_sync: new Date().toISOString(),
        })
        .eq('id_publicacion', pub.id_publicacion)

      resultados.push({ id: pub.id_publicacion, resultado: 'exito' })

    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err)
      console.error(`Error insights publicación ${pub.id_publicacion}:`, mensaje)
      resultados.push({ id: pub.id_publicacion, resultado: 'error', error: mensaje })
    }
  }

  return new Response(JSON.stringify({ procesadas: resultados.length, resultados }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
