// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan credenciales')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const now = new Date().toISOString()
    
    const { data: posts, error } = await supabase
      .from('publicaciones')
      .select('*, redes_sociales(nombre_red)')
      .eq('estado', 'Programada')
      .lte('fecha_publicacion', now)

    if (error) throw error

    if (posts.length > 0) {
      console.log(`Cron comprobando... Encontradas ${posts.length} listas para publicar.`);
    }
    for (const post of posts) {
      try {
        const redNombre = post.redes_sociales?.nombre_red || ''
        let platform = 'instagram'
        if (redNombre.toLowerCase().includes('face')) platform = 'facebook'
        else if (redNombre.toLowerCase().includes('twit') || redNombre.toLowerCase().includes('x')) platform = 'twitter'
        else if (redNombre.toLowerCase().includes('tele')) platform = 'telegram'
        else if (redNombre.toLowerCase().includes('link')) platform = 'linkedin'
        else if (redNombre.toLowerCase().includes('tik')) platform = 'tiktok'
        else if (redNombre.toLowerCase().includes('you')) platform = 'youtube'

        console.log(`Invocando publish_social para post ${post.id_publicacion} en plataforma ${platform}`);
        
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('publish_social', {
          body: {
            post: post.contenido,
            platforms: [platform],
            mediaUrls: post.imagen_url ? [post.imagen_url] : [],
          }
        })

        console.log(`Respuesta de publish_social:`, JSON.stringify(invokeData), "Error:", invokeError);

        if (!invokeError && (!invokeData || !invokeData.error)) {
          await supabase
            .from('publicaciones')
            .update({ estado: 'Publicada', ayrshare_post_id: invokeData?.data?.id || 'via-cron' })
            .eq('id_publicacion', post.id_publicacion)
        }
      } catch (e) {
        console.error("Error individual post:", e)
      }
    }

    return new Response(JSON.stringify({ success: true, count: posts.length }))
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
