// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const { publicacion_id, destino_id } = await req.json()
    if (!publicacion_id || !destino_id) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros.' }), { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!telegramToken) {
      return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN no configurado.' }), { status: 500, headers: corsHeaders })
    }

    // Obtener info de la publicación
    const { data: pub, error: pubError } = await supabase
      .from('publicaciones')
      .select('contenido, imagen_url, telegram_file_id')
      .eq('id_publicacion', publicacion_id)
      .single()

    if (pubError || !pub) throw new Error("Publicación no encontrada.")

    // Obtener info del destino
    const { data: destino, error: destError } = await supabase
      .from('telegram_destinos')
      .select('chat_id')
      .eq('id', destino_id)
      .single()

    if (destError || !destino) throw new Error("Destino de Telegram no encontrado.")

    const chatId = destino.chat_id
    const caption = pub.contenido

    let telegramRes;
    
    // Si ya tenemos el file_id en caché, lo reusamos (Ahorro de Egress)
    if (pub.telegram_file_id) {
      telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: pub.telegram_file_id,
          caption: caption
        })
      })
    } else {
      // No tenemos file_id cacheado. Debemos enviar la imagen mediante su URL pública (si es accesible)
      // Telegram permite enviar photos por URL, y Telegram se encarga de descargarla, AHORRANDO egress extra de nuestra app si la URL es pública.
      let photoUrl = pub.imagen_url;
      // Asegurar extensión si es IA
      if (photoUrl && photoUrl.includes('pollinations.ai') && !photoUrl.includes('.jpg')) {
        const parts = photoUrl.split('?');
        photoUrl = parts[0] + '.jpg' + (parts[1] ? '?' + parts[1] : '');
      }
      
      telegramRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption: caption
        })
      })
    }

    const tgData = await telegramRes.json()

    if (!tgData.ok) {
      throw new Error("Telegram API Error: " + (tgData.description || 'Unknown error'))
    }

    // Guardar cache del file_id si no existía y la respuesta fue exitosa
    if (!pub.telegram_file_id && tgData.result && tgData.result.photo) {
      // Tomamos el último objeto photo (es la mayor resolución)
      const photos = tgData.result.photo
      const bestPhoto = photos[photos.length - 1]
      
      if (bestPhoto && bestPhoto.file_id) {
        await supabase
          .from('publicaciones')
          .update({ telegram_file_id: bestPhoto.file_id })
          .eq('id_publicacion', publicacion_id)
      }
    }

    return new Response(JSON.stringify({ status: 'success', data: tgData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Error enviando a Telegram:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
