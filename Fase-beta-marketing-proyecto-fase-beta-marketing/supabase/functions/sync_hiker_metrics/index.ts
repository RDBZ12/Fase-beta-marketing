// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const hikerApiKey = Deno.env.get('HIKER_API_KEY')!

    if (!hikerApiKey) throw new Error("HIKER_API_KEY is missing")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar publicaciones públicas con URL de Instagram
    const { data: posts, error: fetchErr } = await supabase
      .from('publicaciones')
      .select('id_publicacion, instagram_url')
      .eq('estado', 'Publicada')
      .not('instagram_url', 'is', null)

    if (fetchErr) throw fetchErr

    const results = []
    const today = new Date().toISOString().split('T')[0]

    for (const post of posts || []) {
      try {
        const hikerUrl = `https://api.hikerapi.com/v2/media/by/url?url=${encodeURIComponent(post.instagram_url)}`
        
        const res = await fetch(hikerUrl, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-access-key': hikerApiKey
          }
        })
        
        if (!res.ok) {
          results.push({ id: post.id_publicacion, error: `HikerAPI status ${res.status}` })
          continue
        }

        const metricsData = await res.json()
        
        // Asumiendo la estructura devuelta por HikerAPI:
        // { edge_media_preview_like: { count: X }, edge_media_to_comment: { count: Y }, video_view_count: Z }
        const likes = metricsData.edge_media_preview_like?.count || 0
        const comments = metricsData.edge_media_to_comment?.count || 0
        const views = metricsData.video_view_count || metricsData.view_count || 0

        // Insertar interacciones del día (Usamos ON CONFLICT gracias al UNIQUE constraint)
        const interacciones = []
        if (likes > 0) interacciones.push({ id_publicacion: post.id_publicacion, tipo_interaccion: 'like', cantidad: likes, fecha: today })
        if (comments > 0) interacciones.push({ id_publicacion: post.id_publicacion, tipo_interaccion: 'comentario', cantidad: comments, fecha: today })
        if (views > 0) interacciones.push({ id_publicacion: post.id_publicacion, tipo_interaccion: 'impresion', cantidad: views, fecha: today })

        if (interacciones.length > 0) {
          const { error: upsertErr } = await supabase
            .from('interacciones')
            .upsert(interacciones, { onConflict: 'id_publicacion,tipo_interaccion,fecha' })
            
          if (upsertErr) throw upsertErr
        }

        // Actualizar la última fecha de sincronización
        await supabase
          .from('publicaciones')
          .update({ last_metrics_sync: new Date().toISOString() })
          .eq('id_publicacion', post.id_publicacion)

        results.push({ id: post.id_publicacion, status: 'success', likes, comments, views })
      } catch (err: any) {
        results.push({ id: post.id_publicacion, error: err.message })
      }
    }

    return new Response(JSON.stringify({ status: 'success', synced: results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
