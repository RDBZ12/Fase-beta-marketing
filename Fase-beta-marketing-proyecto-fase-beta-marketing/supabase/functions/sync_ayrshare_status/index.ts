// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ayrshareApiKey = Deno.env.get('AYRSHARE_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar publicaciones programadas que ya deberían haberse publicado
    const { data: posts, error: fetchErr } = await supabase
      .from('publicaciones')
      .select('id_publicacion, ayrshare_post_id')
      .eq('estado', 'Programada')
      .not('ayrshare_post_id', 'is', null)
      .lte('fecha_publicacion', new Date().toISOString())

    if (fetchErr) throw fetchErr

    const results = []

    for (const post of posts || []) {
      // Consultar historial en Ayrshare
      const res = await fetch(`https://api.ayrshare.com/api/history/${post.ayrshare_post_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ayrshareApiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const history = await res.json()
      
      if (history && history.status === 'success' && history.postIds && history.postIds.length > 0) {
        // Extraer la URL de Instagram (o de la primera plataforma)
        const instagramPost = history.postIds.find((p: any) => p.platform === 'instagram') || history.postIds[0]
        const socialUrl = instagramPost?.postUrl

        if (socialUrl) {
          // Actualizar la publicación en nuestra BD
          await supabase
            .from('publicaciones')
            .update({ 
              estado: 'Publicada', 
              instagram_url: socialUrl 
            })
            .eq('id_publicacion', post.id_publicacion)

          results.push({ id: post.id_publicacion, status: 'updated', url: socialUrl })
        }
      } else {
        results.push({ id: post.id_publicacion, status: 'pending_or_error', history })
      }
    }

    return new Response(JSON.stringify({ status: 'success', synced: results }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
