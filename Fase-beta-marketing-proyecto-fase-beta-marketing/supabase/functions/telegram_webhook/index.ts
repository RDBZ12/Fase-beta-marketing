// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const update = await req.json()
    console.log("Recibido update de Telegram:", update)

    let message = update.message || update.channel_post
    if (!message) return new Response('OK', { status: 200 })

    const text = message.text || ''
    if (text.startsWith('/start ')) {
      const code = text.split(' ')[1]
      const chatId = message.chat.id
      const chatType = message.chat.type
      let tipo = 'contacto'
      if (chatType === 'group' || chatType === 'supergroup') tipo = 'grupo'
      if (chatType === 'channel') tipo = 'canal'

      let nombreVisible = message.chat.title || message.chat.first_name || 'Destino Telegram'
      if (message.chat.last_name) nombreVisible += ' ' + message.chat.last_name

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Buscar usuario con ese código
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('codigo_vinculacion_telegram', code)
        .single()

      if (usuario) {
        // Upsert en telegram_destinos
        const { error: upsertError } = await supabase
          .from('telegram_destinos')
          .upsert({
            cliente_id: usuario.id_usuario,
            chat_id: chatId,
            nombre_visible: nombreVisible,
            tipo: tipo
          }, { onConflict: 'chat_id' })

        if (upsertError) {
          console.error("Error guardando destino:", upsertError)
        } else {
          // Send confirmation message to Telegram
          const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
          if (token) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: "✅ Destino vinculado exitosamente a tu cuenta de MarketIA."
              })
            })
          }
        }
      } else {
        console.log("Código de vinculación no encontrado:", code)
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error en webhook:', error)
    return new Response('OK', { status: 200 }) // Return 200 so Telegram doesn't retry infinitely
  }
})
